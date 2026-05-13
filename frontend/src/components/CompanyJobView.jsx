import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Users, User, Trophy, Loader2, ChevronDown, ChevronUp,
  Shield, Calendar, Send, CheckCircle, Megaphone, Code2, RefreshCw,
  Eye, Zap, UserCheck, UserX, Star, Lock
} from 'lucide-react';
import InterviewScheduler from './InterviewScheduler';
import CreateJobTestModal from './CreateJobTestModal';

const API_BASE = 'http://localhost:8006';

const STATUS_LABELS = {
  applied: { label: 'Applied', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  resume_reviewed: { label: 'Reviewed', cls: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
  shortlisted: { label: 'Shortlisted', cls: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  test_invited: { label: 'Test Invited', cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  test_in_progress: { label: 'Test Started', cls: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  test_completed: { label: 'Test Done ✓', cls: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
  interview_scheduled: { label: 'Interview Set', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  interview_completed: { label: 'Interviewed', cls: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
  hired: { label: '🎉 Hired', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
};

const NEXT_ACTIONS = {
  applied: [{ status: 'shortlisted', label: 'Shortlist', color: 'bg-cyan-500' }, { status: 'rejected', label: 'Reject', color: 'bg-red-500' }],
  resume_reviewed: [{ status: 'shortlisted', label: 'Shortlist', color: 'bg-cyan-500' }, { status: 'rejected', label: 'Reject', color: 'bg-red-500' }],
  shortlisted: [{ status: 'test_invited', label: 'Invite to Test', color: 'bg-yellow-500' }, { status: 'rejected', label: 'Reject', color: 'bg-red-500' }],
  test_completed: [{ status: 'interview_scheduled', label: 'Move to Interview', color: 'bg-purple-500' }, { status: 'rejected', label: 'Reject', color: 'bg-red-500' }],
  interview_completed: [{ status: 'hired', label: '🎉 Hire', color: 'bg-green-500' }, { status: 'rejected', label: 'Reject', color: 'bg-red-500' }],
};

const ScorePill = ({ label, value, color }) => (
  <div className="text-center">
    <div className={`text-lg font-bold ${color}`}>
      {value != null ? `${Math.round(value)}` : '—'}
    </div>
    <div className="text-xs text-gray-400">{label}</div>
  </div>
);

const CandidateRow = ({ app, token, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const s = STATUS_LABELS[app.status] || { label: app.status, cls: 'bg-gray-100 text-gray-600' };
  const actions = NEXT_ACTIONS[app.status] || [];
  const totalViolations = (app.tab_switches || 0) + (app.window_switches || 0);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/company/applications/${app.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onStatusChange(app.id, status);
    } catch { }
    setUpdating(false);
  };

  return (
    <div className="border border-secondary/15 dark:border-dark-secondary/15 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-dark-background/40 hover:bg-white/70 dark:hover:bg-dark-background/70 transition-colors">
        <div className="w-10 h-10 rounded-full bg-primary/15 dark:bg-dark-primary/15 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary dark:text-dark-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-text dark:text-dark-text truncate">{app.name}</p>
            {app.is_flagged && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full font-bold">
                <Shield className="w-3 h-3" /> Flagged
              </span>
            )}
            {totalViolations > 3 && (
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full font-bold">
                ⚠ {totalViolations} violations
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 truncate">{app.email}</p>
        </div>
        <div className="hidden sm:flex gap-4 px-4 border-x border-secondary/10 dark:border-dark-secondary/10">
          <ScorePill label="Resume" value={app.resume_score} color="text-blue-500" />
          <ScorePill label="Test" value={app.test_score} color="text-yellow-500" />
          <ScorePill label="Interview" value={app.interview_score} color="text-purple-500" />
          {app.final_score != null && <ScorePill label="Final" value={app.final_score} color="text-green-500" />}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${s.cls}`}>{s.label}</span>
          {!updating && actions.map(a => (
            <button key={a.status} onClick={() => updateStatus(a.status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white ${a.color} hover:opacity-80 transition-opacity`}>
              {a.label}
            </button>
          ))}
          {updating && <Loader2 className="w-4 h-4 animate-spin text-primary dark:text-dark-primary" />}
          <button onClick={() => setExpanded(x => !x)} className="p-1.5 rounded-lg hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors text-text/50 dark:text-dark-text/50">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-secondary/10 dark:border-dark-secondary/10 bg-secondary/3 dark:bg-dark-secondary/5 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
              <div><p className="text-xs text-gray-400 mb-1">Experience</p><p className="font-semibold text-text dark:text-dark-text">{app.experience_years ?? '—'} yrs</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Applied</p><p className="font-semibold text-text dark:text-dark-text">{new Date(app.created_at).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Final Score</p>
                <p className={`font-bold text-lg ${app.final_score >= 70 ? 'text-green-500' : app.final_score >= 40 ? 'text-yellow-500' : 'text-red-400'}`}>
                  {app.final_score != null ? `${Math.round(app.final_score)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Tab Switches</p>
                <p className={`font-semibold ${(app.tab_switches > 3) ? 'text-red-500' : 'text-text dark:text-dark-text'}`}>{app.tab_switches ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Window Switches</p>
                <p className={`font-semibold ${(app.window_switches > 3) ? 'text-red-500' : 'text-text dark:text-dark-text'}`}>{app.window_switches ?? 0}</p>
              </div>
            </div>
            {/* Score breakdown */}
            {(app.resume_score != null || app.test_score != null || app.interview_score != null) && (
              <div className="flex gap-6 mb-4 p-3 bg-white/60 dark:bg-dark-background/60 rounded-xl">
                {[['Resume', app.resume_score, 'text-blue-500'], ['Test', app.test_score, 'text-yellow-500'], ['Interview', app.interview_score, 'text-purple-500']].map(([l, v, c]) => (
                  <div key={l} className="text-center">
                    <p className={`text-xl font-black ${c}`}>{v != null ? Math.round(v) : '—'}</p>
                    <p className="text-[11px] text-gray-400">{l}</p>
                  </div>
                ))}
              </div>
            )}
            {app.candidate_skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {app.candidate_skills.map(sk => (
                  <span key={sk} className="px-2.5 py-1 bg-primary/10 dark:bg-dark-primary/10 text-primary dark:text-dark-primary rounded-lg text-xs font-medium">{sk}</span>
                ))}
              </div>
            )}
            {app.is_flagged && app.flag_reasons?.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Proctoring Flags</p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">{app.flag_reasons.map((f, i) => <li key={i}>• {f}</li>)}</ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const RankingTab = ({ jobId, token, candidates, onStatusChange }) => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [pubSuccess, setPubSuccess] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/company/ranking/${jobId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setRanking(data); })
      .catch(() => { }).finally(() => setLoading(false));
  }, [jobId]);

  const hire = async (appId) => {
    const res = await fetch(`${API_BASE}/company/applications/${appId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'hired' }),
    });
    if (res.ok) { setRanking(r => r.map(a => a.id === appId ? { ...a, status: 'hired' } : a)); onStatusChange(appId, 'hired'); }
  };

  // Publish all results = move all shortlisted with test scores to interview_scheduled, etc.
  const publishResults = async () => {
    setPublishing(true); setPubSuccess('');
    // For each candidate in ranking, their final score is already computed — just ensure status is updated
    let count = 0;
    for (const app of ranking) {
      if (app.status !== 'hired' && app.status !== 'rejected') {
        await fetch(`${API_BASE}/company/applications/${app.application_id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: app.final_score >= 50 ? 'hired' : 'rejected' }),
        });
        count++;
      }
    }
    setPubSuccess(`Results published for ${count} candidates!`);
    setPublishing(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" /></div>;

  if (ranking.length === 0) {
    // Show all candidates with partial scores
    const withScores = candidates.filter(c => c.resume_score || c.test_score);
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-700 dark:text-yellow-300">
          Full rankings appear after interviews are scored. Showing partial scores below.
        </div>
        {withScores.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No scores available yet</p>
          </div>
        ) : withScores.map((app, i) => (
          <div key={app.id} className="flex items-center gap-4 p-4 bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl">
            <div className="w-9 h-9 rounded-full bg-secondary/20 dark:bg-dark-secondary/20 flex items-center justify-center font-black text-text/60 dark:text-dark-text/60">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text dark:text-dark-text">{app.name}</p>
              <p className="text-xs text-gray-400">{app.email}</p>
            </div>
            <div className="flex gap-5">
              <ScorePill label="Resume" value={app.resume_score} color="text-blue-500" />
              <ScorePill label="Test" value={app.test_score} color="text-yellow-500" />
              <ScorePill label="Interview" value={app.interview_score} color="text-purple-500" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Publish button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{ranking.length} candidates ranked by composite score</p>
        <div className="flex items-center gap-3">
          {pubSuccess && <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" />{pubSuccess}</span>}
          <button onClick={publishResults} disabled={publishing}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60">
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            Publish Results
          </button>
        </div>
      </div>

      {ranking.map((app, i) => (
        <div key={app.application_id} className="flex items-center gap-4 p-5 bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 dark:bg-gray-500 text-white' : i === 2 ? 'bg-amber-600 text-white' : 'bg-secondary/20 dark:bg-dark-secondary/20 text-text/60 dark:text-dark-text/60'
            }`}>{i + 1}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text dark:text-dark-text">{app.name}</p>
            <p className="text-sm text-gray-400">{app.email}</p>
            {app.is_flagged && <span className="text-xs text-red-500 font-bold flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3" /> Flagged</span>}
          </div>
          <div className="flex gap-5 text-center">
            <ScorePill label="Resume" value={app.resume_score} color="text-blue-500" />
            <ScorePill label="Test" value={app.test_score} color="text-yellow-500" />
            <ScorePill label="Interview" value={app.interview_score} color="text-purple-500" />
            <div className="text-center border-l border-secondary/20 dark:border-dark-secondary/20 pl-5">
              <p className={`text-xl font-black ${app.final_score >= 70 ? 'text-green-500' : 'text-yellow-500'}`}>{Math.round(app.final_score)}%</p>
              <p className="text-xs text-gray-400">Final</p>
            </div>
          </div>
          {app.status !== 'hired' ? (
            <button onClick={() => hire(app.application_id)} className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:opacity-80 transition-opacity">Hire ✓</button>
          ) : (
            <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm font-bold">Hired 🎉</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Publish Card (resume / test) ──────────────────────────────────────────────
const PublishCard = ({ jobId, token, type, label }) => {
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const endpoint = type === 'resume' ? 'publish-resume' : 'publish-test';

  const publish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE}/company/jobs/${jobId}/${endpoint}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDone(true);
    } catch {}
    setPublishing(false);
  };

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${done ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-white/60 dark:bg-dark-background/50 border-gray-200/80 dark:border-gray-700/60'}`}>
      <div>
        <p className="text-sm font-bold text-text dark:text-dark-text">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{done ? '✓ Published — candidates can now see scores' : 'Scores hidden from candidates until published'}</p>
      </div>
      <button onClick={publish} disabled={publishing || done}
        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-60 ${done ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-600 text-white hover:opacity-90'}`}>
        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {done ? 'Published' : 'Publish'}
      </button>
    </div>
  );
};

// ── Interview Results Panel ───────────────────────────────────────────────────
const InterviewResultsTab = ({ jobId, token, onUpdate }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [pubMsg, setPubMsg] = useState('');
  const [topN, setTopN] = useState(1);
  const [autoHiring, setAutoHiring] = useState(false);
  const [autoHireMsg, setAutoHireMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/company/ranking/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setResults(data);
    } catch {}
    setLoading(false);
  }, [jobId, token]);

  useEffect(() => { load(); }, [load]);

  const publishFinal = async () => {
    setPublishing(true);
    try {
      await fetch(`${API_BASE}/company/jobs/${jobId}/publish-results`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      setPubMsg('✓ Final results published to candidates');
    } catch { setPubMsg('Error publishing'); }
    setPublishing(false);
  };

  const hireCandidate = async (appId) => {
    await fetch(`${API_BASE}/company/applications/${appId}/hire`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    setResults(r => r.map(x => x.application_id === appId ? { ...x, status: 'hired' } : x));
    if (onUpdate) onUpdate();
  };

  const rejectCandidate = async (appId) => {
    await fetch(`${API_BASE}/company/applications/${appId}/reject`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    setResults(r => r.map(x => x.application_id === appId ? { ...x, status: 'rejected' } : x));
    if (onUpdate) onUpdate();
  };

  const autoHire = async () => {
    setAutoHiring(true);
    try {
      const res = await fetch(`${API_BASE}/company/jobs/${jobId}/auto-hire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topN })
      });
      const data = await res.json();
      if (res.ok) {
        setAutoHireMsg(`✓ Hired top ${data.hired} candidate(s), others rejected`);
        load();
        if (onUpdate) onUpdate();
      } else {
        setAutoHireMsg(data.error || 'Auto-hire failed');
      }
    } catch { setAutoHireMsg('Error'); }
    setAutoHiring(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" /></div>;
  if (!results.length) return (
    <div className="text-center py-16">
      <Trophy className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-gray-400">No completed interviews yet</p>
      <p className="text-xs text-gray-500 mt-1">Candidates appear here after their interview score is submitted</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-4">
        <div>
          <p className="text-sm font-bold text-text dark:text-dark-text">{results.length} candidates with complete scores</p>
          {pubMsg && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" />{pubMsg}</p>}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Auto hire */}
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
            <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-300">Auto-hire top</span>
            <input type="number" min={1} max={results.length} value={topN}
              onChange={e => setTopN(Number(e.target.value))}
              className="w-12 text-center text-sm font-bold bg-white dark:bg-dark-background border border-green-300 dark:border-green-700 rounded-lg px-1 py-0.5 text-text dark:text-dark-text" />
            <button onClick={autoHire} disabled={autoHiring}
              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-500 disabled:opacity-60 flex items-center gap-1">
              {autoHiring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Hire
            </button>
          </div>
          {autoHireMsg && <span className="text-xs font-semibold text-green-600 dark:text-green-400">{autoHireMsg}</span>}
          <button onClick={publishFinal} disabled={publishing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60">
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Publish Final Results
          </button>
        </div>
      </div>

      {/* Candidate rows */}
      {results.map((r, i) => (
        <div key={r.application_id}
          className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border ${
            r.status === 'hired' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
            r.status === 'rejected' ? 'bg-red-50/50 dark:bg-red-900/5 border-red-200/50 dark:border-red-900/30 opacity-60' :
            'bg-white/60 dark:bg-dark-background/50 border-gray-200/80 dark:border-gray-700/60'
          }`}>
          {/* Rank badge */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${
            i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 dark:bg-gray-500 text-white' : i === 2 ? 'bg-amber-600 text-white' : 'bg-secondary/20 dark:bg-dark-secondary/20 text-text/60 dark:text-dark-text/60'
          }`}>{i + 1}</div>

          {/* Name & email */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text dark:text-dark-text">{r.name}</p>
            <p className="text-sm text-gray-400 truncate">{r.email}</p>
            {r.is_flagged && <span className="text-xs text-red-500 font-bold flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3" /> Flagged</span>}
            {r.interviewer_feedback && <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">"{r.interviewer_feedback}"</p>}
          </div>

          {/* Scores */}
          <div className="flex gap-4 text-center">
            {[['Resume', r.resume_score, 'text-blue-500'], ['Test', r.test_score, 'text-yellow-500'], ['Interview', r.interview_score, 'text-purple-500']].map(([l, v, c]) => (
              <div key={l}>
                <p className={`text-xl font-black ${c}`}>{v != null ? Math.round(v) : '—'}</p>
                <p className="text-[11px] text-gray-400">{l}</p>
              </div>
            ))}
            <div className="border-l border-secondary/20 dark:border-dark-secondary/20 pl-4">
              <p className={`text-xl font-black ${r.final_score >= 70 ? 'text-green-500' : 'text-yellow-500'}`}>{r.final_score != null ? Math.round(r.final_score) : '—'}%</p>
              <p className="text-[11px] text-gray-400">Final</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            {r.status === 'hired' ? (
              <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm font-bold flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> Hired</span>
            ) : r.status === 'rejected' ? (
              <span className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold flex items-center gap-1.5"><UserX className="w-4 h-4" /> Rejected</span>
            ) : (
              <>
                <button onClick={() => hireCandidate(r.application_id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-500 transition-colors flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Hire
                </button>
                <button onClick={() => rejectCandidate(r.application_id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-400 transition-colors flex items-center gap-1.5">
                  <UserX className="w-4 h-4" /> Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const CompanyJobView = ({ job, token, onBack }) => {
  const [candidates, setCandidates] = useState([]);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('candidates');
  const [showScheduler, setShowScheduler] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchCandidates = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/company/applicants/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCandidates(data);
        setLastRefresh(new Date());
      }
    } catch (e) { console.error(e); }
    if (!silent) setLoading(false);
    else setRefreshing(false);
  }, [job.id, token]);

  // Initial load
  useEffect(() => { fetchCandidates(false); }, [fetchCandidates]);

  // Auto-refresh every 30 seconds to pick up new test submissions
  useEffect(() => {
    const interval = setInterval(() => fetchCandidates(true), 30000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  const handleStatusChange = (appId, newStatus) => {
    setCandidates(cs => cs.map(c => c.id === appId ? { ...c, status: newStatus } : c));
  };

  const [bulkScreening, setBulkScreening] = useState(false);
  const handleBulkScreen = async () => {
    setBulkScreening(true);
    try {
      const res = await fetch(`${API_BASE}/company/jobs/${job.id}/bulk-screen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await fetchCandidates(true);
    } catch (e) { console.error(e); }
    setBulkScreening(false);
  };

  const allStatuses = ['all', ...new Set(candidates.map(c => c.status))];
  const filtered = filter === 'all' ? candidates : candidates.filter(c => c.status === filter);

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    testDone: candidates.filter(c => c.status === 'test_completed').length,
    hired: candidates.filter(c => c.status === 'hired').length,
    flagged: candidates.filter(c => c.is_flagged).length,
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-text dark:text-dark-text">{job.title}</h1>
              <p className="text-sm text-gray-400">{job.location} · {job.job_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Manual refresh with live indicator */}
            <button onClick={() => fetchCandidates(true)} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text/60 dark:text-dark-text/60 hover:text-primary dark:hover:text-dark-primary border border-secondary/20 dark:border-dark-secondary/20 rounded-xl hover:border-primary/40 transition-all disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` : 'Refresh'}
            </button>
            <button
              onClick={() => setShowCreateTest(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <Code2 className="w-4 h-4" /> Create / Configure Test
            </button>
            <button onClick={() => setShowScheduler(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
              <Calendar className="w-4 h-4" /> Manage Interview Slots
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-500' },
            { label: 'Shortlisted', value: stats.shortlisted, color: 'text-cyan-500' },
            { label: 'Test Done', value: stats.testDone, color: 'text-yellow-500' },
            { label: 'Hired', value: stats.hired, color: 'text-green-500' },
            { label: 'Flagged', value: stats.flagged, color: 'text-red-500' },
          ].map(st => (
            <div key={st.label} className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${st.color}`}>{st.value}</p>
              <p className="text-xs text-gray-400 mt-1">{st.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-secondary/20 dark:border-dark-secondary/20 overflow-x-auto">
          {[
            { id: 'candidates', label: 'Candidates', icon: Users },
            { id: 'ranking', label: 'Scores & Ranking', icon: Trophy },
            { id: 'interview_results', label: 'Interview Results', icon: Star },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === tab.id ? 'border-primary dark:border-dark-primary text-primary dark:text-dark-primary' : 'border-transparent text-text/50 dark:text-dark-text/50 hover:text-text dark:hover:text-dark-text'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'candidates' && (
          <>
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {allStatuses.map(st => (
                  <button key={st} onClick={() => setFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === st ? 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background' : 'bg-secondary/10 dark:bg-dark-secondary/10 text-text/60 dark:text-dark-text/60 hover:bg-secondary/20'}`}>
                    {st === 'all' ? `All (${candidates.length})` : (STATUS_LABELS[st]?.label || st)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleBulkScreen}
                disabled={bulkScreening}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {bulkScreening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                Shortlist Common (AI)
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16"><Users className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No candidates found</p></div>
            ) : (
              <div className="space-y-3">
                {filtered.map(app => <CandidateRow key={app.id} app={app} token={token} onStatusChange={handleStatusChange} />)}
              </div>
            )}
          </>
        )}

        {activeTab === 'ranking' && (
          <RankingTab jobId={job.id} token={token} candidates={candidates} onStatusChange={handleStatusChange} />
        )}

        {activeTab === 'interview_results' && (
          <div className="space-y-4">
            {/* Publish resume/test controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PublishCard jobId={job.id} token={token} type="resume" label="Resume Screening Results" />
              <PublishCard jobId={job.id} token={token} type="test" label="Assessment / Test Results" />
            </div>
            <InterviewResultsTab jobId={job.id} token={token} onUpdate={() => fetchCandidates(true)} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateTest && (
          <CreateJobTestModal
            token={token}
            jobId={job.id}
            onClose={() => setShowCreateTest(false)}
          />
        )}
        {showScheduler && (
          <InterviewScheduler job={job} token={token} onClose={() => setShowScheduler(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyJobView;
