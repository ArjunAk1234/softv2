import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Loader2, CheckCircle, Briefcase, Send } from 'lucide-react';

const API_BASE = 'http://localhost:8006';

const ApplyModal = ({ job, token, onClose, onApplied }) => {
  const [step, setStep] = useState('form'); // 'form' | 'uploading' | 'done'
  const [file, setFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!file) { setError('Please upload your resume'); return; }
    setApplying(true);

    try {
      // Step 1: Create application
      const applyRes = await fetch(`${API_BASE}/candidate/apply/${job.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coverLetter }),
      });
      const applyData = await applyRes.json();
      if (!applyRes.ok) { setError(applyData.error || 'Failed to apply'); setApplying(false); return; }

      const appId = applyData.id;
      setStep('uploading');

      // Step 2: Upload resume + trigger AI screening
      const fd = new FormData();
      fd.append('resume', file);
      const resumeRes = await fetch(`${API_BASE}/candidate/applications/${appId}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const resumeData = await resumeRes.json();

      setResult({ appId, score: resumeData.resume_score, feedback: resumeData.ai_feedback });
      setStep('done');
    } catch {
      setError('Network error. Please try again.');
      setApplying(false);
      setStep('form');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-background dark:bg-dark-background rounded-3xl border border-secondary/20 dark:border-dark-secondary/20 shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary/10 dark:border-dark-secondary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary dark:text-dark-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text dark:text-dark-text">Apply for Position</h2>
              <p className="text-xs text-text/50 dark:text-dark-text/50 truncate max-w-xs">{job.title} · {job.company_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors">
            <X className="w-5 h-5 text-text/50 dark:text-dark-text/50" />
          </button>
        </div>

        <div className="p-6">
          {/* FORM STEP */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>
              )}

              {/* Resume upload */}
              <div>
                <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-2">Resume / CV *</label>
                <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${file ? 'border-primary dark:border-dark-primary bg-primary/5' : 'border-secondary/30 dark:border-dark-secondary/30 hover:border-primary dark:hover:border-dark-primary hover:bg-primary/5'}`}>
                  {file ? (
                    <>
                      <FileText className="w-8 h-8 text-primary dark:text-dark-primary mb-2" />
                      <span className="text-sm font-semibold text-primary dark:text-dark-primary">{file.name}</span>
                      <span className="text-xs text-gray-400 mt-1">Click to change</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-text/30 dark:text-dark-text/30 mb-2" />
                      <span className="text-sm text-text/60 dark:text-dark-text/60 font-medium">Click to upload PDF or DOCX</span>
                      <span className="text-xs text-gray-400 mt-1">AI will screen your resume against the JD</span>
                    </>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {/* Cover letter */}
              <div>
                <label className="block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-2">Cover Letter (optional)</label>
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Tell the company why you're a great fit…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-secondary/30 dark:border-dark-secondary/30 bg-background dark:bg-dark-background text-text dark:text-dark-text placeholder-text/40 dark:placeholder-dark-text/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-secondary/30 dark:border-dark-secondary/30 text-text/70 dark:text-dark-text/70 font-semibold hover:bg-secondary/5 transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={applying} className="flex-1 py-3 rounded-xl bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                  <Send className="w-4 h-4" /> Submit Application
                </button>
              </div>
            </form>
          )}

          {/* UPLOADING STEP */}
          {step === 'uploading' && (
            <div className="text-center py-10">
              <Loader2 className="w-12 h-12 animate-spin text-primary dark:text-dark-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text dark:text-dark-text mb-1">AI Screening in Progress</h3>
              <p className="text-sm text-text/60 dark:text-dark-text/60">Uploading your resume and running AI analysis against the job requirements…</p>
            </div>
          )}

          {/* DONE STEP */}
          {step === 'done' && (
            <div className="text-center py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-text dark:text-dark-text mb-2">Application Submitted! 🎉</h3>
              <p className="text-sm text-text/60 dark:text-dark-text/60 mb-4">Your resume has been screened by AI. Check your applications for the result.</p>
              {result?.score != null && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-dark-primary/10 rounded-xl text-primary dark:text-dark-primary text-sm font-bold">
                  AI Resume Score: {Math.round(result.score)}%
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-secondary/30 dark:border-dark-secondary/30 text-text/70 dark:text-dark-text/70 font-semibold text-sm hover:bg-secondary/5 transition-colors">Close</button>
                <button onClick={() => { onApplied(); onClose(); }} className="flex-1 py-3 rounded-xl bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold text-sm hover:opacity-90 transition-all">View My Applications</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ApplyModal;
