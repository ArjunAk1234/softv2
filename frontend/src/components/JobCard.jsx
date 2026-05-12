import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Clock, Users, ArrowRight } from 'lucide-react';

const JobCard = ({ job, onViewDetails, onApply, hasApplied }) => {
  const daysUntilDeadline = Math.ceil(
    (new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const getExperienceBadgeColor = (level) => {
    switch (level) {
      case 'Entry Level':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'Mid Level':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'Senior':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Development':
        return 'text-primary dark:text-dark-primary';
      case 'Design':
        return 'text-secondary dark:text-dark-secondary';
      case 'Data Science':
        return 'text-accent dark:text-dark-accent';
      case 'Infrastructure':
        return 'text-cyanblue dark:text-dark-cyanblue';
      default:
        return 'text-text dark:text-dark-text';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-background dark:bg-dark-background border-2 border-secondary/30 dark:border-dark-secondary/30 rounded-2xl p-6 hover:border-secondary dark:hover:border-dark-secondary hover:shadow-lg dark:hover:shadow-lg/20 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary dark:text-dark-primary mb-1 line-clamp-2">
              {job.title}
            </h3>
            <p className="text-sm text-text/70 dark:text-dark-text/70 mb-3">
              {job.company}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getExperienceBadgeColor(job.experience)}`}>
            {job.experience}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-text/60 dark:text-dark-text/60 line-clamp-3 mb-4">
          {job.description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {job.requirements.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="text-xs bg-secondary/10 dark:bg-dark-secondary/10 text-secondary dark:text-dark-secondary px-2 py-1 rounded-lg"
            >
              {skill}
            </span>
          ))}
          {job.requirements.length > 3 && (
            <span className="text-xs text-text/50 dark:text-dark-text/50 px-2 py-1">
              +{job.requirements.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-6 pb-6 border-b border-secondary/20 dark:border-dark-secondary/20">
        {/* Salary */}
        <div className="flex items-center gap-3 text-sm">
          <DollarSign className="w-4 h-4 text-primary dark:text-dark-primary flex-shrink-0" />
          <span className="text-text dark:text-dark-text font-medium">{job.salary}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="w-4 h-4 text-primary dark:text-dark-primary flex-shrink-0" />
          <span className="text-text dark:text-dark-text">{job.location}</span>
        </div>

        {/* Deadline */}
        {daysUntilDeadline >= 0 && (
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-primary dark:text-dark-primary flex-shrink-0" />
            <span className={`${daysUntilDeadline <= 3 ? 'text-red-500 font-semibold' : 'text-text dark:text-dark-text'}`}>
              {daysUntilDeadline} days remaining
            </span>
          </div>
        )}

        {/* Applicants */}
        <div className="flex items-center gap-3 text-sm">
          <Users className="w-4 h-4 text-primary dark:text-dark-primary flex-shrink-0" />
          <span className="text-text dark:text-dark-text">{job.applicants} applicants</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onViewDetails(job.id)}
          className="flex-1 px-4 py-2 rounded-lg border-2 border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onApply(job.id)}
          disabled={hasApplied}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            hasApplied
              ? 'bg-green-500/20 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-not-allowed'
              : 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90'
          }`}
        >
          {hasApplied ? '✓ Applied' : 'Apply'}
        </button>
      </div>
    </motion.div>
  );
};

export default JobCard;
