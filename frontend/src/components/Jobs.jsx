import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Search, Loader2, MapPin, Clock, Users,
  Trash2, Eye, UserPlus, CheckCircle, AlertCircle
} from 'lucide-react';

import CreateJobModal from './CreateJobModal';
import CompanyJobView from './CompanyJobView';
import InterviewerManager from './InterviewerManager';
import ApplyModal from './ApplyModal';
import JobDetails from './JobDetails';

const API_BASE = 'http://localhost:8006';

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ active }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
    {active ? 'Active' : 'Closed'}
  </span>
);

// ─── COMPANY JOB CARD ────────────────────────────────────────────────────────
const CompanyJobCard = ({ job, onManage, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 dark:hover:border-dark-primary/30 transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-text dark:text-dark-text text-lg group-hover:text-primary dark:group-hover:text-dark-primary transition-colors truncate">{job.title}</h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin className="w-3 h-3" />{job.location}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{job.job_type}</span>
        </div>
      </div>
      <StatusBadge active={job.is_active} />
    </div>

    {/* Skill pills */}
    {job.skills?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.skills.slice(0, 4).map(sk => (
          <span key={sk} className="px-2 py-0.5 bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary rounded-md text-xs font-medium">{sk}</span>
        ))}
        {job.skills.length > 4 && <span className="text-xs text-gray-400">+{job.skills.length - 4} more</span>}
      </div>
    )}

    {/* Stats row */}
    <div className="flex items-center gap-4 mb-4 text-sm">
      <span className="flex items-center gap-1.5 font-semibold text-text dark:text-dark-text">
        <Users className="w-4 h-4 text-blue-400" /> {job.total_applicants ?? 0} applicants
      </span>
      {job.hired > 0 && (
        <span className="flex items-center gap-1.5 font-semibold text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" /> {job.hired} hired
        </span>
      )}
      {job.deadline && (
        <span className="text-gray-400 text-xs ml-auto">
          Deadline: {new Date(job.deadline).toLocaleDateString()}
        </span>
      )}
    </div>

    {/* Actions */}
    <div className="flex gap-2">
      <button
        onClick={() => onManage(job)}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary dark:bg-dark-primary text-background dark:text-dark-background rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
      >
        <Eye className="w-4 h-4" /> Manage Applicants
      </button>
      <button
        onClick={() => onDelete(job.id)}
        className="p-2.5 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

// ─── CANDIDATE JOB CARD ───────────────────────────────────────────────────────
const CandidateJobCard = ({ job, onView, onApply, applied }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 dark:hover:border-dark-primary/30 transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-text dark:text-dark-text text-lg group-hover:text-primary dark:group-hover:text-dark-primary transition-colors truncate">{job.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{job.company_name}</p>
      </div>
      {applied && (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold flex-shrink-0 ml-2">
          <CheckCircle className="w-3 h-3" /> Applied
        </span>
      )}
    </div>

    <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.job_type}</span>
      {(job.salary_min || job.salary_max) && (
        <span>₹{job.salary_min?.toLocaleString()} – ₹{job.salary_max?.toLocaleString()}</span>
      )}
    </div>

    {job.skills?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.skills.slice(0, 4).map(sk => (
          <span key={sk} className="px-2 py-0.5 bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary rounded-md text-xs font-medium">{sk}</span>
        ))}
      </div>
    )}

    <button
      onClick={() => job.applied ? onView(job) : onApply(job)}
      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
        applied
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
          : 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90'
      }`}
    >
      {applied ? '✓ Already Applied' : 'View & Apply'}
    </button>
  </motion.div>
);

// ─── MAIN JOBS PAGE ───────────────────────────────────────────────────────────
const Jobs = () => {
  const { auth } = useAuth();
  const role = auth?.user?.role;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  // Modals / sub-views
  const [showCreate, setShowCreate] = useState(false);
  const [showInterviewers, setShowInterviewers] = useState(false);
  const [managingJob, setManagingJob] = useState(null);   // company view
  const [viewingJob, setViewingJob] = useState(null);     // candidate job detail
  const [applyingJob, setApplyingJob] = useState(null);   // apply modal

  const fetchJobs = async () => {
    setLoading(true); setError('');
    try {
      const endpoint = role === 'company' ? `${API_BASE}/company/jobs` : `${API_BASE}/candidate/jobs`;
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${auth.token}` } });
      const data = await res.json();
      if (res.ok) setJobs(Array.isArray(data) ? data : []);
      else setError(data.error || 'Failed to load jobs');
    } catch { setError('Network error — make sure the backend is running.'); }
    setLoading(false);
  };

  useEffect(() => { if (auth?.token) fetchJobs(); }, [auth?.token]);

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) return;
    await fetch(`${API_BASE}/company/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setJobs(j => j.filter(x => x.id !== jobId));
  };

  const filtered = jobs.filter(j => {
    if (!search) return true;
    const q = search.toLowerCase();
    return j.title?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      (j.company_name || '').toLowerCase().includes(q);
  });

  // ── Sub-views ────────────────────────────────────────────────────────────
  if (managingJob) {
    return (
      <CompanyJobView
        job={managingJob}
        token={auth.token}
        onBack={() => { setManagingJob(null); fetchJobs(); }}
      />
    );
  }

  if (viewingJob) {
    return (
      <JobDetails
        job={{ ...viewingJob, company: viewingJob.company_name, requirements: viewingJob.skills || [] }}
        onBack={() => setViewingJob(null)}
        onApply={() => { setViewingJob(null); setApplyingJob(viewingJob); }}
        hasApplied={viewingJob.applied}
      />
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text dark:text-dark-text">
              {role === 'company' ? 'Job Postings' : 'Browse Jobs'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {role === 'company' ? 'Create and manage your open positions' : 'Find your next opportunity'}
            </p>
          </div>

          {role === 'company' && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowInterviewers(true)}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-purple-400 dark:border-purple-600 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Manage Interviewers
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary dark:bg-dark-primary text-background dark:text-dark-background rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Post a Job
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={role === 'company' ? 'Search your job postings…' : 'Search jobs by title, company, location…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-text dark:text-dark-text placeholder-gray-400 focus:outline-none text-sm"
          />
          <button onClick={fetchJobs} className="text-xs font-bold text-primary dark:text-dark-primary hover:opacity-70 transition-opacity flex-shrink-0">
            ↻ Refresh
          </button>
        </div>

        {/* Count */}
        <p className="text-sm text-gray-400 mb-5">
          {filtered.length} of {jobs.length} {role === 'company' ? 'postings' : 'jobs'}
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">{search ? 'No jobs match your search' : role === 'company' ? 'No jobs posted yet' : 'No jobs available'}</p>
            {role === 'company' && !search && (
              <button onClick={() => setShowCreate(true)} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-dark-primary text-background dark:text-dark-background rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Post your first job
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(job =>
              role === 'company' ? (
                <CompanyJobCard key={job.id} job={job} onManage={setManagingJob} onDelete={handleDelete} />
              ) : (
                <CandidateJobCard key={job.id} job={job} onView={setViewingJob} onApply={setApplyingJob} applied={job.applied} />
              )
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateJobModal
            token={auth.token}
            onClose={() => setShowCreate(false)}
            onCreated={newJob => { setJobs(j => [newJob, ...j]); setShowCreate(false); }}
          />
        )}
        {showInterviewers && (
          <InterviewerManager token={auth.token} onClose={() => setShowInterviewers(false)} />
        )}
        {applyingJob && (
          <ApplyModal
            job={applyingJob}
            token={auth.token}
            onClose={() => setApplyingJob(null)}
            onApplied={() => { fetchJobs(); navigate('/applications'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Jobs;
