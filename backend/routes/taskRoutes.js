const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { userAuth, adminAuth } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// Flexible auth — accepts either user OR admin token (for admin dashboards to read tasks)
const anyAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.tokenType = decoded.type; // 'user' or 'admin'
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Open tasks viewable by users AND admins
router.get('/', anyAuth, taskController.getTasks);

// Apply for a task (users only)
router.post('/:id/apply', userAuth, taskController.applyForTask);

// Admin only routes
router.post('/', adminAuth, taskController.createTask);
router.post('/:id/approve', adminAuth, taskController.approveApplication);

module.exports = router;

