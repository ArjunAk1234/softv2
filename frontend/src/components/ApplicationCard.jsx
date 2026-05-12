import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';

const ApplicationCard = ({ application, onViewDetails }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      applied: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Applied' },
      assessment: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Assessment' },
      interview: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Interview' },
      selected: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Selected' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.applied;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'selected':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'assessment':
      case 'interview':
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const appliedDate = new Date(application.appliedDate);
  const daysAgo = Math.floor((new Date() - appliedDate) / (1000 * 60 * 60 * 24));

  const upcomingAssessment = application.assessments?.find(a => a.status === 'pending');
  const upcomingInterview = application.interviews?.find(i => i.status === 'pending');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-background dark:bg-dark-background border-2 border-secondary/30 dark:border-dark-secondary/30 rounded-2xl p-6 hover:border-secondary dark:hover:border-dark-secondary hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-300 flex flex-col justify-between cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary dark:text-dark-primary mb-1 line-clamp-2">
              {application.jobTitle}
            </h3>
            <p className="text-sm text-text/70 dark:text-dark-text/70 mb-3">
              {application.company}
            </p>
          </div>
          <div className="flex-shrink-0 ml-2">
            {getStatusIcon(application.status)}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-3">
          {getStatusBadge(application.status)}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-text/60 dark:text-dark-text/60 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{application.location}</span>
        </div>

        {/* Applied Date */}
        <div className="flex items-center gap-2 text-xs text-text/50 dark:text-dark-text/50">
          <Calendar className="w-4 h-4" />
          <span>Applied {daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}</span>
        </div>
      </div>

      {/* Upcoming Events */}
      {(upcomingAssessment || upcomingInterview) && (
        <div className="space-y-2 mb-4 pb-4 border-t border-secondary/20 dark:border-dark-secondary/20 pt-4">
          {upcomingAssessment && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700/30"
            >
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                📝 Assessment Round
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {new Date(upcomingAssessment.scheduledDate).toLocaleDateString()}
              </p>
            </motion.div>
          )}
          {upcomingInterview && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700/30"
            >
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                🎤 Interview
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {new Date(upcomingInterview.scheduledDate).toLocaleDateString()}
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* View Details Button */}
      <button className="w-full px-4 py-2 rounded-lg border-2 border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors font-semibold text-sm flex items-center justify-center gap-2">
        View Details
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default ApplicationCard;
