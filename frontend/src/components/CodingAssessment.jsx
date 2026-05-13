import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Play, Send, Copy, Check, X, CheckCircle,
  Terminal, EyeOff, ChevronDown, ChevronUp, Loader2, Clock, Code2
} from 'lucide-react';
import { useTestSecurity } from './useTestSecurity';

// ── Judge0 CE ─────────────────────────────────────────────────────────────────
// Using the public Judge0 instance. The ?wait=true makes it synchronous.
// If ce.judge0.com is blocked (CORS), swap to your own Judge0 or Piston instance.
// const JUDGE0_API = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';
// Fallback: use the official extra-CE instance which has better CORS headers
const JUDGE0_HOSTS = [
  'https://judge0-ce.p.rapidapi.com',  // RapidAPI (needs key – skipped)
  'https://ce.judge0.com',             // official public
];

const LANG_IDS = {
  python: 71,       // Python 3.8.1
  javascript: 63,   // Node.js 12.14.0
  java: 62,         // Java 13.0.1
  cpp: 54,          // C++ (GCC 9.2.0)
  go: 60,           // Go 1.13.5
};

const LANGUAGES = {
  python:     { label: 'Python 3',   comment: '#'  },
  javascript: { label: 'JavaScript', comment: '//' },
  java:       { label: 'Java',       comment: '//' },
  cpp:        { label: 'C++',        comment: '//' },
  go:         { label: 'Go',         comment: '//' },
};

const BOILERPLATES = {
  python:     (title) => `def solution(n):\n    # Write your ${title || 'solution'} here\n    pass\n`,
  javascript: (title) => `function solution(n) {\n  // Write your ${title || 'solution'} here\n}\n`,
  java:       (title) => `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your ${title || 'solution'} here\n    }\n}\n`,
  cpp:        (title) => `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Write your ${title || 'solution'} here\n    return 0;\n}\n`,
  go:         (title) => `package main\nimport "fmt"\nfunc main() {\n    // Write your ${title || 'solution'} here\n}\n`,
};

async function submitToJudge0(language, code, stdin = '') {
  // Call our local backend proxy to avoid CORS issues with ce.judge0.com
  const res = await fetch('http://localhost:8006/test/run-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, code, stdin }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Server error ${res.status}`);
  }
  const data = await res.json();
  return {
    stdout: data.stdout || '',
    stderr: data.stderr || '',
    statusId: data.statusId ?? 3,
    statusDesc: data.statusDesc || 'Done',
    exitCode: data.exitCode ?? 0,
    time: data.time,
    memory: data.memory,
  };
}

// Build a self-contained runnable file that calls the user's function and prints the result
function buildTestCode(language, userCode, testInput) {
  if (language === 'python') {
    const m = userCode.match(/\bdef\s+([A-Za-z_]\w*)\s*\(/);
    const fn = m ? m[1] : 'solution';
    return `${userCode}

# --- auto test runner ---
try:
    _inp = ${testInput}
    if isinstance(_inp, (list, tuple)):
        _res = ${fn}(*_inp)
    else:
        _res = ${fn}(_inp)
except TypeError:
    _res = ${fn}(${testInput})
print(_res)
`;
  }
  if (language === 'javascript') {
    const m = userCode.match(/(?:function\s+|const\s+|let\s+|var\s+)([A-Za-z_]\w*)/);
    const fn = m ? m[1] : 'solution';
    return `${userCode}

// --- auto test runner ---
const _inp = ${testInput};
const _res = Array.isArray(_inp) ? ${fn}(..._inp) : ${fn}(_inp);
console.log(_res);
`;
  }
  // Java/C++/Go: run as-is (candidate must print output themselves)
  return userCode;
}

const CodingAssessment = ({ test, mcqAnswers, sessionId, application, token, onBack, onSubmitAll }) => {
  const problems = (() => {
    if (!test) return [];
    const q = test.questions;
    if (Array.isArray(q?.coding?.questions)) return q.coding.questions;
    return [];
  })();

  const durationMinutes = test?.duration_minutes ?? 60;

  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const problem = problems[currentProblemIdx] || {};

  const [selectedLang, setSelectedLang] = useState('python');

  // codes[problemIdx][lang] = code string
  const [codes, setCodes] = useState(() => {
    const init = {};
    problems.forEach((p, i) => {
      init[i] = {};
      Object.keys(LANGUAGES).forEach(lang => {
        init[i][lang] = (p.boilerplate && lang === 'python')
          ? p.boilerplate
          : BOILERPLATES[lang](p.title);
      });
    });
    return init;
  });

  const code = codes[currentProblemIdx]?.[selectedLang] || BOILERPLATES[selectedLang](problem.title);
  const setCode = (val) => setCodes(prev => ({
    ...prev,
    [currentProblemIdx]: { ...(prev[currentProblemIdx] || {}), [selectedLang]: val }
  }));

  const [testResultsMap, setTestResultsMap] = useState({});
  const testResults = testResultsMap[currentProblemIdx] || null;
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(null);
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const textareaRef = useRef(null);

  const { violations, videoRef, cameraActive } = useTestSecurity({
    applicationId: application?.id,
    token,
    enabled: !submitted,
    maxViolations: 8,
  });

  // Timer
  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) { handleFinalSubmit(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [submitted, timeLeft]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const visibleTestCases = (problem.testCases || []).filter(tc => !tc.hidden);
  const hiddenCount = (problem.testCases || []).filter(tc => tc.hidden).length;

  const runCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput('⏳ Submitting to Judge0...');
    setOutputExpanded(true);
    setActiveTab('testcases');

    try {
      let lines = [];

      if (visibleTestCases.length === 0) {
        // No test cases – just run the code as-is and show output
        const r = await submitToJudge0(selectedLang, code);
        if (r.stderr) {
          lines.push(`❌ ${r.statusDesc}`);
          lines.push(r.stderr);
        } else {
          lines.push(`✅ ${r.statusDesc} (${r.time}s, ${r.memory}KB)`);
          lines.push(r.stdout || '(no output — add a print statement to see results)');
        }
        setOutput(lines.join('\n'));
        setIsRunning(false);
        return;
      }

      // Run each visible test case sequentially
      const results = [];
      for (let idx = 0; idx < visibleTestCases.length; idx++) {
        const tc = visibleTestCases[idx];
        setOutput(`⏳ Running test case ${idx + 1}/${visibleTestCases.length}...`);
        try {
          const testCode = buildTestCode(selectedLang, code, tc.input);
          const r = await submitToJudge0(selectedLang, testCode);

          let actual = '';
          if (r.statusId === 6) {
            // Compilation error
            actual = `Compile Error: ${r.stderr}`;
          } else if (r.statusId === 11 || r.statusId === 12) {
            // Runtime error / TLE
            actual = `${r.statusDesc}: ${r.stderr || ''}`;
          } else {
            actual = r.stdout || r.stderr || '';
          }

          const expected = String(tc.expected ?? '').trim();
          // Strip surrounding quotes if the expected was saved with them (e.g. '"abc"' → 'abc')
          const expectedClean = expected.replace(/^['"](.+)['"]$/, '$1');
          const passed = actual.trim() === expectedClean && r.statusId === 3;
          results.push({ id: idx + 1, input: tc.input, expected: expectedClean, actual: actual.trim(), passed, time: r.time, memory: r.memory });
        } catch (err) {
          results.push({ id: idx + 1, input: tc.input, expected: tc.expected, actual: `Network Error: ${err.message}`, passed: false });
        }
      }

      setTestResultsMap(prev => ({ ...prev, [currentProblemIdx]: results }));
      const passedCount = results.filter(r => r.passed).length;

      // Build output summary
      lines.push(`Results: ${passedCount}/${results.length} test cases passed`);
      lines.push('');
      results.forEach(r => {
        lines.push(`Case ${r.id}: ${r.passed ? '✅ Passed' : '❌ Failed'}${r.time ? ` (${r.time}s)` : ''}`);
        if (!r.passed) {
          lines.push(`  Input:    ${r.input}`);
          lines.push(`  Expected: ${r.expected}`);
          lines.push(`  Got:      ${r.actual}`);
        }
      });

      setOutput(lines.join('\n'));
    } catch (err) {
      setOutput(`❌ Error: ${err.message}`);
    }
    setIsRunning(false);
  };

  const handleFinalSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    const codingAnswers = {};
    problems.forEach((prob, idx) => {
      let codeStr = codes[idx]?.[selectedLang] || '';
      const results = testResultsMap[idx];
      if (results && results.length > 0) {
        const lastActual = results[results.length - 1]?.actual ?? '';
        codeStr = codeStr.replace(/\s*OUTPUT\s*=\s*[\s\S]*?(?:\n|$)/m, '');
        codeStr += `\nOUTPUT = ${String(lastActual)}`;
      }
      codingAnswers[prob.id] = codeStr;
    });

    const payload = { sessionId, mcqAnswers: mcqAnswers || {}, codingAnswers };
    if (onSubmitAll) {
      const result = await onSubmitAll(payload);
      setShowResult(result || {});
    }
  }, [submitted, sessionId, mcqAnswers, codes, selectedLang, problems, testResultsMap, onSubmitAll]);

  // ── Result Screen ─────────────────────────────────────────────────────────────
  if (showResult) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-secondary/5 dark:bg-dark-secondary/5 rounded-3xl border border-secondary/30 p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Assessment Submitted! 🎉</h2>
          <p className="text-text/60 mb-6">Your responses have been recorded and are being evaluated.</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-background dark:bg-dark-background rounded-xl p-4">
              <p className="text-3xl font-black text-primary dark:text-dark-primary">{showResult.totalScore ?? '—'}</p>
              <p className="text-xs text-text/50 mt-1">Test Score</p>
            </div>
            <div className="bg-background dark:bg-dark-background rounded-xl p-4">
              <p className="text-3xl font-black text-green-500">{showResult.finalScore ?? '—'}</p>
              <p className="text-xs text-text/50 mt-1">Final Score</p>
            </div>
          </div>
          <button onClick={onBack} className="w-full px-6 py-3 rounded-xl bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90">
            Back to Applications
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col" style={{ fontFamily: 'monospace' }}>

      {/* Top Bar */}
      <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0" style={{ fontFamily: 'inherit' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm font-medium transition-colors" style={{ fontFamily: 'sans-serif' }}>
            <ChevronLeft className="w-4 h-4" /> Exit
          </button>
          <div className="w-px h-5 bg-gray-700" />
          {problems.map((p, i) => (
            <button key={i} onClick={() => setCurrentProblemIdx(i)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${currentProblemIdx === i ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              P{i + 1}{testResultsMap[i] ? ` · ${testResultsMap[i].filter(r => r.passed).length}/${testResultsMap[i].length}` : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-mono text-sm font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
            <Clock className="inline w-3.5 h-3.5 mr-1" />{formatTime(timeLeft)}
          </span>
          <div className="w-20 h-12 bg-black rounded-lg overflow-hidden border border-gray-700 relative">
            {!cameraActive && <div className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-500 text-center p-1">No cam</div>}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <span className="text-xs text-gray-500">
            Violations: <span className="text-red-400 font-bold">{Object.values(violations).reduce((a, b) => a + b, 0)}</span>
          </span>
        </div>
      </div>

      {/* Main Split */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Problem Panel */}
        <div className="w-[38%] min-w-[280px] bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-800">
            {['description', 'testcases'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                style={{ fontFamily: 'sans-serif' }}>
                {tab === 'testcases' ? 'Test Cases' : 'Description'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ fontFamily: 'sans-serif' }}>
            {activeTab === 'description' && (
              <>
                <div>
                  <h1 className="text-xl font-bold text-white">{problem.title || 'Problem'}</h1>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full font-semibold">{problem.points ?? 40} pts</span>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{problem.description || 'No description.'}</p>
                {visibleTestCases.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Examples</p>
                    {visibleTestCases.map((tc, i) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-3 mb-2 text-xs font-mono">
                        <p className="text-gray-500 mb-1">Example {i + 1}</p>
                        <p><span className="text-gray-500">Input: </span><span className="text-green-400">{tc.input}</span></p>
                        <p><span className="text-gray-500">Output: </span><span className="text-blue-400">{tc.expected}</span></p>
                      </div>
                    ))}
                  </div>
                )}
                {hiddenCount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-gray-500">
                    <EyeOff className="w-3 h-3 flex-shrink-0" />
                    {hiddenCount} hidden test case{hiddenCount !== 1 ? 's' : ''} used for final scoring
                  </div>
                )}
              </>
            )}
            {activeTab === 'testcases' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Click "Run Code" to see results.</p>
                {visibleTestCases.map((tc, i) => {
                  const r = testResults?.[i];
                  return (
                    <div key={i} className={`rounded-lg border p-3 text-xs font-mono ${r ? (r.passed ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20') : 'border-gray-700 bg-gray-800'}`}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 font-sans font-bold">Case {i + 1}</span>
                        {r && <span className={r.passed ? 'text-green-400' : 'text-red-400'}>{r.passed ? '✓ Passed' : '✗ Failed'}</span>}
                      </div>
                      <p><span className="text-gray-500">Input: </span><span className="text-white">{tc.input}</span></p>
                      <p><span className="text-gray-500">Expected: </span><span className="text-blue-300">{tc.expected}</span></p>
                      {r && !r.passed && <p><span className="text-gray-500">Got: </span><span className="text-red-300">{r.actual}</span></p>}
                    </div>
                  );
                })}
                {visibleTestCases.length === 0 && <p className="text-gray-500 text-sm">No visible test cases.</p>}
                {hiddenCount > 0 && (
                  <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-xs text-gray-500 flex items-center gap-2 font-sans">
                    <EyeOff className="w-3 h-3" /> {hiddenCount} hidden case{hiddenCount !== 1 ? 's' : ''} evaluated on submit
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor + Output */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor toolbar */}
          <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-gray-500" />
              {/* Language selector */}
              <select
                value={selectedLang}
                onChange={e => setSelectedLang(e.target.value)}
                className="bg-gray-800 text-gray-200 text-xs rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                style={{ fontFamily: 'sans-serif' }}>
                {Object.entries(LANGUAGES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCode(BOILERPLATES[selectedLang](problem.title))}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                style={{ fontFamily: 'sans-serif' }}>
                Reset
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                style={{ fontFamily: 'sans-serif' }}>
                {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
          </div>

          {/* Code textarea */}
          <div className="flex-1 overflow-hidden relative bg-gray-950">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full bg-transparent text-gray-100 text-sm leading-6 p-4 resize-none outline-none border-none caret-blue-400"
              style={{ tabSize: 4, fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace" }}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const s = e.target.selectionStart, end = e.target.selectionEnd;
                  const next = code.substring(0, s) + '    ' + code.substring(end);
                  setCode(next);
                  setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
                }
              }}
            />
          </div>

          {/* Action bar */}
          <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-3 flex items-center gap-3">
            <button onClick={runCode} disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              style={{ fontFamily: 'sans-serif' }}>
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
            {problems.length > 1 && currentProblemIdx < problems.length - 1 && (
              <button onClick={() => setCurrentProblemIdx(i => i + 1)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
                style={{ fontFamily: 'sans-serif' }}>
                Next →
              </button>
            )}
            <div className="flex-1" />
            <span className="text-xs text-gray-500" style={{ fontFamily: 'sans-serif' }}>
              {testResults ? `${testResults.filter(r => r.passed).length}/${testResults.length} passing` : 'Run to test'}
            </span>
            <button onClick={handleFinalSubmit} disabled={submitted}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              style={{ fontFamily: 'sans-serif' }}>
              <Send className="w-4 h-4" /> Submit All
            </button>
          </div>

          {/* Output panel */}
          <AnimatePresence>
            {output && (
              <motion.div initial={{ height: 0 }} animate={{ height: outputExpanded ? 'auto' : 36 }}
                className="border-t border-gray-800 bg-gray-900 overflow-hidden flex-shrink-0">
                <div className="flex items-center justify-between px-4 py-2 cursor-pointer" onClick={() => setOutputExpanded(p => !p)}>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400" style={{ fontFamily: 'sans-serif' }}>Output</span>
                    {testResults && (
                      <span className={`text-xs font-bold ${testResults.every(r => r.passed) ? 'text-green-400' : 'text-yellow-400'}`}>
                        · {testResults.filter(r => r.passed).length}/{testResults.length} passed
                      </span>
                    )}
                  </div>
                  {outputExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
                </div>
                {outputExpanded && (
                  <div className="px-4 pb-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-green-300 whitespace-pre-wrap">{output}</pre>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CodingAssessment;
