import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Code2, Calendar, Clock, CheckCircle, Loader2,
    Plus, Trash2, BookOpen, Terminal, Eye, EyeOff, Edit3
} from 'lucide-react';

const API_BASE = 'http://localhost:8006';

const defaultMcq = () => ({
    id: `m${Date.now()}${Math.random()}`,
    question: '',
    options: ['', '', '', ''],
    correct_index: 0,
    points: 10,
});

const defaultCoding = () => ({
    id: `c${Date.now()}`,
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample:\nInput: [2,7,11,15], 9\nOutput: [0, 1]',
    language_options: ['python'],
    boilerplate: 'def solution(nums, target):\n    # Write your code here\n    pass\n',
    testCases: [{ input: '[2,7,11,15], 9', expected: '[0, 1]', hidden: false }],
    hiddenTestCases: [{ input: '[3,2,4], 6', expected: '[1, 2]', hidden: true }],
    points: 40,
});

const inputCls = 'w-full px-3 py-2 rounded-lg border border-secondary/30 dark:border-dark-secondary/30 bg-background dark:bg-dark-background text-text dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'block text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-1';

export default function CreateJobTestModal({ token, jobId, onClose, onCreated }) {
    const [step, setStep] = useState(0); // 0=settings, 1=mcq, 2=coding
    const [loading, setLoading] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [durationMinutes, setDurationMinutes] = useState(45);
    const [deadlineAt, setDeadlineAt] = useState('');
    const [passThreshold, setPassThreshold] = useState(50);
    const [mcqQuestions, setMcqQuestions] = useState([]);
    const [codingQuestions, setCodingQuestions] = useState([defaultCoding()]);

    // Load existing test on open
    useEffect(() => {
        const load = async () => {
            setLoadingExisting(true);
            try {
                const res = await fetch(`${API_BASE}/company/jobs/${jobId}/test`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const q = data.questions;
                    setIsEditing(true);
                    setDurationMinutes(data.duration_minutes || 45);
                    if (data.deadline_at) {
                        setDeadlineAt(new Date(data.deadline_at).toISOString().slice(0, 16));
                    }
                    if (q?.mcq?.passThreshold) setPassThreshold(q.mcq.passThreshold);
                    // Load MCQ questions
                    if (Array.isArray(q?.mcq?.questions) && q.mcq.questions.length > 0) {
                        setMcqQuestions(q.mcq.questions.map(mq => ({
                            id: mq.id || `m${Date.now()}${Math.random()}`,
                            question: mq.question || '',
                            options: mq.options || ['', '', '', ''],
                            correct_index: mq.correct_index ?? 0,
                            points: mq.points ?? 10,
                        })));
                    }
                    // Load coding questions
                    if (Array.isArray(q?.coding?.questions) && q.coding.questions.length > 0) {
                        setCodingQuestions(q.coding.questions.map(cq => ({
                            id: cq.id || `c${Date.now()}`,
                            title: cq.title || '',
                            description: cq.description || '',
                            language_options: cq.language_options || ['python'],
                            boilerplate: cq.boilerplate || '',
                            testCases: (cq.testCases || []).filter(tc => !tc.hidden),
                            hiddenTestCases: (cq.testCases || []).filter(tc => tc.hidden),
                            points: cq.points || 40,
                        })));
                    }
                }
            } catch {}
            setLoadingExisting(false);
        };
        load();
    }, [jobId, token]);

    const [generatingAI, setGeneratingAI] = useState(false);

    const generateAITest = async () => {
        setGeneratingAI(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/company/jobs/${jobId}/generate-test-ai`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to generate AI test');
            
            if (data.suggested_test?.mcqs) {
                setMcqQuestions(data.suggested_test.mcqs.map((mq, idx) => ({
                    id: `m${Date.now()}${idx}`,
                    question: mq.question || '',
                    options: mq.options || ['', '', '', ''],
                    correct_index: mq.correct_option ?? 0,
                    points: mq.points ?? 10,
                })));
            }
        } catch (err) {
            setError('AI Generation Failed: ' + err.message);
        } finally {
            setGeneratingAI(false);
        }
    };

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
        return { ...item, [key]: [...(item[key] || []), { input: '', expected: '', hidden }] };
    }));
    const updateTestCase = (qi, tci, field, val, hidden) => setCodingQuestions(q => q.map((item, idx) => {
        if (idx !== qi) return item;
        const key = hidden ? 'hiddenTestCases' : 'testCases';
        return { ...item, [key]: item[key].map((tc, tidx) => tidx === tci ? { ...tc, [field]: val } : tc) };
    }));
    const removeTestCase = (qi, tci, hidden) => setCodingQuestions(q => q.map((item, idx) => {
        if (idx !== qi) return item;
        const key = hidden ? 'hiddenTestCases' : 'testCases';
        return { ...item, [key]: item[key].filter((_, tidx) => tidx !== tci) };
    }));

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            const allTestCases = (qi) => {
                const q = codingQuestions[qi];
                const visible = (q.testCases || []).filter(tc => tc.input.trim()).map(tc => ({ ...tc, hidden: false }));
                const hidden = (q.hiddenTestCases || []).filter(tc => tc.input.trim()).map(tc => ({ ...tc, hidden: true }));
                return [...visible, ...hidden];
            };

            const validMcqs = mcqQuestions.filter(q => q.question.trim() && q.options.some(o => o.trim()));
            const validCoding = codingQuestions.filter(q => q.title.trim());

            const questionsPayload = {
                mcq: {
                    passThreshold,
                    questions: validMcqs.map(q => ({
                        id: q.id,
                        question: q.question,
                        options: q.options,
                        correct_index: q.correct_index,
                        points: q.points,
                    })),
                },
                coding: {
                    passThreshold,
                    questions: validCoding.map((q, qi) => ({
                        id: q.id,
                        title: q.title,
                        description: q.description,
                        language_options: q.language_options,
                        boilerplate: q.boilerplate,
                        testCases: allTestCases(codingQuestions.indexOf(q)),
                        points: q.points,
                    })),
                },
            };

            console.log('[SUBMIT] MCQ count:', validMcqs.length, 'Coding count:', validCoding.length);

            const payload = {
                questions: questionsPayload,
                duration_minutes: durationMinutes,
                deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
            };

            const res = await fetch(`${API_BASE}/company/jobs/${jobId}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to save test'); return; }
            setSuccess(true);
            if (onCreated) onCreated(data.test);
            setTimeout(onClose, 1200);
        } catch (e) { setError('Network error: ' + e.message); }
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
                    <div>
                        <h2 className="text-xl font-bold text-text dark:text-dark-text flex items-center gap-2">
                            {isEditing ? <Edit3 className="w-5 h-5 text-blue-500" /> : <Code2 className="w-5 h-5 text-primary dark:text-dark-primary" />}
                            {isEditing ? 'Edit Assessment' : 'Create Assessment'}
                        </h2>
                        {isEditing && <p className="text-xs text-blue-500 mt-0.5 font-semibold">✓ Existing test loaded — editing mode</p>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors text-text/50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loadingExisting ? (
                    <div className="flex-1 flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-dark-primary" />
                        <p className="ml-3 text-text/60">Loading existing test…</p>
                    </div>
                ) : (
                    <>
                        {/* Step tabs */}
                        <div className="flex border-b border-secondary/10 dark:border-dark-secondary/10 flex-shrink-0">
                            {steps.map((s, i) => (
                                <button key={s} onClick={() => setStep(i)}
                                    className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${step === i ? 'border-primary dark:border-dark-primary text-primary dark:text-dark-primary bg-primary/5 dark:bg-dark-primary/5' : 'border-transparent text-text/50 dark:text-dark-text/50 hover:text-text dark:hover:text-dark-text'}`}>
                                    {i === 1 && mcqQuestions.length > 0 ? `MCQ (${mcqQuestions.length})` : i === 2 ? `Coding (${codingQuestions.filter(q => q.title).length})` : s}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {success && (
                                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                    <p className="font-bold text-green-700 dark:text-green-300">Test {isEditing ? 'updated' : 'created'} successfully!</p>
                                </div>
                            )}
                            {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">{error}</p>}

                            {/* Step 0: Settings */}
                            {step === 0 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Duration (minutes)</label>
                                            <input type="number" min={5} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Pass Threshold (%)</label>
                                            <input type="number" min={0} max={100} value={passThreshold} onChange={e => setPassThreshold(Number(e.target.value))} className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Deadline (optional)</label>
                                        <input type="datetime-local" value={deadlineAt} onChange={e => setDeadlineAt(e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl text-sm text-blue-800 dark:text-blue-300 space-y-1">
                                        <p className="font-bold">📝 How to create a good test</p>
                                        <p>• MCQ: each question needs a question text + at least 1 option filled</p>
                                        <p>• Coding: use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">def solution(nums, target):</code> format</p>
                                        <p>• Test case input: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">[2,7,11,15], 9</code> → expected: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">[0, 1]</code></p>
                                        <p>• Hidden test cases are not shown to candidates but used for scoring</p>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: MCQ */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="flex justify-end">
                                        <button onClick={generateAITest} disabled={generatingAI}
                                            className="px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-sm font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-2">
                                            {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : '🤖'} 
                                            {generatingAI ? 'Generating MCQs...' : 'Generate 10 MCQs with AI'}
                                        </button>
                                    </div>
                                    {mcqQuestions.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-secondary/20 dark:border-dark-secondary/20 rounded-2xl">
                                            <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                            <p className="text-text/50 dark:text-dark-text/50 font-semibold mb-1">No MCQ questions yet</p>
                                            <p className="text-xs text-text/30 dark:text-dark-text/30 mb-4">Leave empty for a coding-only test</p>
                                            <button onClick={addMcq}
                                                className="px-5 py-2.5 bg-primary dark:bg-dark-primary text-background dark:text-dark-background rounded-xl text-sm font-bold hover:opacity-90 transition-all inline-flex items-center gap-2 mx-auto">
                                                <Plus className="w-4 h-4" /> Add First MCQ Question
                                            </button>
                                        </div>
                                    ) : (
                                        mcqQuestions.map((q, qi) => (
                                            <div key={q.id} className="border border-secondary/20 dark:border-dark-secondary/20 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-primary dark:text-dark-primary">Q{qi + 1}</span>
                                                    <button onClick={() => removeMcq(qi)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Question *</label>
                                                    <textarea rows={2} value={q.question} onChange={e => updateMcq(qi, 'question', e.target.value)}
                                                        className={inputCls} placeholder="e.g. What does HTTP stand for?" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {q.options.map((opt, oi) => (
                                                        <div key={oi} className="flex items-center gap-2">
                                                            <input type="radio" name={`correct_${q.id}`} checked={q.correct_index === oi}
                                                                onChange={() => updateMcq(qi, 'correct_index', oi)} className="accent-green-500 flex-shrink-0" />
                                                            <input value={opt} onChange={e => updateMcqOption(qi, oi, e.target.value)}
                                                                className={inputCls} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <label className={labelCls}>Points</label>
                                                        <input type="number" min={1} value={q.points} onChange={e => updateMcq(qi, 'points', Number(e.target.value))} className={inputCls} style={{ width: 80 }} />
                                                    </div>
                                                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-4">
                                                        ✓ Correct = Option {String.fromCharCode(65 + q.correct_index)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {mcqQuestions.length > 0 && (
                                        <button onClick={addMcq} className="w-full py-2.5 border-2 border-dashed border-secondary/30 dark:border-dark-secondary/30 rounded-xl text-sm font-semibold text-text/50 hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> Add MCQ Question
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Coding */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    {codingQuestions.map((q, qi) => (
                                        <div key={q.id} className="border border-secondary/20 dark:border-dark-secondary/20 rounded-2xl p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-primary dark:text-dark-primary flex items-center gap-2"><Code2 className="w-4 h-4" />Problem {qi + 1}</span>
                                                {codingQuestions.length > 1 && (
                                                    <button onClick={() => removeCoding(qi)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelCls}>Problem Title *</label>
                                                <input value={q.title} onChange={e => updateCoding(qi, 'title', e.target.value)} className={inputCls} placeholder="e.g. Two Sum" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Description</label>
                                                <textarea rows={4} value={q.description} onChange={e => updateCoding(qi, 'description', e.target.value)} className={inputCls} placeholder="Describe the problem..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className={labelCls}>Language</label>
                                                    <select value={q.language_options[0]} onChange={e => updateCoding(qi, 'language_options', [e.target.value])} className={inputCls}>
                                                        <option value="python">Python</option>
                                                        <option value="javascript">JavaScript</option>
                                                        <option value="java">Java</option>
                                                        <option value="cpp">C++</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Points</label>
                                                    <input type="number" min={1} value={q.points} onChange={e => updateCoding(qi, 'points', Number(e.target.value))} className={inputCls} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Boilerplate Code</label>
                                                <textarea rows={4} value={q.boilerplate} onChange={e => updateCoding(qi, 'boilerplate', e.target.value)} className={`${inputCls} font-mono text-xs`} placeholder="def solution(...):\n    pass" />
                                            </div>

                                            {/* Visible Test Cases */}
                                            <div>
                                                <p className="text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <Eye className="w-3.5 h-3.5" /> Visible Test Cases
                                                </p>
                                                {(q.testCases || []).map((tc, tci) => (
                                                    <div key={tci} className="flex gap-2 mb-2 items-center">
                                                        <input value={tc.input} onChange={e => updateTestCase(qi, tci, 'input', e.target.value, false)} className={`${inputCls} font-mono text-xs`} placeholder="Input e.g. [2,7], 9" />
                                                        <input value={tc.expected} onChange={e => updateTestCase(qi, tci, 'expected', e.target.value, false)} className={`${inputCls} font-mono text-xs`} placeholder="Expected e.g. [0, 1]" />
                                                        <button onClick={() => removeTestCase(qi, tci, false)} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addTestCase(qi, false)} className="text-xs text-primary dark:text-dark-primary font-semibold flex items-center gap-1 hover:opacity-70">
                                                    <Plus className="w-3 h-3" /> Add visible test case
                                                </button>
                                            </div>

                                            {/* Hidden Test Cases */}
                                            <div>
                                                <p className="text-xs font-bold text-text/60 dark:text-dark-text/60 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <EyeOff className="w-3.5 h-3.5" /> Hidden Test Cases (for scoring)
                                                </p>
                                                {(q.hiddenTestCases || []).map((tc, tci) => (
                                                    <div key={tci} className="flex gap-2 mb-2 items-center">
                                                        <input value={tc.input} onChange={e => updateTestCase(qi, tci, 'input', e.target.value, true)} className={`${inputCls} font-mono text-xs`} placeholder="Input" />
                                                        <input value={tc.expected} onChange={e => updateTestCase(qi, tci, 'expected', e.target.value, true)} className={`${inputCls} font-mono text-xs`} placeholder="Expected" />
                                                        <button onClick={() => removeTestCase(qi, tci, true)} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addTestCase(qi, true)} className="text-xs text-orange-500 font-semibold flex items-center gap-1 hover:opacity-70">
                                                    <Plus className="w-3 h-3" /> Add hidden test case
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addCoding} className="w-full py-2.5 border-2 border-dashed border-secondary/30 dark:border-dark-secondary/30 rounded-xl text-sm font-semibold text-text/50 hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Add Coding Problem
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-secondary/10 dark:border-dark-secondary/10 flex items-center justify-between flex-shrink-0">
                            <div className="flex gap-2">
                                {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 border border-secondary/30 dark:border-dark-secondary/30 rounded-xl text-sm font-semibold hover:bg-secondary/10 transition-colors">← Back</button>}
                            </div>
                            <div className="flex gap-3 items-center">
                                {error && <p className="text-xs text-red-500">{error}</p>}
                                {step < 2 ? (
                                    <button onClick={() => setStep(s => s + 1)}
                                        className="px-6 py-2.5 bg-primary dark:bg-dark-primary text-background dark:text-dark-background rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                                        Next →
                                    </button>
                                ) : (
                                    <button onClick={handleSubmit} disabled={loading}
                                        className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Test'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}
