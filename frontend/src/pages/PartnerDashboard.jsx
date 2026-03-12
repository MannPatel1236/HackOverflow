import { useState, useEffect } from 'react';
import { getTasks, applyForTask } from '../utils/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Modal state
  const [role, setRole] = useState('Contractor');
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getTasks();
      // Only show tasks that are open or assigned to the current user
      const relevantTasks = res.data.filter(t => 
        t.status === 'Open' || (t.assigned_to && t.assigned_to === user._id)
      );
      setTasks(relevantTasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) {
      return setError('Please enter a valid amount.');
    }

    try {
      setSubmitting(true);
      setError('');
      await applyForTask(selectedTask._id, {
        role,
        bid_amount: Number(bidAmount),
        message
      });
      setSelectedTask(null);
      setBidAmount('');
      setMessage('');
      fetchTasks(); // Refresh to show "Applied" state
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasApplied = (task) => {
    return task.applications?.some(app => app.user_id === user._id);
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading available projects...</div>;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-[32px]">
          <h1 className="font-serif text-[32px] font-bold text-text mb-2">Partner Dashboard</h1>
          <p className="text-[14px] text-muted">Welcome, {user?.name || 'Partner'}. Browse open projects to bid as a contractor or fund as a sponsor.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
          {tasks.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white border border-border rounded-[8px]">
              <p className="text-muted">No open projects available at the moment.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task._id} className="card p-[24px] bg-white border border-border rounded-[8px] flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[11px] font-bold px-2 py-1 uppercase rounded ${
                      task.status === 'Open' ? 'bg-amber-bg text-amber border border-amber/20' : 'bg-green-bg text-green border border-green/20'
                    }`}>
                      {task.status}
                    </span>
                    <span className="text-[12px] font-mono text-muted">Budget: ₹{task.budget_estimate?.toLocaleString()}</span>
                  </div>
                  <h3 className="font-bold text-[18px] text-text mb-2 line-clamp-2">{task.title}</h3>
                  <p className="text-[13px] text-muted line-clamp-3 mb-4">{task.description}</p>
                </div>

                <div className="pt-4 border-t border-border">
                  {task.status === 'Open' && !hasApplied(task) ? (
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="w-full btn-primary py-[10px] text-[13px] shadow-[0_4px_14px_rgba(139,26,26,0.15)]"
                    >
                      Verify / Apply for Project
                    </button>
                  ) : task.assigned_to === user._id ? (
                    <div className="text-center py-[10px] text-[13px] font-bold text-green bg-green-bg/50 border border-green/20 rounded-[4px]">
                      Project Awarded to You
                    </div>
                  ) : hasApplied(task) ? (
                    <div className="text-center py-[10px] text-[13px] font-bold text-amber bg-amber-bg/50 border border-amber/20 rounded-[4px]">
                      Application Pending Review
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Application Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[12px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-[24px] py-[20px] border-b border-border flex justify-between items-center bg-cream">
              <h3 className="font-bold text-[18px] text-text">Apply for Project</h3>
              <button onClick={() => setSelectedTask(null)} className="text-muted hover:text-text cursor-pointer">✕</button>
            </div>
            
            <div className="p-[24px] overflow-y-auto">
              <div className="mb-6">
                <h4 className="font-semibold text-[15px] mb-1">{selectedTask.title}</h4>
                <p className="text-[12px] text-muted">Estimated Budget: ₹{selectedTask.budget_estimate?.toLocaleString()}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-burg-bg border border-burg/20 text-burg text-[13px] rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-text uppercase mb-2">My Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setRole('Contractor')}
                      className={`p-3 rounded border text-center cursor-pointer transition-colors ${role === 'Contractor' ? 'border-burg bg-burg-bg text-burg font-bold' : 'border-border text-muted hover:bg-cream'}`}
                    >
                      Contractor (Bid)
                    </div>
                    <div 
                      onClick={() => setRole('Sponsor')}
                      className={`p-3 rounded border text-center cursor-pointer transition-colors ${role === 'Sponsor' ? 'border-green bg-green-bg text-green font-bold' : 'border-border text-muted hover:bg-cream'}`}
                    >
                      Sponsor (Fund)
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-text uppercase mb-2">
                    {role === 'Contractor' ? 'Bid Amount (₹)' : 'Funding Amount (₹)'}
                  </label>
                  <input 
                    type="number" 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="input w-full bg-cream focus:border-burg"
                    required
                  />
                  <p className="text-[11px] text-muted mt-1">If Contractor, this is what you charge. If Sponsor, this is what you give.</p>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-text uppercase mb-2">Message (Optional)</label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details about your experience or conditions..."
                    className="input w-full min-h-[80px] bg-cream focus:border-burg"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setSelectedTask(null)} className="btn-ghost flex-1 py-3 text-[14px] bg-white border border-border">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 text-[14px]">
                    {submitting ? 'Submitting...' : 'Confirm Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
