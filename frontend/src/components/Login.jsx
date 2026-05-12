import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Instagram, Linkedin, Github, Globe,
  User, Building2, ArrowLeft, Loader2, CheckCircle,
  ChevronRight, Briefcase
} from 'lucide-react';
import ImageMarquee from './ImageMarquee';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import bottomImage21 from '../assets/alumni/21.png';
import bottomImage22 from '../assets/alumni/22.avif';
import bottomImage23 from '../assets/alumni/23.png';
import bottomImage24 from '../assets/alumni/24.png';
import bottomImage25 from '../assets/alumni/25.png';
import bottomImage26 from '../assets/alumni/26.png';
import bottomImage27 from '../assets/alumni/27.png';
import bottomImage28 from '../assets/alumni/28.png';
import bottomImage29 from '../assets/alumni/29.png';
import bottomImage30 from '../assets/alumni/30.png';

const bottomImages = [
  bottomImage21, bottomImage22, bottomImage23, bottomImage24, bottomImage25,
  bottomImage26, bottomImage27, bottomImage28, bottomImage29, bottomImage30,
];

const API_BASE = 'http://localhost:8006';

const INPUT_CLS = `w-full px-4 py-3 border border-secondary/40 dark:border-dark-secondary/40
  rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-dark-primary/40
  focus:border-primary dark:focus:border-dark-primary transition-all duration-200
  bg-background dark:bg-dark-background text-text dark:text-dark-text
  placeholder-text/40 dark:placeholder-dark-text/40 text-sm`;

const LABEL_CLS = 'block text-xs font-semibold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1.5';

const BTN_PRIMARY = `w-full py-3.5 rounded-xl font-bold text-sm tracking-wide
  hover:opacity-90 transition-all duration-200 transform hover:scale-[1.01]
  active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed
  disabled:transform-none bg-primary dark:bg-dark-primary
  text-background dark:text-dark-background flex items-center justify-center gap-2`;

// ── Animated field wrapper ───────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className={LABEL_CLS}>{label}</label>
    {children}
  </div>
);

// ── Password field ───────────────────────────────────────────────────────────
const PasswordField = ({ label, value, onChange, placeholder, disabled }) => {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder || '••••••••'}
          disabled={disabled}
          className={INPUT_CLS}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary dark:text-dark-secondary hover:opacity-70 transition-opacity"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </Field>
  );
};

// ── Error / Success banners ──────────────────────────────────────────────────
const Banner = ({ error, success }) => (
  <AnimatePresence>
    {(error || success) && (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
          error
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
        }`}
      >
        {error || success}
      </motion.div>
    )}
  </AnimatePresence>
);

// ── Slide variants ───────────────────────────────────────────────────────────
const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

// ════════════════════════════════════════════════════════════════════════════
//  LOGIN VIEW
// ════════════════════════════════════════════════════════════════════════════
const LoginView = ({ onSwitchToSelect }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Both fields are required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Login failed. Check your credentials.');
      }
    } catch {
      setError('Cannot connect to server. Make sure the backend is running.');
    }
    setLoading(false);
  };

  return (
    <motion.div key="login" {...slide}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text dark:text-dark-text mb-1">
          Welcome back 👋
        </h1>
        <p className="text-text/60 dark:text-dark-text/60 text-sm">
          Sign in to BetterATS
        </p>
      </div>

      <Banner error={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email Address">
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            disabled={loading}
            className={INPUT_CLS}
            autoComplete="email"
          />
        </Field>

        <PasswordField
          label="Password"
          value={form.password}
          onChange={set('password')}
          disabled={loading}
        />

        <button type="submit" disabled={loading} className={BTN_PRIMARY}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text/60 dark:text-dark-text/60">
        Don't have an account?{' '}
        <button
          onClick={onSwitchToSelect}
          className="font-bold text-primary dark:text-dark-primary hover:opacity-75 transition-opacity"
        >
          Create one
        </button>
      </p>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  ROLE SELECTION VIEW
// ════════════════════════════════════════════════════════════════════════════
const RoleSelectView = ({ onSelect, onBack }) => (
  <motion.div key="role-select" {...slide}>
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm text-text/50 dark:text-dark-text/50 hover:text-text dark:hover:text-dark-text transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Login
    </button>

    <div className="mb-8">
      <h1 className="text-3xl font-bold text-text dark:text-dark-text mb-1">
        Create an account
      </h1>
      <p className="text-text/60 dark:text-dark-text/60 text-sm">
        Choose how you'll use BetterATS
      </p>
    </div>

    <div className="space-y-4">
      {/* Candidate card */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect('candidate')}
        className="w-full text-left p-5 rounded-2xl border-2 border-secondary/30 dark:border-dark-secondary/30 hover:border-primary dark:hover:border-dark-primary bg-secondary/5 dark:bg-dark-secondary/5 hover:bg-primary/5 dark:hover:bg-dark-primary/5 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text dark:text-dark-text group-hover:text-primary dark:group-hover:text-dark-primary transition-colors">
              I'm a Candidate
            </p>
            <p className="text-xs text-text/55 dark:text-dark-text/55 mt-0.5">
              Browse jobs, apply and track your progress
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-text/30 dark:text-dark-text/30 group-hover:text-primary dark:group-hover:text-dark-primary transition-colors" />
        </div>
      </motion.button>

      {/* Company card */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect('company')}
        className="w-full text-left p-5 rounded-2xl border-2 border-secondary/30 dark:border-dark-secondary/30 hover:border-primary dark:hover:border-dark-primary bg-secondary/5 dark:bg-dark-secondary/5 hover:bg-primary/5 dark:hover:bg-dark-primary/5 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text dark:text-dark-text group-hover:text-primary dark:group-hover:text-dark-primary transition-colors">
              I'm a Company / Recruiter
            </p>
            <p className="text-xs text-text/55 dark:text-dark-text/55 mt-0.5">
              Post jobs, screen resumes, run assessments
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-text/30 dark:text-dark-text/30 group-hover:text-primary dark:group-hover:text-dark-primary transition-colors" />
        </div>
      </motion.button>
    </div>
  </motion.div>
);

// ════════════════════════════════════════════════════════════════════════════
//  CANDIDATE REGISTER VIEW
// ════════════════════════════════════════════════════════════════════════════
const CandidateRegisterView = ({ onBack, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('All fields are required'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'candidate',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess('candidate', data);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Cannot connect to server.');
    }
    setLoading(false);
  };

  return (
    <motion.div key="candidate-reg" {...slide}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text/50 dark:text-dark-text/50 hover:text-text dark:hover:text-dark-text transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text dark:text-dark-text">Candidate Sign Up</h1>
          <p className="text-xs text-text/55 dark:text-dark-text/55">Create your job-seeker account</p>
        </div>
      </div>

      <Banner error={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full Name">
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="John Doe"
            disabled={loading}
            className={INPUT_CLS}
          />
        </Field>

        <Field label="Email Address">
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            disabled={loading}
            className={INPUT_CLS}
          />
        </Field>

        <PasswordField label="Password" value={form.password} onChange={set('password')} disabled={loading} />
        <PasswordField label="Confirm Password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" disabled={loading} />

        <button type="submit" disabled={loading} className={BTN_PRIMARY}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
          {loading ? 'Creating account…' : 'Create Candidate Account'}
        </button>
      </form>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  COMPANY REGISTER VIEW
// ════════════════════════════════════════════════════════════════════════════
const CompanyRegisterView = ({ onBack, onSuccess }) => {
  const [form, setForm] = useState({
    name: '', companyName: '', email: '', password: '', confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.companyName || !form.email || !form.password || !form.confirm) {
      setError('All fields are required'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'company',
          companyName: form.companyName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess('company', data);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Cannot connect to server.');
    }
    setLoading(false);
  };

  return (
    <motion.div key="company-reg" {...slide}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text/50 dark:text-dark-text/50 hover:text-text dark:hover:text-dark-text transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text dark:text-dark-text">Company Sign Up</h1>
          <p className="text-xs text-text/55 dark:text-dark-text/55">Start hiring smarter with AI</p>
        </div>
      </div>

      <Banner error={error} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Your Full Name">
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Jane Smith"
            disabled={loading}
            className={INPUT_CLS}
          />
        </Field>

        <Field label="Company / Organisation Name">
          <input
            type="text"
            value={form.companyName}
            onChange={set('companyName')}
            placeholder="Acme Corp"
            disabled={loading}
            className={INPUT_CLS}
          />
        </Field>

        <Field label="Work Email">
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="hr@acmecorp.com"
            disabled={loading}
            className={INPUT_CLS}
          />
        </Field>

        <PasswordField label="Password" value={form.password} onChange={set('password')} disabled={loading} />
        <PasswordField label="Confirm Password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" disabled={loading} />

        <button type="submit" disabled={loading} className={BTN_PRIMARY}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
          {loading ? 'Creating account…' : 'Create Company Account'}
        </button>
      </form>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//  SUCCESS VIEW
// ════════════════════════════════════════════════════════════════════════════
const SuccessView = ({ role, onLogin }) => (
  <motion.div key="success" {...slide} className="text-center py-8">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.1 }}
      className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-6"
    >
      <CheckCircle className="w-10 h-10 text-green-500" />
    </motion.div>
    <h2 className="text-2xl font-bold text-text dark:text-dark-text mb-2">Account Created!</h2>
    <p className="text-text/60 dark:text-dark-text/60 text-sm mb-8">
      {role === 'company'
        ? 'Your company account is ready. You can now post jobs and start hiring.'
        : 'Your candidate account is ready. Start applying for jobs!'}
    </p>
    <button onClick={onLogin} className={BTN_PRIMARY} style={{ maxWidth: 280, margin: '0 auto' }}>
      Sign In Now
    </button>
  </motion.div>
);

// ════════════════════════════════════════════════════════════════════════════
//  MAIN LOGIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
const Login = () => {
  // views: 'login' | 'role-select' | 'candidate-reg' | 'company-reg' | 'success'
  const [view, setView] = useState('login');
  const [successRole, setSuccessRole] = useState(null);
  const { login } = useAuth();

  const handleRegisterSuccess = (role, data) => {
    setSuccessRole(role);
    setView('success');
    // Auto-login after 1.5s
    setTimeout(() => {
      login(data.token, data.user);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex p-2 bg-background dark:bg-dark-background transition-colors duration-300">
      {/* ── LEFT: Form Panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 xl:px-16">
        <div className="w-full max-w-md mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-primary dark:bg-dark-primary flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-background dark:text-dark-background" />
            </div>
            <span className="font-bold text-lg text-text dark:text-dark-text tracking-tight">BetterATS</span>
          </div>

          {/* Animated form area */}
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <LoginView key="login" onSwitchToSelect={() => setView('role-select')} />
            )}
            {view === 'role-select' && (
              <RoleSelectView
                key="role-select"
                onSelect={(role) => setView(`${role}-reg`)}
                onBack={() => setView('login')}
              />
            )}
            {view === 'candidate-reg' && (
              <CandidateRegisterView
                key="candidate-reg"
                onBack={() => setView('role-select')}
                onSuccess={handleRegisterSuccess}
              />
            )}
            {view === 'company-reg' && (
              <CompanyRegisterView
                key="company-reg"
                onBack={() => setView('role-select')}
                onSuccess={handleRegisterSuccess}
              />
            )}
            {view === 'success' && (
              <SuccessView
                key="success"
                role={successRole}
                onLogin={() => setView('login')}
              />
            )}
          </AnimatePresence>

          {/* Partner logos */}
          <div className="mt-10">
            <p className="text-xs font-semibold text-text/40 dark:text-dark-text/40 uppercase tracking-widest text-center mb-3">
              Trusted by
            </p>
            <div className="h-16 overflow-hidden rounded-xl">
              <ImageMarquee images={bottomImages} speed="fast" compact={true} />
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Banner Panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden ml-4 rounded-3xl shadow-2xl bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 flex-col items-center justify-center p-12 text-white">

        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            AI-Powered<br />Hiring Platform
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-10">
            Screen resumes with AI, run proctored assessments, schedule interviews,
            and get instant rankings — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              '🤖 AI Resume Screening',
              '🔒 Proctored Tests',
              '🗓️ Smart Scheduling',
              '🏆 Auto Rankings',
              '📊 Live Analytics',
            ].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom social links */}
        <div className="relative z-10 mt-auto flex items-center gap-6">
          {[
            { Icon: Instagram, href: '#' },
            { Icon: Linkedin, href: '#' },
            { Icon: Github, href: '#' },
            { Icon: Globe, href: '#' },
          ].map(({ Icon, href }, i) => (
            <a
              key={i}
              href={href}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Icon className="w-4 h-4 text-white" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;