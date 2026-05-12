import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, DollarSign, Clock, Users, Briefcase, CheckCircle } from 'lucide-react';

const JobDetails = ({ job, onBack, onApply, hasApplied }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const daysUntilDeadline = Math.ceil(
    (new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const handleApply = () => {
    setShowConfirmation(true);
  };

  const confirmApply = () => {
    onApply(job.id);
    setShowConfirmation(false);
  };

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
            Back to Jobs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-3xl border border-secondary/30 dark:border-dark-secondary/30 p-8"
        >
          {/* Job Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-primary dark:text-dark-primary mb-2">
                  {job.title}
                </h1>
                <p className="text-xl text-text/70 dark:text-dark-text/70">
                  {job.company}
                </p>
              </div>
              <span className="px-4 py-2 bg-primary/20 dark:bg-dark-primary/20 text-primary dark:text-dark-primary rounded-full font-semibold text-lg">
                {job.category}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-background dark:bg-dark-background rounded-xl p-4 border border-secondary/20 dark:border-dark-secondary/20">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-primary dark:text-dark-primary" />
                  <span className="text-sm text-text/60 dark:text-dark-text/60">Location</span>
                </div>
                <p className="font-semibold text-text dark:text-dark-text">{job.location}</p>
              </div>

              <div className="bg-background dark:bg-dark-background rounded-xl p-4 border border-secondary/20 dark:border-dark-secondary/20">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-primary dark:text-dark-primary" />
                  <span className="text-sm text-text/60 dark:text-dark-text/60">Salary</span>
                </div>
                <p className="font-semibold text-text dark:text-dark-text">{job.salary}</p>
              </div>

              <div className="bg-background dark:bg-dark-background rounded-xl p-4 border border-secondary/20 dark:border-dark-secondary/20">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-5 h-5 text-primary dark:text-dark-primary" />
                  <span className="text-sm text-text/60 dark:text-dark-text/60">Level</span>
                </div>
                <p className="font-semibold text-text dark:text-dark-text">{job.experience}</p>
              </div>

              <div className="bg-background dark:bg-dark-background rounded-xl p-4 border border-secondary/20 dark:border-dark-secondary/20">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-primary dark:text-dark-primary" />
                  <span className="text-sm text-text/60 dark:text-dark-text/60">Deadline</span>
                </div>
                <p className={`font-semibold ${daysUntilDeadline <= 3 ? 'text-red-500' : 'text-text dark:text-dark-text'}`}>
                  {daysUntilDeadline} days left
                </p>
              </div>
            </div>
          </div>

          {/* Main Description */}
          <div className="mb-8 pb-8 border-b border-secondary/20 dark:border-dark-secondary/20">
            <h2 className="text-2xl font-bold text-primary dark:text-dark-primary mb-4">
              About This Role
            </h2>
            <p className="text-lg text-text/80 dark:text-dark-text/80 leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          <div className="mb-8 pb-8 border-b border-secondary/20 dark:border-dark-secondary/20">
            <h2 className="text-2xl font-bold text-primary dark:text-dark-primary mb-4">
              Required Skills & Qualifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job.requirements.map((req, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-4 bg-background dark:bg-dark-background rounded-lg border border-secondary/10 dark:border-dark-secondary/10"
                >
                  <CheckCircle className="w-5 h-5 text-secondary dark:text-dark-secondary flex-shrink-0" />
                  <span className="text-text dark:text-dark-text font-medium">{req}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
            <div className="flex items-center gap-4 mb-6">
              <Users className="w-6 h-6 text-primary dark:text-dark-primary" />
              <div>
                <p className="text-sm text-text/60 dark:text-dark-text/60">Total Applicants</p>
                <p className="text-2xl font-bold text-text dark:text-dark-text">{job.applicants}</p>
              </div>
            </div>
            <p className="text-sm text-text/60 dark:text-dark-text/60 mb-4">
              Posted on {new Date(job.postedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors font-bold text-lg"
          >
            Back to Jobs
          </button>
          <button
            onClick={handleApply}
            disabled={hasApplied}
            className={`flex-1 px-6 py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              hasApplied
                ? 'bg-green-500/30 dark:bg-green-900/40 text-green-700 dark:text-green-300 cursor-not-allowed'
                : 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90'
            }`}
          >
            {hasApplied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Already Applied
              </>
            ) : (
              'Apply Now'
            )}
          </button>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background dark:bg-dark-background rounded-2xl p-6 max-w-md w-full border border-secondary/30 dark:border-dark-secondary/30"
            >
              <h3 className="text-2xl font-bold text-primary dark:text-dark-primary mb-4">
                Confirm Application
              </h3>
              <p className="text-text/80 dark:text-dark-text/80 mb-6">
                Are you sure you want to apply for the <strong>{job.title}</strong> position at <strong>{job.company}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApply}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90 transition-all font-semibold"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobDetails;
