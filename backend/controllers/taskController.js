const Task = require('../models/Task');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

exports.createTask = async (req, res) => {
  try {
    const { complaint_id, title, description, budget_estimate } = req.body;
    const admin_id = req.user.userId; // from auth middleware

    // Verify complaint exists & isn't already a task
    const complaint = await Complaint.findById(complaint_id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const existingTask = await Task.findOne({ complaint_id });
    if (existingTask) return res.status(400).json({ error: 'Task already exists for this complaint' });

    const task = new Task({
      complaint_id,
      created_by: admin_id,
      title,
      description,
      budget_estimate
    });

    await task.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const status = req.query.status || 'Open';
    const tasks = await Task.find({ status })
      .populate('complaint_id')
      .sort({ created_at: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.applyForTask = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { role, bid_amount, message } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'Open') return res.status(400).json({ error: 'Task is no longer open for applications' });

    // Check if already applied
    const alreadyApplied = task.applications.some(app => app.user_id.toString() === user_id.toString());
    if (alreadyApplied) return res.status(400).json({ error: 'You have already applied for this task' });

    task.applications.push({
      user_id,
      role, // 'Contractor' or 'Sponsor'
      bid_amount,
      message
    });

    await task.save();
    res.json({ message: 'Application submitted successfully', task });
  } catch (err) {
    console.error('Error applying for task:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.approveApplication = async (req, res) => {
  try {
    const task_id = req.params.id;
    const { application_id } = req.body;

    const task = await Task.findById(task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const application = task.applications.id(application_id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Update application status
    application.status = 'Approved';
    
    // Auto-reject others
    task.applications.forEach(app => {
      if (app._id.toString() !== application_id.toString()) {
        app.status = 'Rejected';
      }
    });

    // Assign task
    task.assigned_to = application.user_id;
    task.assigned_role = application.role;
    task.assigned_amount = application.bid_amount;
    task.status = 'Assigned';

    await task.save();

    // Update complaint status to In Progress
    await Complaint.findByIdAndUpdate(task.complaint_id, {
      status: 'In Progress',
      $push: {
        status_history: {
          status: 'In Progress',
          note: `Task assigned to a ${application.role.toLowerCase()}`,
          timestamp: new Date()
        }
      }
    });

    res.json({ message: 'Application approved and task assigned', task });
  } catch (err) {
    console.error('Error approving application:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
