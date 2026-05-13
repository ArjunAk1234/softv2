import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video, Calendar, User, Clock, ChevronLeft, Loader2, CheckCircle,
  RefreshCw, AlertCircle
} from 'lucide-react';
import InterviewRoom from './InterviewRoom';

const API_BASE = 'http://localhost:8006';

const SESSION_STATUS_CLS = {
  scheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  in_progress: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
};

const ScoreDot = ({ label, value, color }) => (
  <div className="text-center">
    <p className={`text-base font-bold ${color}`}>{value != null ? Math.round(value) : '—'}</p>
    <p className="text-[10px] text-gray-400">{label}</p>
  </div>
);

const InterviewerDashboard = ({ user, token, onBack }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null); // slot object when in room

  const fetchSlots = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/interview/interviewer/slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSlots(await res.json());
    } catch {}
    if (!silent) setLoading(false);
    else setRefreshing(false);
  };

  useEffect(() => { fetchSlots(false); }, []);

  // auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => fetchSlots(true), 30000);
    return () => clearInterval(t);
  }, []);

  const startSession = async (slot) => {
    if (slot.session_id) {
      // Session already exists — start/rejoin it
      try {
        await fetch(`${API_BASE}/interview/sessions/${slot.session_id}/start`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
      setActiveRoom({ ...slot, id: slot.session_id });
    }
  };

  if (activeRoom) {
    return (
      <InterviewRoom
        session={activeRoom}
        role="interviewer"
        token={token}
        candidateName={activeRoom.candidate_name}
        interviewerName={user?.name}
        onLeave={() => { setActiveRoom(null); fetchSlots(true); }}
      />
    );
  }

  const booked = slots.filter(s => s.is_booked);
  const available = slots.filter(s => !s.is_booked);

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 font-semibold">
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold">My Interview Schedule</h1>
              <p className="text-xs text-text/50 dark:text-dark-text/50">Welcome, {user?.name}</p>
            </div>
          </div>
          <button onClick={() => fetchSlots(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-secondary/20 dark:border-dark-secondary/20 rounded-xl hover:border-primary/40 transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-bold text-text/50 dark:text-dark-text/50">No slots assigned yet</p>
            <p className="text-sm text-text/30 dark:text-dark-text/30 mt-1">The company will assign interview slots to you.</p>
          </div>
        ) : (
          <>
            {/* Booked (candidate assigned) */}
            {booked.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-500" /> Upcoming Interviews ({booked.length})
                </h2>
                <div className="space-y-3">
                  {booked.map(slot => {
                    const status = slot.session_status || 'scheduled';
                    const isDone = status === 'completed';
                    return (
                      <motion.div key={slot.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white/60 dark:bg-dark-background/50 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${SESSION_STATUS_CLS[status] || SESSION_STATUS_CLS.scheduled}`}>
                                {status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-gray-400">{slot.job_title} · {slot.company_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <p className="font-bold text-text dark:text-dark-text">{slot.candidate_name}</p>
                              <p className="text-sm text-gray-400 hidden sm:block">{slot.candidate_email}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(slot.scheduled_at).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {slot.duration_minutes} min
                              </span>
                            </div>
                            {/* Scores */}
                            <div className="flex gap-5 mt-3">
                              <ScoreDot label="Resume" value={slot.resume_score} color="text-blue-500" />
                              <ScoreDot label="Test" value={slot.test_score} color="text-yellow-500" />
                              {isDone && slot.interviewer_score != null && (
                                <ScoreDot label="Your Score" value={slot.interviewer_score} color="text-purple-500" />
                              )}
                            </div>
                            {isDone && slot.interviewer_feedback && (
                              <p className="mt-2 text-xs text-gray-400 italic">"{slot.interviewer_feedback}"</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {!isDone ? (
                              <button onClick={() => startSession(slot)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                                <Video className="w-4 h-4" />
                                {status === 'in_progress' ? 'Rejoin Interview' : 'Join Interview'}
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-semibold">
                                <CheckCircle className="w-4 h-4" /> Completed & Scored
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Available (not yet booked) */}
            {available.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> Open Slots — Waiting for Candidate ({available.length})
                </h2>
                <div className="space-y-2">
                  {available.map(slot => (
                    <motion.div key={slot.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white/30 dark:bg-dark-background/30 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text dark:text-dark-text">{slot.job_title} · {slot.company_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(slot.scheduled_at).toLocaleString()} · {slot.duration_minutes} min
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full font-medium">
                        Awaiting booking
                      </span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewerDashboard;
