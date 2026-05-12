import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Briefcase, MapPin, DollarSign, Calendar, Tag, FileText, Loader2, CheckCircle, Plus
} from 'lucide-react';

const API_BASE = 'http://localhost:8006';

const FIELD = 'w-full px-4 py-3 rounded-xl border border-secondary/30 dark:border-dark-secondary/30 bg-background dark:bg-dark-background text-text dark:text-dark-text placeholder-text/40 dark:placeholder-dark-text/40 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-dark-primary/40 focus:border-primary dark:focus:border-dark-primary transition-all text-sm';
const LABEL = 'block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5';

const Field = ({ label, children }) => (
  <div>
    <label className={LABEL}>{label}</label>
    {children}
  </div>
);

const CreateJobModal = ({ token, onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', description: '', skills: '', location: '', jobType: 'full-time',
    salaryMin: '', salaryMax: '', deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.description || !form.location) {
      setError('Title, description and location are required'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/company/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          location: form.location,
          jobType: form.jobType,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
          deadline: form.deadline || null,
        }),
      });
      const data = await res.json();
      if (res.ok) { setDone(true); setTimeout(() => { onCreated(data); onClose(); }, 1200); }
      else setError(data.error || 'Failed to create job');
    } catch { setError('Network error'); }
    setLoading(false);
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
        className="bg-background dark:bg-dark-background rounded-3xl border border-secondary/20 dark:border-dark-secondary/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary/10 dark:border-dark-secondary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary dark:text-dark-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text dark:text-dark-text">Create Job Posting</h2>
              <p className="text-xs text-text/50 dark:text-dark-text/50">Fill in the details to attract candidates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors">
            <X className="w-5 h-5 text-text/50 dark:text-dark-text/50" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>
          )}

          {done && (
            <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Job posted successfully!
            </div>
          )}

          <Field label="Job Title *">
            <input type="text" value={form.title} onChange={set('title')} placeholder="e.g. Senior Frontend Engineer" className={FIELD} />
          </Field>

          <Field label="Job Description *">
            <textarea value={form.description} onChange={set('description')} placeholder="Describe the role, responsibilities, and requirements..." rows={4} className={`${FIELD} resize-none`} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Location *">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 dark:text-dark-text/30" />
                <input type="text" value={form.location} onChange={set('location')} placeholder="Remote / City" className={`${FIELD} pl-9`} />
              </div>
            </Field>
            <Field label="Job Type">
              <select value={form.jobType} onChange={set('jobType')} className={FIELD}>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </Field>
          </div>

          <Field label="Required Skills (comma separated)">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 dark:text-dark-text/30" />
              <input type="text" value={form.skills} onChange={set('skills')} placeholder="React, Node.js, TypeScript" className={`${FIELD} pl-9`} />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Min Salary (₹)">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 dark:text-dark-text/30" />
                <input type="number" value={form.salaryMin} onChange={set('salaryMin')} placeholder="500000" className={`${FIELD} pl-9`} />
              </div>
            </Field>
            <Field label="Max Salary (₹)">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 dark:text-dark-text/30" />
                <input type="number" value={form.salaryMax} onChange={set('salaryMax')} placeholder="1200000" className={`${FIELD} pl-9`} />
              </div>
            </Field>
          </div>

          <Field label="Application Deadline">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30 dark:text-dark-text/30" />
              <input type="date" value={form.deadline} onChange={set('deadline')} className={`${FIELD} pl-9`} />
            </div>
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-secondary/30 dark:border-dark-secondary/30 text-text/70 dark:text-dark-text/70 font-semibold hover:bg-secondary/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || done} className="flex-1 py-3 rounded-xl bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Posting…' : 'Post Job'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateJobModal;
