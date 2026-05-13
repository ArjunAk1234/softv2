import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Clock, User, Users, Plus, Loader2, CheckCircle,
  Trash2, UserCheck, ChevronDown, ChevronUp, UserPlus
} from 'lucide-react';

const API_BASE = 'http://localhost:8006';
const FIELD = 'w-full px-4 py-3 rounded-xl border border-secondary/30 dark:border-dark-secondary/30 bg-background dark:bg-dark-background text-text dark:text-dark-text placeholder-text/40 dark:placeholder-dark-text/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm';

const InterviewScheduler = ({ job, token, onClose }) => {
  const [interviewers, setInterviewers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('slots'); // 'slots' | 'create' | 'bulk' | 'interviewers'
  const [form, setForm] = useState({ interviewerId: '', scheduledAt: '', duration: 45 });
  const [bulk, setBulk] = useState({ interviewerId: '', startDate: '', endDate: '', slotsPerDay: 3, startHour: 10, duration: 45 });
  const [newIv, setNewIv] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setBulkF = k => e => setBulk(f => ({ ...f, [k]: e.target.value }));

  const fetchData = async () => {
    setLoading(true);
    const h = { Authorization: `Bearer ${token}` };
    const [ivRes, slotRes] = await Promise.all([
      fetch(`${API_BASE}/interview/company/interviewers`, { headers: h }),
      fetch(`${API_BASE}/interview/company/slots/${job.id}`, { headers: h }),
    ]);
    if (ivRes.ok) setInterviewers(await ivRes.json());
    if (slotRes.ok) setSlots(await slotRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createSlot = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.interviewerId || !form.scheduledAt) { setError('Interviewer and date/time required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/interview/company/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: job.id, interviewerId: Number(form.interviewerId), scheduledAt: form.scheduledAt, durationMinutes: Number(form.duration) }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess('Slot created!'); setForm({ interviewerId: '', scheduledAt: '', duration: 45 }); fetchData(); setTab('slots'); }
      else setError(data.error || 'Failed');
    } catch { setError('Network error'); }
    setSaving(false);
  };

  const createInterviewer = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!newIv.name || !newIv.email || !newIv.password) { setError('All fields required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/interview/company/interviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newIv),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Interviewer ${newIv.name} created! They can log in with: ${newIv.email}`);
        setNewIv({ name: '', email: '', password: '' });
        fetchData();
      } else setError(data.error || 'Failed to create');
    } catch { setError('Network error'); }
    setSaving(false);
  };

  const createBulk = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!bulk.interviewerId || !bulk.startDate || !bulk.endDate) { setError('All fields required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/interview/company/slots/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: job.id, interviewerId: Number(bulk.interviewerId), startDate: bulk.startDate, endDate: bulk.endDate, slotsPerDay: Number(bulk.slotsPerDay), startHour: Number(bulk.startHour), durationMinutes: Number(bulk.duration) }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(`Created ${data.created} slots!`); fetchData(); setTab('slots'); }
      else setError(data.error || 'Failed');
    } catch { setError('Network error'); }
    setSaving(false);
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm('Delete this slot?')) return;
    await fetch(`${API_BASE}/interview/company/slots/${slotId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSlots(s => s.filter(x => x.id !== slotId));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-background dark:bg-dark-background rounded-3xl border border-secondary/20 dark:border-dark-secondary/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary/10 dark:border-dark-secondary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text dark:text-dark-text">Interview Slots</h2>
              <p className="text-xs text-text/50 dark:text-dark-text/50">{job.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors">
            <X className="w-5 h-5 text-text/50 dark:text-dark-text/50" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-secondary/10 dark:border-dark-secondary/10 px-6">
          {[['slots', 'Slots'], ['create', '+ Single'], ['bulk', '+ Bulk'], ['interviewers', 'Interviewers']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${tab === id ? 'border-primary dark:border-dark-primary text-primary dark:text-dark-primary' : 'border-transparent text-text/40 dark:text-dark-text/40 hover:text-text dark:hover:text-dark-text'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>}
          {success && <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

          {/* SLOTS LIST */}
          {tab === 'slots' && (
            loading ? <div className="flex justify-center py-8"><Loader2 className="w-7 h-7 animate-spin text-primary dark:text-dark-primary" /></div>
            : slots.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No slots yet</p>
                <button onClick={() => setTab('create')} className="px-4 py-2 bg-primary dark:bg-dark-primary text-background dark:text-dark-background rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
                  Create First Slot
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {slots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-dark-background/40 border border-secondary/10 dark:border-dark-secondary/10 rounded-xl">
                    <div className="flex-1">
                      <p className="font-semibold text-text dark:text-dark-text text-sm">
                        {new Date(slot.scheduled_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">{slot.interviewer_name} · {slot.duration_minutes} min</p>
                      {slot.candidate_name && <p className="text-xs text-purple-500 mt-0.5">👤 {slot.candidate_name}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${slot.is_booked ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                        {slot.is_booked ? 'Booked' : 'Available'}
                      </span>
                      {!slot.is_booked && (
                        <button onClick={() => deleteSlot(slot.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* CREATE SINGLE */}
          {tab === 'create' && (
            <form onSubmit={createSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">Interviewer</label>
                <select value={form.interviewerId} onChange={set('interviewerId')} className={FIELD}>
                  <option value="">Select interviewer…</option>
                  {interviewers.map(iv => <option key={iv.id} value={iv.id}>{iv.name} ({iv.email})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">Date & Time</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} className={FIELD} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">Duration (min)</label>
                  <input type="number" value={form.duration} onChange={set('duration')} className={FIELD} min="15" max="120" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Creating…' : 'Create Slot'}
              </button>
            </form>
          )}

          {/* INTERVIEWERS LIST + ADD */}
          {tab === 'interviewers' && (
            <div className="space-y-5">
              {/* Existing interviewers */}
              <div>
                <p className="text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-2">Current Interviewers</p>
                {interviewers.length === 0 ? (
                  <p className="text-sm text-gray-400">No interviewers added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {interviewers.map(iv => (
                      <div key={iv.id} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-dark-background/40 border border-secondary/10 dark:border-dark-secondary/10 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-text dark:text-dark-text text-sm">{iv.name}</p>
                          <p className="text-xs text-gray-400">{iv.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Add new interviewer */}
              <div>
                <p className="text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-3">Add New Interviewer</p>
                <form onSubmit={createInterviewer} className="space-y-3">
                  <input value={newIv.name} onChange={e => setNewIv(p => ({...p, name: e.target.value}))} placeholder="Full Name" className={FIELD} />
                  <input type="email" value={newIv.email} onChange={e => setNewIv(p => ({...p, email: e.target.value}))} placeholder="Email address" className={FIELD} />
                  <input type="password" value={newIv.password} onChange={e => setNewIv(p => ({...p, password: e.target.value}))} placeholder="Temporary password" className={FIELD} />
                  <p className="text-xs text-gray-400">They will log in using this email + password.</p>
                  <button type="submit" disabled={saving}
                    className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {saving ? 'Creating…' : 'Create Interviewer Account'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* BULK CREATE */}
          {tab === 'bulk' && (
            <form onSubmit={createBulk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">Interviewer</label>
                <select value={bulk.interviewerId} onChange={setBulkF('interviewerId')} className={FIELD}>
                  <option value="">Select interviewer…</option>
                  {interviewers.map(iv => <option key={iv.id} value={iv.id}>{iv.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input type="date" value={bulk.startDate} onChange={setBulkF('startDate')} className={FIELD} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" value={bulk.endDate} onChange={setBulkF('endDate')} className={FIELD} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">Slots/Day</label>
                  <input type="number" value={bulk.slotsPerDay} onChange={setBulkF('slotsPerDay')} className={FIELD} min="1" max="8" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">Start Hour</label>
                  <input type="number" value={bulk.startHour} onChange={setBulkF('startHour')} className={FIELD} min="8" max="18" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5">Duration (min)</label>
                  <input type="number" value={bulk.duration} onChange={setBulkF('duration')} className={FIELD} min="15" max="120" />
                </div>
              </div>
              <p className="text-xs text-gray-400">Slots auto-created on weekdays within the date range, starting at the hour you set.</p>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {saving ? 'Generating…' : 'Generate Slots'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InterviewScheduler;
