import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, ChevronLeft, CheckCircle, Loader2, X } from 'lucide-react';

const API_BASE = 'http://localhost:8006';

const SlotPicker = ({ jobId, applicationId, token, onBack, onBooked }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');
  const [groupedSlots, setGroupedSlots] = useState({});

  useEffect(() => {
    fetchSlots();
  }, [jobId]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/interview/slots/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSlots(data);
        // Group by date
        const grouped = {};
        data.forEach(slot => {
          const date = new Date(slot.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          });
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(slot);
        });
        setGroupedSlots(grouped);
      }
    } catch {
      setError('Failed to load available slots');
    }
    setLoading(false);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/interview/book/${selectedSlot.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBooked(true);
        onBooked && onBooked({ slot: selectedSlot, session: data });
      } else {
        setError(data.error || 'Booking failed');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setBooking(false);
  };

  if (booked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          </motion.div>
          <h1 className="text-3xl font-bold text-text dark:text-dark-text mb-3">
            Interview Scheduled! 🎉
          </h1>
          <p className="text-text/70 dark:text-dark-text/70 mb-3">
            Your interview is booked for:
          </p>
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {new Date(selectedSlot.scheduled_at).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
            <p className="text-lg text-text/70 dark:text-dark-text/70 mt-1">
              {new Date(selectedSlot.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm text-text/60 dark:text-dark-text/60 mt-2">
              with {selectedSlot.interviewer_name} • {selectedSlot.duration_minutes} minutes
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Back to Applications
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-bold">Schedule Your Interview</h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">
            🎉 Congratulations on passing the technical test!
          </h2>
          <p className="text-blue-700 dark:text-blue-400 text-sm">
            Please select an available interview slot below. Once booked, the interviewer will be notified and you'll see the session in your applications dashboard.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-secondary/30 dark:text-dark-secondary/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text/60 dark:text-dark-text/60">No slots available</h3>
            <p className="text-text/40 dark:text-dark-text/40 mt-2">
              The company hasn't posted interview slots yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSlots).map(([date, daySlots]) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-primary dark:text-dark-primary" />
                  <h3 className="font-bold text-lg text-text dark:text-dark-text">{date}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {daySlots.map(slot => (
                    <motion.button
                      key={slot.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        selectedSlot?.id === slot.id
                          ? 'bg-primary/10 dark:bg-dark-primary/10 border-primary dark:border-dark-primary shadow-lg'
                          : 'bg-secondary/5 dark:bg-dark-secondary/5 border-secondary/30 dark:border-dark-secondary/30 hover:border-primary/50 dark:hover:border-dark-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className={`w-5 h-5 ${selectedSlot?.id === slot.id ? 'text-primary dark:text-dark-primary' : 'text-secondary dark:text-dark-secondary'}`} />
                        <span className="text-xl font-bold text-text dark:text-dark-text">
                          {new Date(slot.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text/60 dark:text-dark-text/60">
                        <User className="w-4 h-4" />
                        <span>{slot.interviewer_name}</span>
                      </div>
                      <p className="text-xs text-text/40 dark:text-dark-text/40 mt-2">
                        Duration: {slot.duration_minutes} minutes
                      </p>
                      {selectedSlot?.id === slot.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-3 flex items-center gap-2 text-primary dark:text-dark-primary text-sm font-semibold"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Selected
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Booking Panel */}
        <AnimatePresence>
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-0 left-0 right-0 bg-background dark:bg-dark-background border-t border-secondary/20 dark:border-dark-secondary/20 shadow-2xl p-6 z-40"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm text-text/60 dark:text-dark-text/60">Selected slot</p>
                  <p className="font-bold text-text dark:text-dark-text">
                    {new Date(selectedSlot.scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })} at {new Date(selectedSlot.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-text/60 dark:text-dark-text/60">
                    with {selectedSlot.interviewer_name}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="px-4 py-3 rounded-xl border-2 border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="px-8 py-3 bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                    {booking ? 'Booking…' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm text-center mt-3">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom padding when booking panel shows */}
        {selectedSlot && <div className="h-32" />}
      </main>
    </div>
  );
};

export default SlotPicker;
