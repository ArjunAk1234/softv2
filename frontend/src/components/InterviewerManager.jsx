import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UserPlus, User, Mail, Lock, Loader2, CheckCircle, Trash2, Eye, EyeOff, Users
} from 'lucide-react';

const API_BASE = 'http://localhost:8006';
const FIELD = 'w-full px-4 py-3 rounded-xl border border-secondary/30 dark:border-dark-secondary/30 bg-background dark:bg-dark-background text-text dark:text-dark-text placeholder-text/40 dark:placeholder-dark-text/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm';

const InterviewerManager = ({ token, onClose }) => {
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const fetchInterviewers = async () => {
    try {
      const res = await fetch(`${API_BASE}/interview/company/interviewers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInterviewers(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchInterviewers(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.email || !form.password) { setError('All fields required'); return; }
    if (form.password.length < 6) { setError('Password min 6 chars'); return; }
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/interview/company/interviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Interviewer "${form.name}" created. They can log in with ${form.email}`);
        setForm({ name: '', email: '', password: '' });
        fetchInterviewers();
      } else setError(data.error || 'Failed to create');
    } catch { setError('Network error'); }
    setCreating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-background dark:bg-dark-background rounded-3xl border border-secondary/20 dark:border-dark-secondary/20 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary/10 dark:border-dark-secondary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text dark:text-dark-text">Manage Interviewers</h2>
              <p className="text-xs text-text/50 dark:text-dark-text/50">Create interviewer accounts for your team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors">
            <X className="w-5 h-5 text-text/50 dark:text-dark-text/50" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create form */}
          <div className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-2xl p-5 border border-secondary/15 dark:border-dark-secondary/15">
            <h3 className="text-sm font-bold text-text/70 dark:text-dark-text/70 uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add New Interviewer
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>}
              {success && <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 dark:text-dark-text/30" />
                <input type="text" value={form.name} onChange={set('name')} placeholder="Full Name" className={`${FIELD} pl-9`} />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 dark:text-dark-text/30" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="Email Address" className={`${FIELD} pl-9`} />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 dark:text-dark-text/30" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Temporary Password" className={`${FIELD} pl-9 pr-10`} />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text/30 dark:text-dark-text/30 hover:opacity-70">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={creating} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {creating ? 'Creating…' : 'Create Interviewer Account'}
              </button>
            </form>
          </div>

          {/* List */}
          <div>
            <h3 className="text-sm font-bold text-text/70 dark:text-dark-text/70 uppercase tracking-wider mb-3">
              Your Interviewers ({interviewers.length})
            </h3>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary dark:text-dark-primary" /></div>
            ) : interviewers.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No interviewers yet. Create one above.</p>
            ) : (
              <div className="space-y-2">
                {interviewers.map(iv => (
                  <div key={iv.id} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-dark-background/40 border border-secondary/10 dark:border-dark-secondary/10 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text dark:text-dark-text text-sm truncate">{iv.name}</p>
                      <p className="text-xs text-gray-400 truncate">{iv.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InterviewerManager;
