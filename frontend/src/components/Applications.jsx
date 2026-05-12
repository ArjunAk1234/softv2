import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ApplicationCard from './ApplicationCard';
import ApplicationDetails from './ApplicationDetails';
import { Briefcase, Filter, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:8006';

const Applications = () => {
  const { auth } = useAuth();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: 'all' });

  const mapStatus = (backendStatus) => {
    const map = {
      applied: 'applied',
      resume_reviewed: 'applied',
      shortlisted: 'applied',
      rejected: 'rejected',
      test_invited: 'assessment',
      test_in_progress: 'assessment',
      test_completed: 'assessment',
      interview_scheduled: 'interview',
      interview_completed: 'interview',
      hired: 'selected',
    };
    return map[backendStatus] || 'applied';
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/candidate/applications`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const transformed = data.map(app => ({
          id: app.id,
          jobId: app.job_id,
          jobTitle: app.job_title,
          company: app.company_name,
          location: app.location,
          jobType: app.job_type,
          status: mapStatus(app.status),
          appliedDate: app.created_at,
          resumeScore: app.resume_score,
          testScore: app.test_score,
          interviewScore: app.interview_score,
          finalScore: app.final_score,
          aiFeedback: app.ai_resume_feedback,
          rawStatus: app.status,
          canScheduleInterview: app.status === 'test_completed',
        }));
        setApplications(transformed);
      } else {
        setError(data.error || 'Failed to load applications');
      }
    } catch {
      setError('Network error. Make sure the backend is running.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (auth?.token) fetchApplications();
  }, [auth?.token]);

  const filteredApplications = applications.filter(app => {
    return filters.status === 'all' || app.status === filters.status;
  });

  const statusOptions = [
    { value: 'all', label: 'All Applications' },
    { value: 'applied', label: 'Applied' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'interview', label: 'Interview' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
  ];

  if (!auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text dark:text-dark-text mb-4">Authentication Required</h2>
          <p className="text-text dark:text-dark-text">Please log in to view your applications.</p>
        </div>
      </div>
    );
  }

  if (selectedApplication) {
    return (
      <ApplicationDetails
        application={selectedApplication}
        onBack={() => { setSelectedApplication(null); fetchApplications(); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-8 h-8 text-primary dark:text-dark-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-primary dark:text-dark-primary">
              My Applications
            </h1>
          </div>
          <p className="text-text/70 dark:text-dark-text/70">
            Track your job applications and interview progress.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-secondary/10 dark:bg-dark-secondary/10 rounded-2xl p-4 sm:p-6 mb-8 border border-secondary/30 dark:border-dark-secondary/30">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary dark:text-dark-primary" />
            <h3 className="text-lg font-semibold text-primary dark:text-dark-primary">Filter by Status</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilters({ status: option.value })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filters.status === option.value
                    ? 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background'
                    : 'bg-background dark:bg-dark-background border border-secondary/30 dark:border-dark-secondary/30 text-text dark:text-dark-text hover:border-secondary dark:hover:border-dark-secondary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count + Refresh */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-text/70 dark:text-dark-text/70">
            Showing {filteredApplications.length} of {applications.length} applications
          </p>
          <button
            onClick={fetchApplications}
            className="text-sm text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
          </div>
        ) : filteredApplications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map(application => (
              <ApplicationCard
                key={application.id}
                application={application}
                onViewDetails={() => setSelectedApplication(application)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Briefcase className="w-16 h-16 text-primary/30 dark:text-dark-primary/30 mb-4" />
            <p className="text-lg text-text/70 dark:text-dark-text/70">
              No applications found. Apply for jobs to see them here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
