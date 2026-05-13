// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { ChevronLeft, Calendar, Clock, User, Video, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

// const InterviewSession = ({ interview, application, onBack }) => {
//   const [showJoinConfirm, setShowJoinConfirm] = useState(false);
//   const [hasJoined, setHasJoined] = useState(false);

//   const interviewDate = new Date(interview.scheduledDate);
//   const now = new Date();
//   const timeUntilInterview = interviewDate - now;
//   const isUpcoming = timeUntilInterview > 0;
//   const minutesUntil = Math.floor(timeUntilInterview / (1000 * 60));
//   const hoursUntil = Math.floor(timeUntilInterview / (1000 * 60 * 60));
//   const daysUntil = Math.floor(timeUntilInterview / (1000 * 60 * 60 * 24));

//   const getTimeString = () => {
//     if (daysUntil > 0) {
//       return `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
//     } else if (hoursUntil > 0) {
//       return `in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
//     } else if (minutesUntil > 0) {
//       return `in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
//     } else {
//       return 'Happening now';
//     }
//   };

//   const getStatusBadge = (status) => {
//     switch (status) {
//       case 'pending':
//         return {
//           bg: 'bg-yellow-100 dark:bg-yellow-900/30',
//           text: 'text-yellow-700 dark:text-yellow-300',
//           label: 'Scheduled'
//         };
//       case 'completed':
//         return {
//           bg: 'bg-green-100 dark:bg-green-900/30',
//           text: 'text-green-700 dark:text-green-300',
//           label: 'Completed'
//         };
//       default:
//         return {
//           bg: 'bg-gray-100 dark:bg-gray-900/30',
//           text: 'text-gray-700 dark:text-gray-300',
//           label: 'Status'
//         };
//     }
//   };

//   const badge = getStatusBadge(interview.status);

//   const handleJoinClick = () => {
//     if (interview.status === 'pending' && isUpcoming && minutesUntil <= 15) {
//       setShowJoinConfirm(true);
//     }
//   };

//   const confirmJoin = () => {
//     setHasJoined(true);
//     setShowJoinConfirm(false);
//     // In real app, would open meeting link
//   };

//   return (
//     <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
//       {/* Header */}
//       <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
//           <button
//             onClick={onBack}
//             className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold"
//           >
//             <ChevronLeft className="w-5 h-5" />
//             Back to Application
//           </button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="grid grid-cols-1 lg:grid-cols-3 gap-8"
//         >
//           {/* Main Panel */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Interview Card */}
//             <div className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-3xl border border-secondary/30 dark:border-dark-secondary/30 p-8">
//               <div className="flex items-start justify-between mb-6">
//                 <div>
//                   <h1 className="text-4xl font-bold text-primary dark:text-dark-primary mb-2">
//                     {interview.type} Interview
//                   </h1>
//                   <p className="text-xl text-text/70 dark:text-dark-text/70">
//                     {application.jobTitle} at {application.company}
//                   </p>
//                 </div>
//                 <div className={`px-4 py-2 rounded-full font-semibold ${badge.bg} ${badge.text}`}>
//                   {badge.label}
//                 </div>
//               </div>

//               <p className="text-lg text-text/70 dark:text-dark-text/70 mb-6">
//                 {interview.description}
//               </p>

//               {/* Interview Details */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
//                 {/* Date & Time */}
//                 <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
//                   <div className="flex items-center gap-3 mb-3">
//                     <Calendar className="w-6 h-6 text-primary dark:text-dark-primary" />
//                     <span className="text-sm text-text/60 dark:text-dark-text/60 font-semibold">Date</span>
//                   </div>
//                   <p className="text-lg font-bold text-text dark:text-dark-text mb-1">
//                     {interviewDate.toLocaleDateString('en-US', {
//                       weekday: 'long',
//                       year: 'numeric',
//                       month: 'long',
//                       day: 'numeric'
//                     })}
//                   </p>
//                   <p className="text-sm text-text/60 dark:text-dark-text/60">
//                     {getTimeString()}
//                   </p>
//                 </div>

//                 {/* Time & Duration */}
//                 <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
//                   <div className="flex items-center gap-3 mb-3">
//                     <Clock className="w-6 h-6 text-primary dark:text-dark-primary" />
//                     <span className="text-sm text-text/60 dark:text-dark-text/60 font-semibold">Time</span>
//                   </div>
//                   <p className="text-lg font-bold text-text dark:text-dark-text mb-1">
//                     {interviewDate.toLocaleTimeString('en-US', {
//                       hour: '2-digit',
//                       minute: '2-digit',
//                       hour12: true
//                     })}
//                   </p>
//                   <p className="text-sm text-text/60 dark:text-dark-text/60">
//                     Duration: {interview.duration} minutes
//                   </p>
//                 </div>

//                 {/* Interviewer */}
//                 <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
//                   <div className="flex items-center gap-3 mb-3">
//                     <User className="w-6 h-6 text-primary dark:text-dark-primary" />
//                     <span className="text-sm text-text/60 dark:text-dark-text/60 font-semibold">Interviewer</span>
//                   </div>
//                   <p className="text-lg font-bold text-text dark:text-dark-text">
//                     {interview.interviewerName}
//                   </p>
//                 </div>

//                 {/* Location/Meeting */}
//                 <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
//                   <div className="flex items-center gap-3 mb-3">
//                     <Video className="w-6 h-6 text-primary dark:text-dark-primary" />
//                     <span className="text-sm text-text/60 dark:text-dark-text/60 font-semibold">Meeting</span>
//                   </div>
//                   <p className="text-lg font-bold text-text dark:text-dark-text">
//                     {interview.meetingLink ? 'Video Call' : 'Link will be provided'}
//                   </p>
//                 </div>
//               </div>

//               {/* Info Box */}
//               {interview.status === 'pending' && isUpcoming && (
//                 <motion.div
//                   initial={{ opacity: 0, y: -10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className={`p-4 rounded-lg border-2 mb-6 ${
//                     minutesUntil <= 15
//                       ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
//                       : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
//                   }`}
//                 >
//                   <p className="font-semibold mb-1">
//                     {minutesUntil <= 15 ? '⏰ Interview is starting soon!' : '📅 Upcoming Interview'}
//                   </p>
//                   <p className="text-sm">
//                     {minutesUntil <= 15
//                       ? 'The join button is now available. Click it to enter the meeting room.'
//                       : `Your interview will begin ${getTimeString()}. Join button will be available 15 minutes before.`}
//                   </p>
//                 </motion.div>
//               )}

//               {/* Interview Guidelines */}
//               <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
//                 <h3 className="text-lg font-bold mb-4 text-primary dark:text-dark-primary">
//                   Interview Guidelines
//                 </h3>
//                 <ul className="space-y-2 text-text/80 dark:text-dark-text/80">
//                   <li className="flex items-start gap-3">
//                     <span className="text-primary dark:text-dark-primary font-bold">✓</span>
//                     <span>Join 5 minutes before the scheduled time</span>
//                   </li>
//                   <li className="flex items-start gap-3">
//                     <span className="text-primary dark:text-dark-primary font-bold">✓</span>
//                     <span>Ensure you have a stable internet connection</span>
//                   </li>
//                   <li className="flex items-start gap-3">
//                     <span className="text-primary dark:text-dark-primary font-bold">✓</span>
//                     <span>Use a quiet environment with proper lighting</span>
//                   </li>
//                   <li className="flex items-start gap-3">
//                     <span className="text-primary dark:text-dark-primary font-bold">✓</span>
//                     <span>Have your resume and relevant documents ready</span>
//                   </li>
//                   <li className="flex items-start gap-3">
//                     <span className="text-primary dark:text-dark-primary font-bold">✓</span>
//                     <span>Test your camera and microphone beforehand</span>
//                   </li>
//                 </ul>
//               </div>
//             </div>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             {/* Join Button */}
//             {interview.status === 'pending' && isUpcoming ? (
//               <motion.button
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 onClick={handleJoinClick}
//                 disabled={minutesUntil > 15}
//                 className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all ${
//                   minutesUntil <= 15
//                     ? 'bg-green-600 dark:bg-green-700 text-white hover:opacity-90 cursor-pointer'
//                     : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed opacity-60'
//                 }`}
//               >
//                 {minutesUntil <= 15 ? '🎤 Join Interview' : 'Join Available Soon'}
//               </motion.button>
//             ) : interview.status === 'completed' ? (
//               <div className="w-full px-6 py-4 rounded-xl font-bold text-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center justify-center gap-2 border-2 border-green-300 dark:border-green-700">
//                 <CheckCircle className="w-5 h-5" />
//                 Interview Completed
//               </div>
//             ) : null}

//             {/* Quick Info */}
//             <div className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-2xl border border-secondary/30 dark:border-dark-secondary/30 p-6">
//               <h3 className="font-bold text-lg mb-4 text-primary dark:text-dark-primary">
//                 Quick Info
//               </h3>
//               <div className="space-y-3">
//                 <div>
//                   <p className="text-xs text-text/60 dark:text-dark-text/60 font-semibold mb-1">
//                     POSITION
//                   </p>
//                   <p className="font-semibold text-text dark:text-dark-text">
//                     {application.jobTitle}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-text/60 dark:text-dark-text/60 font-semibold mb-1">
//                     COMPANY
//                   </p>
//                   <p className="font-semibold text-text dark:text-dark-text">
//                     {application.company}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-text/60 dark:text-dark-text/60 font-semibold mb-1">
//                     LOCATION
//                   </p>
//                   <p className="font-semibold text-text dark:text-dark-text">
//                     {application.location}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-text/60 dark:text-dark-text/60 font-semibold mb-1">
//                     INTERVIEW TYPE
//                   </p>
//                   <p className="font-semibold text-text dark:text-dark-text">
//                     {interview.type}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Important Notice */}
//             <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-6">
//               <div className="flex gap-3">
//                 <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">
//                     Important
//                   </p>
//                   <p className="text-sm text-yellow-700 dark:text-yellow-200">
//                     Missing an interview without prior notification may affect your application status. If you need to reschedule, please contact the recruiter immediately.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </main>

//       {/* Join Confirmation Modal */}
//       {showJoinConfirm && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
//           onClick={() => setShowJoinConfirm(false)}
//         >
//           <motion.div
//             initial={{ scale: 0.9, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             onClick={(e) => e.stopPropagation()}
//             className="bg-background dark:bg-dark-background rounded-2xl p-6 max-w-md w-full border border-secondary/30 dark:border-dark-secondary/30"
//           >
//             <h3 className="text-2xl font-bold text-primary dark:text-dark-primary mb-4">
//               Ready to Join?
//             </h3>
//             <p className="text-text/80 dark:text-dark-text/80 mb-6">
//               Make sure your camera, microphone, and internet connection are working properly before joining the interview.
//             </p>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowJoinConfirm(false)}
//                 className="flex-1 px-4 py-2 rounded-lg border-2 border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 transition-colors font-semibold"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmJoin}
//                 className="flex-1 px-4 py-2 rounded-lg bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90 transition-all font-semibold"
//               >
//                 Join Now
//               </button>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </div>
//   );
// };

// export default InterviewSession;


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, Clock, User, Video, AlertCircle, CheckCircle } from 'lucide-react';
import InterviewRoom from './InterviewRoom'; // ← import the room component

/**
 * Props:
 *  interview   – { id, scheduledDate, type, description, duration, interviewerName,
 *                  meetingLink, status }
 *  application – { jobTitle, company, location }
 *  token       – JWT string for the candidate
 *  candidateName – logged-in candidate's name
 *  onBack      – callback to go back to application view
 */
const InterviewSession = ({ interview, application, token, candidateName, onBack }) => {
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const interviewDate = new Date(interview.scheduled_at || interview.scheduledDate);
  const now = new Date();
  const timeUntilMs = interviewDate - now;
  const isUpcoming = timeUntilMs > 0;
  const minutesUntil = Math.floor(timeUntilMs / (1000 * 60));
  const hoursUntil = Math.floor(timeUntilMs / (1000 * 60 * 60));
  const daysUntil = Math.floor(timeUntilMs / (1000 * 60 * 60 * 24));

  const getTimeString = () => {
    if (daysUntil > 0) return `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
    if (hoursUntil > 0) return `in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
    if (minutesUntil > 0) return `in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
    return 'Happening now';
  };

  const canJoinNow = isUpcoming ? minutesUntil <= 15 : true; // also joinable if past time

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled': return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Scheduled' };
      case 'in_progress': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'In Progress' };
      case 'completed': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Completed' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', label: 'Pending' };
    }
  };

  const badge = getStatusBadge(interview.status);

  // ── FIX: render the actual InterviewRoom when candidate joins ──────────────
  if (hasJoined) {
    return (
      <InterviewRoom
        session={interview}
        role="candidate"
        token={token}
        candidateName={candidateName}
        interviewerName={interview.interviewer_name || interview.interviewerName}
        onLeave={() => setHasJoined(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Application
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-3xl border border-secondary/30 dark:border-dark-secondary/30 p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-primary dark:text-dark-primary mb-2">
                    {interview.type || 'Video'} Interview
                  </h1>
                  <p className="text-xl text-text/70 dark:text-dark-text/70">
                    {application.jobTitle} at {application.company}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full font-semibold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </div>
              </div>

              {interview.description && (
                <p className="text-lg text-text/70 dark:text-dark-text/70 mb-6">
                  {interview.description}
                </p>
              )}

              {/* Interview Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {/* Date */}
                <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-6 h-6 text-primary dark:text-dark-primary" />
                    <span className="text-sm text-text/60 dark:text-dark-text/60 font-semibold">Date</span>
                  </div>
                  <p className="text-lg font-bold text-text dark:text-dark-text mb-1">
                    {interviewDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-text/60 dark:text-dark-text/60">{getTimeString()}</p>
                </div>

                {/* Time */}
                <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-6 h-6 text-primary dark:text-dark-primary" />
                    <span className="text-sm text-text/60 dark:text-dark-text/60 font-semibold">Time</span>
                  </div>
                  <p className="text-lg font-bold text-text dark:text-dark-text mb-1">
                    {interviewDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                  <p className="text-sm text-text/60 dark:text-dark-text/60">
                    Duration: {interview.duration_minutes || interview.duration || 45} minutes
                  </p>
                </div>

                {/* Interviewer */}
                <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-6 h-6 text-primary dark:text-dark-primary" />
                    <span className="text-sm text-text/60 dark:text-dark-text/60 font-semibold">Interviewer</span>
                  </div>
                  <p className="text-lg font-bold text-text dark:text-dark-text">
                    {interview.interviewer_name || interview.interviewerName || 'TBD'}
                  </p>
                </div>

                {/* Meeting */}
                <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Video className="w-6 h-6 text-primary dark:text-dark-primary" />
                    <span className="text-sm text-text/60 dark:text-dark-text/60 font-semibold">Meeting</span>
                  </div>
                  <p className="text-lg font-bold text-text dark:text-dark-text">Video Call (in-app)</p>
                </div>
              </div>

              {/* Info Banner */}
              {interview.status !== 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border-2 mb-6 ${canJoinNow
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                    }`}
                >
                  <p className="font-semibold mb-1">
                    {canJoinNow ? '⏰ Interview is starting soon!' : '📅 Upcoming Interview'}
                  </p>
                  <p className="text-sm">
                    {canJoinNow
                      ? 'The join button is now active. Click it to enter the interview room.'
                      : `Your interview will begin ${getTimeString()}. Join button will be available 15 minutes before.`}
                  </p>
                </motion.div>
              )}

              {/* Guidelines */}
              <div className="bg-background dark:bg-dark-background rounded-2xl p-6 border border-secondary/20 dark:border-dark-secondary/20">
                <h3 className="text-lg font-bold mb-4 text-primary dark:text-dark-primary">Interview Guidelines</h3>
                <ul className="space-y-2 text-text/80 dark:text-dark-text/80">
                  {[
                    'Join 5 minutes before the scheduled time',
                    'Ensure you have a stable internet connection',
                    'Use a quiet environment with proper lighting',
                    'Have your resume and relevant documents ready',
                    'Test your camera and microphone beforehand',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-primary dark:text-dark-primary font-bold">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join / Completed button */}
            {interview.status === 'completed' ? (
              <div className="w-full px-6 py-4 rounded-xl font-bold text-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center justify-center gap-2 border-2 border-green-300 dark:border-green-700">
                <CheckCircle className="w-5 h-5" />
                Interview Completed
              </div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => canJoinNow && setShowJoinConfirm(true)}
                disabled={!canJoinNow}
                className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all ${canJoinNow
                    ? 'bg-green-600 dark:bg-green-700 text-white hover:opacity-90 cursor-pointer shadow-lg shadow-green-600/20'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed opacity-60'
                  }`}
              >
                {canJoinNow ? '🎤 Join Interview' : 'Join Available Soon'}
              </motion.button>
            )}

            {/* Quick Info */}
            <div className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-2xl border border-secondary/30 dark:border-dark-secondary/30 p-6">
              <h3 className="font-bold text-lg mb-4 text-primary dark:text-dark-primary">Quick Info</h3>
              <div className="space-y-3">
                {[
                  { label: 'POSITION', value: application.jobTitle },
                  { label: 'COMPANY', value: application.company },
                  { label: 'LOCATION', value: application.location },
                  { label: 'INTERVIEW TYPE', value: interview.type || 'Video' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-text/60 dark:text-dark-text/60 font-semibold mb-1">{label}</p>
                    <p className="font-semibold text-text dark:text-dark-text">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">Important</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    Missing an interview without prior notification may affect your application status. If you need to reschedule, contact the recruiter immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Join Confirmation Modal */}
      {showJoinConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowJoinConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-background dark:bg-dark-background rounded-2xl p-6 max-w-md w-full border border-secondary/30 dark:border-dark-secondary/30"
          >
            <h3 className="text-2xl font-bold text-primary dark:text-dark-primary mb-4">Ready to Join?</h3>
            <p className="text-text/80 dark:text-dark-text/80 mb-6">
              Make sure your camera, microphone, and internet connection are working properly before joining.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowJoinConfirm(false); setHasJoined(true); }}
                className="flex-1 px-4 py-2 rounded-lg bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90 transition-all font-semibold"
              >
                Join Now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default InterviewSession;