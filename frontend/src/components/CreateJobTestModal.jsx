import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Code2, Calendar, Clock, CheckCircle, Loader2,
    Plus, Trash2, ChevronDown, ChevronUp, BookOpen, Terminal, Eye, EyeOff
} from 'lucide-react';

const API_BASE = 'http://localhost:8006';

const defaultMcq = () => ({
    id: `m${Date.now()}`,
    question: '',
    options: ['', '', '', ''],
    correct_index: 0,
    points: 10,
});

const defaultCoding = () => ({
    id: `c${Date.now()}`,
    title: '',
    description: '',
    language_options: ['python'],
    boilerplate: 'def solution():\n    # Write your code here\n    pass\n',
    testCases: [{ input: '', expected: '', hidden: false }],
    hiddenTestCases: [{ input: '', expected: '' }],
    points: 40,
});

const inputCls = 'w-full px-3 py-2 rounded-lg border border-secondary/30 dark:border-dark-secondary/30 bg-background dark:bg-dark-background text-text dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1';

export default function CreateJobTestModal({ token, jobId, onClose, onCreated }) {
    const [step, setStep] = useState(0); // 0=settings, 1=mcq, 2=coding
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [durationMinutes, setDurationMinutes] = useState(45);
    const [deadlineAt, setDeadlineAt] = useState('');
    const [passThreshold, setPassThreshold] = useState(50);

    const [mcqQuestions, setMcqQuestions] = useState([defaultMcq()]);
    const [codingQuestions, setCodingQuestions] = useState([defaultCoding()]);

    // ── MCQ helpers ────────────────────────────────────────────
    const addMcq = () => setMcqQuestions(q => [...q, defaultMcq()]);
    const removeMcq = (i) => setMcqQuestions(q => q.filter((_, idx) => idx !== i));
    const updateMcq = (i, field, val) => setMcqQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
    const updateMcqOption = (qi, oi, val) => setMcqQuestions(q => q.map((item, idx) => idx === qi ? { ...item, options: item.options.map((o, oidx) => oidx === oi ? val : o) } : item));

    // ── Coding helpers ─────────────────────────────────────────
    const addCoding = () => setCodingQuestions(q => [...q, defaultCoding()]);
    const removeCoding = (i) => setCodingQuestions(q => q.filter((_, idx) => idx !== i));
    const updateCoding = (i, field, val) => setCodingQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
    const addTestCase = (qi, hidden) => setCodingQuestions(q => q.map((item, idx) => {
        if (idx !== qi) return item;
        const key = hidden ? 'hiddenTestCases' : 'testCases';
        return { ...item, [key]: [...item[key], { input: '', expected: '', hidden }] };
    }));
    const removeTestCase = (qi, tci, hidden) => setCodingQuestions(q => q.map((item, idx) => {
        if (idx !== qi) return item;
        const key = hidden ? 'hiddenTestCases' : 'testCases';
        return { ...item, [key]: item[key].filter((_, tidx) => tidx !== tci) };
    }));
    const updateTestCase = (qi, tci, field, val, hidden) => setCodingQuestions(q => q.map((item, idx) => {
        if (idx !== qi) return item;
        const key = hidden ? 'hiddenTestCases' : 'testCases';
        return { ...item, [key]: item[key].map((tc, tidx) => tidx === tci ? { ...tc, [field]: val } : tc) };
    }));

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            const allTestCases = (qi) => {
                const q = codingQuestions[qi];
                const visible = (q.testCases || []).map(tc => ({ ...tc, hidden: false }));
                const hidden = (q.hiddenTestCases || []).map(tc => ({ ...tc, hidden: true }));
                return [...visible, ...hidden];
            };

            const payload = {
                questions: {
                    mcq: {
                        passThreshold,
                        questions: mcqQuestions.map(q => ({
                            id: q.id,
                            question: q.question,
                            options: q.options,
                            correct_index: q.correct_index,
                            points: q.points,
                        })),
                    },
                    coding: {
                        passThreshold,
                        questions: codingQuestions.map((q, qi) => ({
                            id: q.id,
                            title: q.title,
                            description: q.description,
                            language_options: q.language_options,
                            boilerplate: q.boilerplate,
                            testCases: allTestCases(qi),
                            points: q.points,
                        })),
                    },
                },
                duration_minutes: durationMinutes,
                deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
            };

            const res = await fetch(`${API_BASE}/company/jobs/${jobId}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to create test'); return; }
            setSuccess(true);
            if (onCreated) onCreated(data.test);
            setTimeout(onClose, 1200);
        } catch { setError('Network error'); }
        finally { setLoading(false); }
    };

    const steps = ['Settings', 'MCQ Questions', 'Coding Questions'];

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-background dark:bg-dark-background rounded-3xl border border-secondary/20 dark:border-dark-secondary/20 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-secondary/10 dark:border-dark-secondary/10 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/15 dark:bg-dark-primary/15 rounded-xl flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-primary dark:text-dark-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text dark:text-dark-text">Create Assessment</h2>
                            <p className="text-xs text-text/50 dark:text-dark-text/50">MCQ + Coding with test cases</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/10 dark:hover:bg-dark-secondary/10">
                        <X className="w-5 h-5 text-text/50 dark:text-dark-text/50" />
                    </button>
                </div>

                {/* Step Tabs */}
                <div className="flex border-b border-secondary/10 dark:border-dark-secondary/10 flex-shrink-0">
                    {steps.map((s, i) => (
                        <button key={s} onClick={() => setStep(i)}
                            className={`flex-1 py-3 text-sm font-semibold transition-colors ${step === i ? 'text-primary dark:text-dark-primary border-b-2 border-primary dark:border-dark-primary' : 'text-text/50 dark:text-dark-text/50 hover:text-text dark:hover:text-dark-text'}`}>
                            {i + 1}. {s}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>}
                    {success && <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Test created successfully!</div>}

                    {/* Step 0: Settings */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Duration (minutes)</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
                                        <input type="number" min={5} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className={`${inputCls} pl-9`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Pass Threshold (%)</label>
                                    <input type="number" min={0} max={100} value={passThreshold} onChange={e => setPassThreshold(Number(e.target.value))} className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Deadline (optional)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
                                    <input type="datetime-local" value={deadlineAt} onChange={e => setDeadlineAt(e.target.value)} className={`${inputCls} pl-9`} />
                                </div>
                                <p className="text-[11px] text-text/40 mt-1">Candidates cannot start/submit after this time.</p>
                            </div>
                            <div className="bg-primary/5 dark:bg-dark-primary/5 border border-primary/20 dark:border-dark-primary/20 rounded-xl p-4">
                                <p className="text-sm font-semibold text-primary dark:text-dark-primary mb-1">Assessment Structure</p>
                                <p className="text-xs text-text/60 dark:text-dark-text/60">
                                    1. Candidates first complete all MCQ questions.<br />
                                    2. Then move to coding problems (LeetCode-style).<br />
                                    3. Visible test cases are shown; hidden ones are used for final scoring.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 1: MCQ */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {mcqQuestions.map((q, qi) => (
                                <div key={q.id} className="border border-secondary/20 dark:border-dark-secondary/20 rounded-2xl p-4 space-y-3 bg-secondary/3 dark:bg-dark-secondary/3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-primary dark:text-dark-primary">Q{qi + 1}</span>
                                        {mcqQuestions.length > 1 && (
                                            <button onClick={() => removeMcq(qi)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Question</label>
                                        <textarea rows={2} value={q.question} onChange={e => updateMcq(qi, 'question', e.target.value)} className={inputCls} placeholder="Enter your question..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} className="flex items-center gap-2">
                                                <input type="radio" name={`correct_${q.id}`} checked={q.correct_index === oi} onChange={() => updateMcq(qi, 'correct_index', oi)} className="accent-green-500 flex-shrink-0" />
                                                <input value={opt} onChange={e => updateMcqOption(qi, oi, e.target.value)} className={inputCls} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className={labelCls}>Points</label>
                                            <input type="number" min={1} value={q.points} onChange={e => updateMcq(qi, 'points', Number(e.target.value))} className={inputCls} />
                                        </div>
                                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-4">✓ = Option {String.fromCharCode(65 + q.correct_index)}</p>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addMcq} className="w-full py-2.5 border-2 border-dashed border-secondary/30 dark:border-dark-secondary/30 rounded-xl text-sm font-semibold text-text/50 dark:text-dark-text/50 hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Add MCQ Question
                            </button>
                        </div>
                    )}

                    {/* Step 2: Coding */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {codingQuestions.map((q, qi) => (
                                <div key={q.id} className="border border-secondary/20 dark:border-dark-secondary/20 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-primary dark:text-dark-primary flex items-center gap-2"><Terminal className="w-4 h-4" /> Problem {qi + 1}</span>
                                        {codingQuestions.length > 1 && (
                                            <button onClick={() => removeCoding(qi)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelCls}>Title</label>
                                            <input value={q.title} onChange={e => updateCoding(qi, 'title', e.target.value)} className={inputCls} placeholder="e.g. Two Sum" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Points</label>
                                            <input type="number" min={1} value={q.points} onChange={e => updateCoding(qi, 'points', Number(e.target.value))} className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Problem Description</label>
                                        <textarea rows={3} value={q.description} onChange={e => updateCoding(qi, 'description', e.target.value)} className={inputCls} placeholder="Describe the problem clearly with examples..." />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Starter Code (Boilerplate)</label>
                                        <textarea rows={4} value={q.boilerplate} onChange={e => updateCoding(qi, 'boilerplate', e.target.value)} className={`${inputCls} font-mono text-xs`} />
                                    </div>

                                    {/* Visible Test Cases */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye className="w-4 h-4 text-green-500" />
                                            <label className={`${labelCls} mb-0`}>Visible Test Cases (shown to candidate)</label>
                                        </div>
                                        {q.testCases.map((tc, tci) => (
                                            <div key={tci} className="flex gap-2 mb-2 items-center">
                                                <input value={tc.input} onChange={e => updateTestCase(qi, tci, 'input', e.target.value, false)} className={`${inputCls} flex-1 font-mono text-xs`} placeholder="Input (e.g. [2,7,11,15], 9)" />
                                                <input value={tc.expected} onChange={e => updateTestCase(qi, tci, 'expected', e.target.value, false)} className={`${inputCls} flex-1 font-mono text-xs`} placeholder="Expected output (e.g. [0,1])" />
                                                {q.testCases.length > 1 && (
                                                    <button onClick={() => removeTestCase(qi, tci, false)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => addTestCase(qi, false)} className="text-xs text-primary dark:text-dark-primary hover:opacity-70 flex items-center gap-1 mt-1">
                                            <Plus className="w-3 h-3" /> Add visible test case
                                        </button>
                                    </div>

                                    {/* Hidden Test Cases */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <EyeOff className="w-4 h-4 text-orange-500" />
                                            <label className={`${labelCls} mb-0`}>Hidden Test Cases (for final scoring only)</label>
                                        </div>
                                        {q.hiddenTestCases.map((tc, tci) => (
                                            <div key={tci} className="flex gap-2 mb-2 items-center">
                                                <input value={tc.input} onChange={e => updateTestCase(qi, tci, 'input', e.target.value, true)} className={`${inputCls} flex-1 font-mono text-xs border-orange-300/50`} placeholder="Hidden input" />
                                                <input value={tc.expected} onChange={e => updateTestCase(qi, tci, 'expected', e.target.value, true)} className={`${inputCls} flex-1 font-mono text-xs border-orange-300/50`} placeholder="Hidden expected" />
                                                {q.hiddenTestCases.length > 1 && (
                                                    <button onClick={() => removeTestCase(qi, tci, true)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => addTestCase(qi, true)} className="text-xs text-orange-500 hover:opacity-70 flex items-center gap-1 mt-1">
                                            <Plus className="w-3 h-3" /> Add hidden test case
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addCoding} className="w-full py-2.5 border-2 border-dashed border-secondary/30 dark:border-dark-secondary/30 rounded-xl text-sm font-semibold text-text/50 dark:text-dark-text/50 hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Add Coding Problem
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-secondary/10 dark:border-dark-secondary/10 flex gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-secondary/30 dark:border-dark-secondary/30 text-text/70 dark:text-dark-text/70 font-semibold hover:bg-secondary/5 transition-colors text-sm">
                        Cancel
                    </button>
                    <div className="flex-1 flex gap-2">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 rounded-xl border border-secondary/30 dark:border-dark-secondary/30 text-sm font-semibold hover:bg-secondary/5 transition-colors">
                                ← Back
                            </button>
                        )}
                        {step < 2 ? (
                            <button onClick={() => setStep(s => s + 1)} className="flex-1 py-2.5 rounded-xl bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90 transition-all text-sm">
                                Next →
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                {loading ? 'Creating...' : 'Create Test'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
