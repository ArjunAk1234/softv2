import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, ClipboardList, User, CheckCircle, Clock, TrendingUp,
  ArrowRight, Calendar, Users, BarChart2, Loader2, Plus, Trophy,
  FileText, AlertCircle, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8006';

const card = 'bg-white/60 dark:bg-dark-background/50 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/60 rounded-xl p-6';

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={card}
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.bg}`}>
        <Icon className={`w-5 h-5 ${color.text}`} />
      </div>
    </div>
    <p className="text-3xl font-bold text-text dark:text-dark-text mb-1">{value ?? '—'}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
  </motion.div>
);

// ─── COMPANY DASHBOARD ────────────────────────────────────────────────────────
const CompanyDashboard = ({ auth }) => {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const h = { Authorization: `Bearer ${auth.token}` };
      try {
        const [sRes, jRes] = await Promise.all([
          fetch(`${API_BASE}/company/dashboard`, { headers: h }),
          fetch(`${API_BASE}/company/jobs`, { headers: h }),
        ]);
        if (sRes.ok) setStats(await sRes.json());
        if (jRes.ok) setJobs(await jRes.json());
      } catch { /* network error */ }
      setLoading(false);
    };
    fetchAll();
  }, [auth.token]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
    </div>
  );

  const statCards = [
    { icon: Briefcase, label: 'Active Job Postings', value: stats?.total_jobs, color: { bg: 'bg-blue-500/15', text: 'text-blue-500' } },
    { icon: Users, label: 'Total Applicants', value: stats?.total_applications, color: { bg: 'bg-purple-500/15', text: 'text-purple-500' } },
    { icon: CheckCircle, label: 'Shortlisted', value: stats?.total_shortlisted, color: { bg: 'bg-yellow-500/15', text: 'text-yellow-500' } },
    { icon: Trophy, label: 'Hired', value: stats?.total_hired, color: { bg: 'bg-green-500/15', text: 'text-green-500' } },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-2xl p-8"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text dark:text-dark-text">
              Welcome, {auth.user.name}!
            </h1>
            <p className="text-purple-600 dark:text-purple-400 mt-1">
              Manage your hiring pipeline with AI-powered tools
            </p>
          </div>
          <div className="ml-auto">
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-dark-primary text-background dark:text-dark-background rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Post a Job
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.08} />)}
      </div>

      {/* Recent Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={card}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-text dark:text-dark-text">Your Job Postings</h2>
          <Link to="/jobs" className="flex items-center gap-1.5 text-primary dark:text-dark-primary text-sm font-semibold hover:opacity-75 transition-opacity">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="text-center py-10">
            <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No jobs posted yet.</p>
            <Link to="/jobs" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4" /> Post your first job
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text dark:text-dark-text truncate">{job.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{job.location} · {job.job_type}</p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-text dark:text-dark-text">{job.total_applicants ?? 0}</p>
                    <p className="text-xs text-gray-400">applicants</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {job.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── CANDIDATE DASHBOARD ──────────────────────────────────────────────────────
const CandidateDashboard = ({ auth }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/candidate/applications`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setApplications(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.token]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
    </div>
  );

  const total = applications.length;
  const count = (s) => applications.filter(a => a.status === s).length;

  const statCards = [
    { icon: Briefcase, label: 'Total Applications', value: total, color: { bg: 'bg-blue-500/15', text: 'text-blue-500' } },
    { icon: Clock, label: 'In Assessment', value: count('test_invited') + count('test_in_progress') + count('test_completed'), color: { bg: 'bg-yellow-500/15', text: 'text-yellow-500' } },
    { icon: Calendar, label: 'Interview Stage', value: count('interview_scheduled') + count('interview_completed'), color: { bg: 'bg-purple-500/15', text: 'text-purple-500' } },
    { icon: CheckCircle, label: 'Offers / Hired', value: count('hired'), color: { bg: 'bg-green-500/15', text: 'text-green-500' } },
  ];

  const statusMap = {
    applied: { label: 'Applied', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    resume_reviewed: { label: 'Reviewed', cls: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
    shortlisted: { label: 'Shortlisted', cls: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' },
    test_invited: { label: 'Test Invited', cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    test_in_progress: { label: 'Test Started', cls: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
    test_completed: { label: 'Test Done', cls: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' },
    interview_scheduled: { label: 'Interview Set', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    interview_completed: { label: 'Interviewed', cls: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' },
    hired: { label: '🎉 Hired!', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    rejected: { label: 'Not Selected', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  };

  const quickActions = [
    { icon: Briefcase, label: 'Browse Jobs', link: '/jobs', desc: 'Find new opportunities' },
    { icon: ClipboardList, label: 'My Applications', link: '/applications', desc: 'Track your progress' },
    { icon: User, label: 'My Profile', link: '/profile', desc: 'Update your resume' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 dark:from-dark-primary/10 to-secondary/10 dark:to-dark-secondary/10 border border-primary/20 dark:border-dark-primary/20 rounded-2xl p-8"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/20 dark:bg-dark-primary/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary dark:text-dark-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text dark:text-dark-text">
              Welcome back, {auth.user.name}!
            </h1>
            <p className="text-primary dark:text-dark-primary mt-1">
              Track your job applications and interview progress
            </p>
          </div>
          <div className="ml-auto">
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-dark-primary text-background dark:text-dark-background rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Browse Jobs
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.08} />)}
      </div>

      {/* Recent Applications + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${card} lg:col-span-2`}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-text dark:text-dark-text">Recent Applications</h2>
            <Link to="/applications" className="flex items-center gap-1.5 text-primary dark:text-dark-primary text-sm font-semibold hover:opacity-75 transition-opacity">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {applications.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No applications yet.</p>
              <Link to="/jobs" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map(app => {
                const s = statusMap[app.status] || { label: app.status, cls: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-l-4 border-primary dark:border-dark-primary border border-gray-100 dark:border-gray-700/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text dark:text-dark-text truncate">{app.job_title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{app.company_name} · {app.location}</p>
                    </div>
                    <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pipeline sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className={card}
        >
          <h2 className="text-xl font-bold text-text dark:text-dark-text mb-5">Pipeline</h2>
          <div className="space-y-3">
            {[
              { label: 'Applied', val: count('applied') + count('resume_reviewed') + count('shortlisted'), color: 'bg-blue-500' },
              { label: 'Assessment', val: count('test_invited') + count('test_in_progress') + count('test_completed'), color: 'bg-yellow-500' },
              { label: 'Interview', val: count('interview_scheduled') + count('interview_completed'), color: 'bg-purple-500' },
              { label: 'Hired', val: count('hired'), color: 'bg-green-500' },
              { label: 'Rejected', val: count('rejected'), color: 'bg-red-400' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{item.label}</span>
                  <span className="font-bold text-text dark:text-dark-text">{item.val}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${item.color}`}
                    style={{ width: total > 0 ? `${(item.val / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={card}
      >
        <h2 className="text-xl font-bold text-text dark:text-dark-text mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map(action => (
            <Link
              key={action.label}
              to={action.link}
              className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/8 dark:from-dark-primary/8 to-secondary/8 dark:to-dark-secondary/8 border border-primary/15 dark:border-dark-primary/15 rounded-xl hover:border-primary/40 dark:hover:border-dark-primary/40 hover:shadow-md transition-all duration-200 group"
            >
              <action.icon className="w-7 h-7 text-primary dark:text-dark-primary group-hover:scale-110 transition-transform duration-200 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-text dark:text-dark-text font-semibold truncate">{action.label}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary dark:text-dark-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─── ROOT DASHBOARD ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { auth } = useAuth();
  const role = auth?.user?.role;

  if (role === 'company') return <CompanyDashboard auth={auth} />;
  return <CandidateDashboard auth={auth} />;
};

export default Dashboard;