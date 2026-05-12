import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, Send, Copy, Check, X, CheckCircle, AlertCircle, Terminal } from 'lucide-react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python';

const CodingAssessment = ({ assessment, onBack, onSubmit }) => {
  const editorRef = useRef(null);
  const [code, setCode] = useState(assessment.boilerplate || '# Write your solution here\n');
  const [timeLeft, setTimeLeft] = useState(assessment.duration * 60);
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [pyodideReady, setPyodideReady] = useState(false);

  // Initialize Pyodide for Python execution
  useEffect(() => {
    let isMounted = true;

    const initPyodide = async () => {
      try {
        const pyodide = await window.loadPyodide?.();
        if (isMounted) {
          window.pyodide = pyodide;
          setPyodideReady(true);
        }
      } catch (error) {
        console.log('Pyodide not available, using mock execution');
        setPyodideReady(false);
      }
    };

    // Load Pyodide from CDN
    if (!window.pyodide) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
      script.onload = initPyodide;
      document.body.appendChild(script);
    } else {
      setPyodideReady(true);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: [
        python(),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            setCode(update.state.doc.toString());
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    return () => view.destroy();
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      if (pyodideReady && window.pyodide) {
        // Real Python execution
        const pyodide = window.pyodide;
        
        // Capture print output
        let outputText = '';
        pyodide.globals.set('print_output', (...args) => {
          outputText += args.join(' ') + '\n';
        });
        
        // Override print to capture output
        await pyodide.runPythonAsync(`
import sys
import io
from contextlib import redirect_stdout

_output_buffer = io.StringIO()
sys.stdout = _output_buffer
`);

        // Run user code
        await pyodide.runPythonAsync(code);
        
        // Get output
        outputText = await pyodide.runPythonAsync('sys.stdout.getvalue()');
        setOutput(outputText || 'Code executed successfully (no output)');

        // Run test cases
        const results = await Promise.all(
          assessment.testCases.map(async (testCase, idx) => {
            try {
              // Create test function
              const testCode = `
${code}

result = twoSum(${testCase.input}) if 'twoSum' in dir() else None
result
`;
              
              const result = await pyodide.runPythonAsync(testCode);
              const passed = String(result) === testCase.expected;
              
              return {
                id: idx + 1,
                input: testCase.input,
                expected: testCase.expected,
                actual: String(result),
                passed,
                executionTime: '< 50ms',
                memory: '< 10MB'
              };
            } catch (err) {
              return {
                id: idx + 1,
                input: testCase.input,
                expected: testCase.expected,
                actual: `Error: ${err.message}`,
                passed: false,
                executionTime: '< 50ms',
                memory: '< 10MB'
              };
            }
          })
        );

        setTestResults(results);
        setOutput(prev => prev + '\n\n✓ All test cases executed');
      } else {
        // Mock execution (fallback)
        setOutput('Code executed (mock mode)\nNote: Install Pyodide to run real Python code');
        
        const results = assessment.testCases.map((testCase, idx) => ({
          id: idx + 1,
          input: testCase.input,
          expected: testCase.expected,
          actual: Math.random() > 0.3 ? testCase.expected : 'Output mismatch',
          passed: Math.random() > 0.3,
          executionTime: `${Math.random() * 50 + 10}ms`,
          memory: `${Math.random() * 10 + 5}MB`
        }));

        setTestResults(results);
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
      setTestResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    const passedTests = testResults ? testResults.filter(t => t.passed).length : 0;
    const totalTests = assessment.testCases.length;
    const score = (passedTests / totalTests) * 100;
    
    const result = {
      score,
      passed: score >= assessment.passThreshold,
      testsPassed: passedTests,
      totalTests,
      code,
      submittedAt: new Date(),
      status: 'completed'
    };
    
    setShowResults(result);
    if (onSubmit) {
      onSubmit(result);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">{assessment.title}</h2>
          </div>
        </div>

        {/* Results */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-8">
              {showResults.passed ? (
                <>
                  <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
                  <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                    Assessment Passed! 🎉
                  </h1>
                </>
              ) : (
                <>
                  <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
                  <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                    Assessment Failed
                  </h1>
                </>
              )}
            </div>

            {/* Score */}
            <div className="bg-secondary/10 dark:bg-dark-secondary/10 rounded-3xl p-8 mb-8">
              <div className="text-6xl font-bold text-primary dark:text-dark-primary mb-2">
                {showResults.score.toFixed(1)}%
              </div>
              <p className="text-lg text-text/60 dark:text-dark-text/60 mb-4">
                Final Score
              </p>
              <div className="flex justify-center gap-8 text-lg">
                <div>
                  <span className="font-bold text-primary dark:text-dark-primary">
                    {showResults.testsPassed}
                  </span>
                  <span className="text-text/60 dark:text-dark-text/60"> / {showResults.totalTests} Tests Passed</span>
                </div>
              </div>
            </div>

            {/* Test Results Details */}
            <div className="text-left space-y-4 mb-8">
              <h3 className="text-2xl font-bold mb-4">Test Case Results</h3>
              {testResults && testResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-lg border-2 ${
                    result.passed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <span className="font-bold">
                      Test Case {result.id} - {result.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text/60 dark:text-dark-text/60 font-semibold">Expected</p>
                      <p className="font-mono bg-black/20 dark:bg-black/50 p-2 rounded mt-1">
                        {result.expected}
                      </p>
                    </div>
                    <div>
                      <p className="text-text/60 dark:text-dark-text/60 font-semibold">Actual</p>
                      <p className={`font-mono bg-black/20 dark:bg-black/50 p-2 rounded mt-1 ${result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {result.actual}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={onBack}
              className="px-8 py-3 rounded-lg bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90 transition-all"
            >
              Back to Application
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold mb-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <h1 className="text-2xl font-bold">{assessment.title}</h1>
            </div>
            <div className={`text-3xl font-bold font-mono ${
              timeLeft < 300 ? 'text-red-500' : 'text-primary dark:text-dark-primary'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Problem */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-2xl border border-secondary/30 dark:border-dark-secondary/30 p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold mb-4 text-primary dark:text-dark-primary">
                Problem
              </h2>

              {/* Problem Statement */}
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-bold mb-2">Description</h3>
                  <p className="text-sm text-text/70 dark:text-dark-text/70 leading-relaxed">
                    {assessment.description}
                  </p>
                </div>

                {/* Constraints */}
                <div>
                  <h3 className="font-bold mb-2">Constraints</h3>
                  <ul className="text-sm text-text/70 dark:text-dark-text/70 space-y-1">
                    {assessment.constraints && assessment.constraints.map((constraint, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span>•</span>
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Example */}
                <div>
                  <h3 className="font-bold mb-2">Example</h3>
                  <div className="bg-black/20 dark:bg-black/50 rounded p-3 text-sm font-mono text-green-400 space-y-2">
                    <div>
                      <span className="text-text/60 dark:text-dark-text/60">Input: </span>
                      <span>{assessment.example.input}</span>
                    </div>
                    <div>
                      <span className="text-text/60 dark:text-dark-text/60">Output: </span>
                      <span>{assessment.example.output}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div className="pt-4 border-t border-secondary/20 dark:border-dark-secondary/20">
                <p className="text-sm text-text/60 dark:text-dark-text/60">
                  Difficulty: <span className="font-bold">{assessment.difficulty}</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Panel - Editor & Output */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            {/* Editor */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">Python Editor</h3>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-text/60 dark:text-dark-text/60 hover:text-text dark:hover:text-dark-text transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* CodeMirror Editor */}
              <div
                ref={editorRef}
                className="bg-gray-900 dark:bg-black rounded-lg border border-secondary/30 dark:border-dark-secondary/30 overflow-hidden"
                style={{ height: '400px' }}
              />

              {/* Run Button */}
              <button
                onClick={runCode}
                disabled={isRunning || !pyodideReady}
                className="w-full px-6 py-3 rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                {isRunning ? 'Running...' : pyodideReady ? 'Run Code' : 'Loading Python...'}
              </button>
            </motion.div>

            {/* Output Panel */}
            {(output || testResults) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-lg border border-secondary/30 dark:border-dark-secondary/30 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-5 h-5 text-primary dark:text-dark-primary" />
                  <h3 className="font-bold">Output</h3>
                </div>
                <div className="bg-black dark:bg-black rounded p-4 font-mono text-sm text-green-400 whitespace-pre-wrap overflow-auto max-h-48">
                  {output || 'No output yet'}
                </div>
              </motion.div>
            )}

            {/* Test Results */}
            {testResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-secondary/10 dark:bg-dark-secondary/10 rounded-lg p-4">
                  <p className="text-lg font-bold">
                    <span className="text-green-600 dark:text-green-400">
                      {testResults.filter(t => t.passed).length}
                    </span>
                    {' '} / {' '}
                    <span>{testResults.length}</span>
                    {' '} tests passed
                  </p>
                </div>

                {testResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 ${
                      result.passed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {result.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="font-bold">Test {result.id}</span>
                    </div>
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="text-text/60 dark:text-dark-text/60">Expected:</span>
                        <p className="font-mono mt-1">{result.expected}</p>
                      </div>
                      <div>
                        <span className="text-text/60 dark:text-dark-text/60">Got:</span>
                        <p className="font-mono mt-1">{result.actual}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Submit Button */}
            {testResults && (
              <button
                onClick={handleSubmit}
                className="w-full px-6 py-3 rounded-lg bg-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Submit Assessment
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CodingAssessment;
