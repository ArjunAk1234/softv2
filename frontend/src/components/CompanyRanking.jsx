import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, TrendingUp, ChevronLeft, User, Star, AlertTriangle,
  CheckCircle, Shield, Loader2, Award, MessageSquare, Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:8006';

const getRankBadge = (rank) => {
  if (rank === 1) return { emoji: '🥇', color: 'from-yellow-400 to-amber-500', text: 'text-yellow-900' };
  if (rank === 2) return { emoji: '🥈', color: 'from-slate-300 to-slate-400', text: 'text-slate-900' };
  if (rank === 3) return { emoji: '🥉', color: 'from-amber-500 to-orange-600', text: 'text-amber-900' };
  return { emoji: `#${rank}`, color: 'from-blue-500/20 to-purple-500/20', text: 'text-text dark:text-dark-text' };
};

const ScoreBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-text/60 dark:text-dark-text/60">{label}</span>
      <span className="font-bold text-text dark:text-dark-text">{value !== null && value !== undefined ? `${Math.round(value)}%` : 'N/A'}</span>
    </div>
    <div className="w-full bg-secondary/20 dark:bg-dark-secondary/20 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${color} transition-all duration-700`}
        style={{ width: `${value || 0}%` }}
      />
    </div>
  </div>
);

const CandidateCard = ({ candidate, rank, jobId, onHire }) => {
  const [expanded, setExpanded] = useState(false);
  const [hiring, setHiring] = useState(false);
  const badge = getRankBadge(rank);
  const { auth } = useAuth();

  const handleHire = async () => {
    setHiring(true);
    try {
      await fetch(`${API_BASE}/company/applications/${candidate.application_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ status: 'hired' }),
      });
      onHire(candidate.application_id);
    } catch {}
    setHiring(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`bg-background dark:bg-dark-background rounded-2xl border-2 overflow-hidden ${
        rank <= 3
          ? 'border-yellow-300 dark:border-yellow-700 shadow-lg shadow-yellow-500/10'
          : candidate.status === 'hired'
          ? 'border-green-400 dark:border-green-600'
          : 'border-secondary/20 dark:border-dark-secondary/20'
      }`}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Rank Badge */}
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-md`}>
            {rank <= 3 ? badge.emoji : <span className={`text-sm ${badge.text}`}>{badge.emoji}</span>}
          </div>

          {/* Candidate Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
              <div>
                <h3 className="text-lg font-bold text-text dark:text-dark-text">{candidate.name}</h3>
                <p className="text-sm text-text/60 dark:text-dark-text/60">{candidate.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {candidate.is_flagged && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-full border border-red-300 dark:border-red-700">
                    <AlertTriangle className="w-3 h-3" />
                    Flagged
                  </span>
                )}
                {candidate.status === 'hired' && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-300 dark:border-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Hired
                  </span>
                )}
              </div>
            </div>

            {/* Final Score */}
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 dark:bg-dark-primary/10 border border-primary/30 dark:border-dark-primary/30 rounded-xl px-4 py-2">
                <p className="text-xs text-text/60 dark:text-dark-text/60 font-semibold">FINAL SCORE</p>
                <p className="text-2xl font-bold text-primary dark:text-dark-primary">
                  {Math.round(candidate.final_score)}%
                </p>
              </div>
              <div className="text-sm text-text/60 dark:text-dark-text/60">
                <p>{candidate.experience_years} yrs exp.</p>
              </div>
            </div>

            {/* Score Bars */}
            <div className="space-y-2 mb-4">
              <ScoreBar label="Resume" value={candidate.resume_score} color="bg-blue-500" />
              <ScoreBar label="Technical Test" value={candidate.test_score} color="bg-purple-500" />
              <ScoreBar label="Interview" value={candidate.interview_score} color="bg-green-500" />
            </div>

            {/* Expand/Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold"
              >
                {expanded ? 'Hide details ▲' : 'View details ▼'}
              </button>
              {candidate.status !== 'hired' && (
                <button
                  onClick={handleHire}
                  disabled={hiring}
                  className="ml-auto px-4 py-1.5 bg-green-600 dark:bg-green-700 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {hiring ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  {hiring ? 'Hiring…' : 'Hire'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-secondary/20 dark:border-dark-secondary/20 space-y-3"
          >
            {candidate.interviewer_feedback && (
              <div className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary dark:text-dark-primary" />
                  <h4 className="font-bold text-sm text-text dark:text-dark-text">Interviewer Feedback</h4>
                </div>
                <p className="text-sm text-text/70 dark:text-dark-text/70">{candidate.interviewer_feedback}</p>
              </div>
            )}

            {candidate.interview_date && (
              <div className="flex items-center gap-2 text-sm text-text/60 dark:text-dark-text/60">
                <Calendar className="w-4 h-4" />
                <span>Interviewed: {new Date(candidate.interview_date).toLocaleDateString()}</span>
              </div>
            )}

            {candidate.is_flagged && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <h4 className="font-bold text-sm text-red-600 dark:text-red-400">Proctoring Flags</h4>
                </div>
                {candidate.flag_reasons && (
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                    {(Array.isArray(candidate.flag_reasons)
                      ? candidate.flag_reasons
                      : JSON.parse(candidate.flag_reasons || '[]')
                    ).map((r, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span>•</span> {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const CompanyRanking = ({ jobId, jobTitle, onBack }) => {
  const { auth } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiredIds, setHiredIds] = useState(new Set());

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/company/ranking/${jobId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCandidates(data);
        setHiredIds(new Set(data.filter(c => c.status === 'hired').map(c => c.application_id)));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchRanking(); }, [jobId]);

  const handleHired = (appId) => {
    setHiredIds(prev => new Set([...prev, appId]));
    setCandidates(prev => prev.map(c =>
      c.application_id === appId ? { ...c, status: 'hired' } : c
    ));
  };

  const stats = {
    total: candidates.length,
    withInterview: candidates.filter(c => c.interview_score != null).length,
    hired: candidates.filter(c => c.status === 'hired').length,
    avgScore: candidates.length
      ? Math.round(candidates.reduce((a, b) => a + (b.final_score || 0), 0) / candidates.length)
      : 0,
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Final Rankings
          </h1>
          <button
            onClick={fetchRanking}
            className="text-sm text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-primary dark:text-dark-primary">{jobTitle}</h2>
          <p className="text-text/60 dark:text-dark-text/60 mt-2">Final candidate rankings</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Ranked', value: stats.total, icon: User, color: 'blue' },
            { label: 'Interviewed', value: stats.withInterview, icon: Calendar, color: 'purple' },
            { label: 'Hired', value: stats.hired, icon: Award, color: 'green' },
            { label: 'Avg Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'yellow' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-xl p-4 border border-secondary/20 dark:border-dark-secondary/20 text-center">
              <Icon className={`w-6 h-6 text-${color}-500 mx-auto mb-2`} />
              <p className="text-2xl font-bold text-text dark:text-dark-text">{value}</p>
              <p className="text-sm text-text/60 dark:text-dark-text/60">{label}</p>
            </div>
          ))}
        </div>

        {/* Score Weights Note */}
        <div className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-xl p-4 border border-secondary/20 dark:border-dark-secondary/20 mb-8">
          <p className="text-sm text-text/70 dark:text-dark-text/70 text-center">
            <span className="font-semibold">Final Score Formula:</span> Resume (30%) + Technical Test (30%) + Interview (40%)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-secondary/30 dark:text-dark-secondary/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text/60 dark:text-dark-text/60">No rankings yet</h3>
            <p className="text-text/40 dark:text-dark-text/40 mt-2">
              Rankings appear after candidates complete the full hiring pipeline.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate, idx) => (
              <CandidateCard
                key={candidate.application_id || idx}
                candidate={candidate}
                rank={idx + 1}
                jobId={jobId}
                onHire={handleHired}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyRanking;
