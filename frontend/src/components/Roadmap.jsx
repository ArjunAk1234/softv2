import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Star, Clock, CheckCircle, Zap, Upload, X, CircleDot,
  Download, Eye
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';

// Submission Modal Component
const SubmissionModal = ({ event, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  return (
    <div className="fixed inset-0 bg-background/60 dark:bg-dark-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-background dark:bg-dark-background border border-primary/20 dark:border-dark-primary/30 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text dark:text-dark-text flex items-center gap-2">
            Submit Your Solution
          </h3>
          <button onClick={onClose} className="text-accent hover:text-accent/70 dark:text-dark-accent dark:hover:text-dark-accent/70 text-2xl font-bold">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe your approach, solution, or answer..."
              className="w-full px-3 py-5 bg-background dark:bg-dark-background border border-primary/30 dark:border-dark-primary/30 rounded-xl text-text dark:text-dark-text placeholder-text/50 dark:placeholder-dark-text/50 focus:border-primary dark:focus:border-dark-primary focus:outline-none transition-colors"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-text/80 dark:text-dark-text/80">Attachment (Optional)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-text/60 dark:text-dark-text/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-dark-primary/10 dark:file:text-dark-primary hover:file:bg-primary/20 dark:hover:file:bg-dark-primary/20 cursor-pointer bg-background dark:bg-dark-background border border-primary/30 dark:border-dark-primary/30 rounded-xl transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              if (!text.trim() && !file) {
                alert('Please provide either a text submission or upload a file');
                return;
              }
              onSubmit(text, file);
            }}
            disabled={!text.trim() && !file}
            className="flex-1 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white dark:bg-purple-500 dark:hover:bg-purple-700 dark:disabled:bg-gray-600 dark:text-white py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={16} />Submit Solution
          </button>
          <button
            onClick={onClose}
            className="bg-text/20 text-text dark:text-dark-text px-4 py-2 rounded-xl transition-colors hover:bg-text/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Section Tracker Component
const SectionTracker = ({ children, index, onVisibilityChange }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.3, margin: "0px 0px -50% 0px" });

  useEffect(() => {
    onVisibilityChange(index, isInView);
  }, [isInView, index, onVisibilityChange]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
};

const Roadmap = ({ challenge, userProgress, onBack, onSubmitEvent, loading }) => {
  const [submissions, setSubmissions] = useState({});
  const [visibleSections, setVisibleSections] = useState(new Set());
  const containerRef = useRef(null);

  const API_BASE2 = 'https://aseam.acm.org/LMS/roadmaps';

  // Map API response structure
  const challengeData = {
    ...challenge,
    subChallenges: challenge?.events || challenge?.subChallenges || []
  };

  const completedTasks = challengeData.subChallenges?.filter(event => event.is_completed).length || 0;
  const totalTasks = challengeData.subChallenges?.length || 0;
  const totalPoints = challengeData.subChallenges?.reduce((sum, event) => sum + (parseInt(event.points_earned) || 0), 0) || 0;

  // Handle visibility change for sections
  const handleVisibilityChange = useCallback((index, isVisible) => {
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      if (isVisible) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      if (newSet.size !== prev.size || ![...newSet].every(val => prev.has(val))) {
        return newSet;
      }
      return prev;
    });
  }, []);


  const getProgressLineHeight = () => {
    const sortedChallenges = getSortedChallenges();
    const completedCount = sortedChallenges.filter(event => event.is_completed).length;

    if (completedCount === 0) return { height: 0, touchedIndex: -1 };

    // Try to get actual DOM position of the last completed challenge
    const containerElement = containerRef.current;
    if (containerElement && completedCount > 0) {
      const timelineDots = containerElement.querySelectorAll('[data-timeline-dot]');
      if (timelineDots[completedCount - 1]) {
        const lastCompletedDot = timelineDots[completedCount - 1];
        const rect = lastCompletedDot.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();
        return {
          height: rect.top - containerRect.top + 40,
          touchedIndex: completedCount - 1
        };
      }
    }

    // Fallback to calculated height
    const baseOffset = 100;
    const sectionSpacing = window.innerWidth >= 640 ? 400 : 350;
    return {
      height: baseOffset + (completedCount - 1) * sectionSpacing + 50,
      touchedIndex: completedCount - 1
    };
  };
  // Sort challenges to put completed ones first
  const getSortedChallenges = () => {
    if (!challengeData.subChallenges) return [];

    return [...challengeData.subChallenges].sort((a, b) => {
      // Completed challenges first, then by original order
      if (a.is_completed && !b.is_completed) return -1;
      if (!a.is_completed && b.is_completed) return 1;
      return 0;
    });
  };
  const progressData = getProgressLineHeight();
  const progressHeight = progressData.height;
  const touchedIndex = progressData.touchedIndex;
  const sortedChallenges = getSortedChallenges();

  // Helper Functions for Timeline View
  const getStatusConfig = (event) => {
    const configs = {
      green: {
        bg: 'bg-green-200 dark:bg-green-900/30',
        text: 'text-black dark:text-green-400',
        icon: CheckCircle,
        border: 'border-green-200 dark:border-green-700',
        dot: 'bg-green-500'
      },
      yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        icon: Clock,
        border: 'border-yellow-200 dark:border-yellow-700',
        dot: 'bg-yellow-500'
      },
      red: {
        bg: 'bg-accent/10 dark:bg-dark-accent/20',
        text: 'text-accent dark:text-dark-accent',
        icon: X,
        border: 'border-accent/30 dark:border-dark-accent/30',
        dot: 'bg-accent dark:bg-dark-accent'
      },
      blue: {
        bg: 'bg-primary/10 dark:bg-dark-primary/20',
        text: 'text-primary dark:text-dark-primary',
        icon: CircleDot,
        border: 'border-primary/30 dark:border-dark-primary/30',
        dot: 'bg-primary/30 dark:bg-dark-primary/30'
      },

    };
    return configs[event.status_color] || configs.gray;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 dark:bg-dark-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-background dark:bg-dark-background border border-primary/20 dark:border-dark-primary/30 rounded-2xl p-8 flex items-center gap-4 shadow-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-dark-primary"></div>
          <p className="text-text dark:text-dark-text font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Add this check after the loading condition
  if (!challengeData || !challengeData.subChallenges || challengeData.subChallenges.length === 0) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 text-primary dark:text-dark-primary">Nothing Available Right Now</h2>
            <p className="text-text/70 dark:text-dark-text/70 mb-6">No questions are currently available for this challenge.</p>
          </div>
          <button
            onClick={onBack}
            className="bg-primary dark:bg-dark-primary text-background dark:text-dark-background px-6 py-2 rounded-xl transition-colors flex items-center gap-2 mx-auto hover:bg-primary/90 dark:hover:bg-dark-primary/90"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 dark:bg-dark-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 dark:bg-dark-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyanblue/5 dark:bg-dark-cyanblue/5 rounded-full blur-3xl"></div>

      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-colors border border-primary/30 dark:border-dark-primary/30 px-4 py-2 rounded-xl text-primary dark:text-dark-primary bg-background dark:bg-dark-background hover:bg-primary/10 dark:hover:bg-dark-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Challenges</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <div>
            <motion.h1
              className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 text-primary dark:text-dark-primary"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              viewport={{ once: true }}
            >
              {challengeData.title}
            </motion.h1>
            <motion.p
              className="text-base sm:text-lg max-w-3xl mx-auto mb-6 sm:mb-8 text-text/80 dark:text-dark-text/80 px-4"
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              viewport={{ once: true }}
            >
              {challengeData.description}
            </motion.p>
          </div>

          <motion.div
            className="text-center mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
            viewport={{ once: true }}
          >
            <p className="text-base sm:text-lg mb-4 font-semibold text-primary dark:text-dark-primary">Challenge Progress:</p>
            <motion.div
              className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-8 flex-wrap"
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, type: "spring" }}
              viewport={{ once: true }}
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-dark-primary">{completedTasks}</div>
                <div className="text-xs sm:text-sm font-semibold text-text/60 dark:text-dark-text/60">COMPLETED</div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary dark:text-dark-primary">:</div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-dark-primary">{totalTasks - completedTasks}</div>
                <div className="text-xs sm:text-sm font-semibold text-text/60 dark:text-dark-text/60">REMAINING</div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary dark:text-dark-primary">:</div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-dark-primary">{totalTasks}</div>
                <div className="text-xs sm:text-sm font-semibold text-text/60 dark:text-dark-text/60">TOTAL</div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary dark:text-dark-primary">:</div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-accent dark:text-dark-accent">{totalPoints}</div>
                <div className="text-xs sm:text-sm font-semibold text-accent dark:text-dark-accent">XP</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="max-w-6xl mx-auto relative mt-8" ref={containerRef}>
          {/* Progress Line - Desktop: center, Mobile: right side */}
          <div className="absolute left-1/2 sm:left-1/2 left-16 transform -translate-x-1/2 sm:-translate-x-1/2 w-1 bg-gradient-to-b from-secondary via-primary to-cyanblue dark:from-dark-secondary dark:via-dark-primary dark:to-dark-cyanblue opacity-30" style={{ height: `${sortedChallenges.length * 400 + 100}px` }}></div>
          <motion.div
            className="absolute left-1/2 sm:left-1/2 left-16 transform -translate-x-1/2 sm:-translate-x-1/2 w-1 bg-gradient-to-b from-secondary via-primary to-cyanblue dark:from-dark-secondary dark:via-dark-primary dark:to-dark-cyanblue z-10"
            initial={{ height: 0 }}
            animate={{ height: progressHeight }}
            transition={{ duration: 1, ease: "easeInOut" }}
          ></motion.div>

          <div className="space-y-6 sm:space-y-8">
            {getSortedChallenges().map((quest, index) => {
              const statusConfig = getStatusConfig(quest);
              const isLeft = index % 2 === 0;
              const StatusIcon = statusConfig.icon;
              const document = `${API_BASE2}/${quest.event_image}`;

              return (
                <SectionTracker key={quest.id} index={index} onVisibilityChange={handleVisibilityChange}>
                  <div className="relative">
                    {/* Timeline dot */}
                    <div className="absolute left-16 sm:left-1/2 transform -translate-x-1/2 translate-y-20 sm:translate-y-36 z-20">
                      <div data-timeline-dot className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 sm:border-4 border-background dark:border-dark-background flex items-center justify-center shadow-lg ${quest.is_completed
                        ? 'bg-green-400 dark:bg-green-400'
                        : index <= touchedIndex
                          ? 'bg-gradient-to-r from-secondary to-primary dark:from-dark-secondary dark:to-dark-primary'
                          : statusConfig.dot
                        }`}>
                        <StatusIcon className={`w-4 h-4 sm:w-6 sm:h-6 ${index <= touchedIndex
                          ? 'text-background dark:text-dark-background'
                          : 'text-background dark:text-dark-background'
                          }`} />
                      </div>
                    </div>

                    {/* Quest title badge - Hidden on mobile, shows on larger screens */}
                    <div className={`hidden sm:block absolute top-36 translate-y-1/4 z-10 ${isLeft ? 'left-1/2 ml-8' : 'right-1/2 mr-8'}`}>
                      <motion.div
                        className="bg-background/80 dark:bg-dark-background/80 backdrop-blur-md border border-primary/20 dark:border-dark-primary/30 rounded-xl px-3 py-1"
                        initial={{ opacity: 0, x: isLeft ? -100 : 100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        viewport={{ once: false, amount: 0.5 }}
                      >
                        <span className="text-sm font-medium text-text/80 dark:text-dark-text/80">{quest.title}</span>
                      </motion.div>
                    </div>

                    {/* Quest Card */}
                    {/* Quest Card */}
                    <motion.div
                      className="flex justify-start px-4 sm:px-0 sm:justify-start sm:justify-end"
                      style={{ justifyContent: window.innerWidth >= 640 ? (isLeft ? 'flex-start' : 'flex-end') : 'flex-start' }}
                      initial={{ opacity: 0, y: 100 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      viewport={{ amount: 0.25 }}
                    >
                      <div className={`w-full sm:w-5/12 pl-20 sm:pl-0 ${isLeft ? 'sm:mr-8' : 'sm:ml-8'} mt-4 sm:mt-8`}>

                        {/* Main Quest Card */}
                        <div className={`bg-background/90 dark:bg-dark-background/90 backdrop-blur-md p-4 sm:p-6 shadow-xl border-2 border-primary/20 dark:border-dark-primary/30 rounded-2xl w-full flex ${isLeft ? 'sm:flex-row-reverse' : 'sm:flex-row'} flex-col`}>
                          <div className="w-full">


                            <h3 className="text-lg sm:text-xl font-bold text-text dark:text-dark-text mb-3">{quest.title}</h3>
                            <div className="text-text/70 dark:text-dark-text/70 text-sm mb-4 leading-relaxed">
                              {quest.description.replace(/<[^>]*>/g, '')}
                            </div>

                            {/* Document viewing & downloading */}
                            {quest.event_image && quest.event_image !== null && (
                              <div className='flex flex-row gap-4 justify-start mb-4 ml-2 sm:ml-4 text-primary dark:text-dark-primary text-sm'>
                                <a href={`${API_BASE2}/${quest.event_image}`} target="_blank" rel="noopener noreferrer" className='flex flex-row gap-1 items-center hover:text-primary/80 dark:hover:text-dark-primary/80 transition-colors'>
                                  <span className="hidden sm:inline">View File</span>
                                  <span className="sm:hidden">View</span>
                                  <Eye className="w-4 h-4" />
                                </a>
                                <a href={`${API_BASE2}/${quest.event_image}`} download className='hover:text-primary/80 dark:hover:text-dark-primary/80 transition-colors'>
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}

                            {/* Status and Points */}
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                                {quest.status_text}
                              </span>
                              <div className="flex items-center gap-1 text-text/70 dark:text-dark-text/70">
                                <Star className="w-4 h-4 text-secondary dark:text-dark-secondary" />
                                <span className="font-semibold">{quest.points} XP</span>
                              </div>
                            </div>

                            {/* Submit Button */}
                            {quest.can_submit && (
                              <button
                                onClick={() => setSubmissions({ ...submissions, [quest.id]: true })}
                                className="w-full bg-gradient-to-r from-secondary to-primary dark:from-dark-secondary dark:to-dark-primary hover:from-secondary/90 hover:to-primary/90 dark:hover:from-dark-secondary/90 dark:hover:to-dark-primary/90 text-background dark:text-dark-background py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                              >
                                <Zap size={16} />
                                <span className="hidden sm:inline">
                                  {quest.submission_status === 'rejected' ? 'Resubmit ' : 'Get Started'}
                                </span>
                                <span className="sm:hidden">
                                  {quest.submission_status === 'rejected' ? 'Resubmit' : 'Start'}
                                </span>
                              </button>
                            )}

                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </SectionTracker>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submission Modals */}
      {Object.entries(submissions).map(([eventId, isOpen]) => {
        if (!isOpen) return null;
        const event = challengeData.subChallenges.find(e => e.id == eventId);
        if (!event) return null;
        return (
          <SubmissionModal
            key={eventId}
            event={event}
            onClose={() => setSubmissions({ ...submissions, [eventId]: false })}
            onSubmit={(text, file) => {
              onSubmitEvent(eventId, challengeData.id, text, file);
              setSubmissions({ ...submissions, [eventId]: false });
            }}
          />
        );
      })}
    </div>
  );
};
export default Roadmap;