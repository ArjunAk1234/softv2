import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, CheckCircle, AlertCircle, Shield, AlertTriangle } from 'lucide-react';
import { useTestSecurity } from './useTestSecurity';

const MCQAssessment = ({ assessment, application, token, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(assessment.duration * 60);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const { violations, warnings, clearWarning, requestFullscreen, videoRef, cameraActive } = useTestSecurity({
    applicationId: application?.id,
    token,
    enabled: !submitted,
    maxViolations: 8,
  });

  // Use questions from assessment or fallback to mock questions
  const questions = assessment.questions || [
    {
      id: 1,
      question: 'What is the output of console.log(typeof [])?',
      options: ['array', 'object', 'list', 'undefined'],
      correct: 1
    },
    {
      id: 2,
      question: 'Which of the following is NOT a valid JavaScript data type?',
      options: ['String', 'Boolean', 'Symbol', 'Reference'],
      correct: 3
    },
    {
      id: 3,
      question: 'What does the "async" keyword do in JavaScript?',
      options: ['Makes code faster', 'Returns a Promise', 'Allows error handling', 'Declares variables'],
      correct: 1
    },
    {
      id: 4,
      question: 'What is the purpose of .map() in JavaScript arrays?',
      options: ['Create a new map object', 'Transform each element', 'Filter elements', 'Sort elements'],
      correct: 1
    },
    {
      id: 5,
      question: 'In React, what does the "key" prop do?',
      options: ['Encrypt data', 'Identify elements in lists', 'Store data', 'Control styling'],
      correct: 1
    }
  ];

  // Timer
  useEffect(() => {
    if (submitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleSubmit = () => {
    const correctCount = questions.reduce((count, q, idx) => {
      return count + (answers[idx] === q.correct ? 1 : 0);
    }, 0);

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (submitted) {
    const passed = score >= assessment.passThreshold;

    return (
      <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-secondary/5 dark:bg-dark-secondary/5 rounded-3xl border border-secondary/30 dark:border-dark-secondary/30 p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            {passed ? (
              <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-400 mx-auto" />
            ) : (
              <AlertCircle className="w-20 h-20 text-red-600 dark:text-red-400 mx-auto" />
            )}
          </motion.div>

          <h2 className="text-3xl font-bold mb-4">
            {passed ? 'Assessment Passed!' : 'Assessment Failed'}
          </h2>

          <div className="bg-background dark:bg-dark-background rounded-2xl p-8 mb-6">
            <p className="text-6xl font-bold text-primary dark:text-dark-primary mb-2">
              {score}%
            </p>
            <p className="text-text/70 dark:text-dark-text/70 mb-4">
              You scored {score}% out of 100%
            </p>
            <p className="text-sm text-text/60 dark:text-dark-text/60">
              Pass threshold: {assessment.passThreshold}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-background dark:bg-dark-background rounded-xl p-4 border border-secondary/20 dark:border-dark-secondary/20">
              <p className="text-sm text-text/60 dark:text-dark-text/60 mb-1">Correct Answers</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round((score / 100) * questions.length)}/{questions.length}
              </p>
            </div>
            <div className="bg-background dark:bg-dark-background rounded-xl p-4 border border-secondary/20 dark:border-dark-secondary/20">
              <p className="text-sm text-text/60 dark:text-dark-text/60 mb-1">Time Taken</p>
              <p className="text-2xl font-bold text-primary dark:text-dark-primary">
                {Math.floor((assessment.duration * 60 - timeLeft) / 60)}m
              </p>
            </div>
          </div>

          <p className="text-text/70 dark:text-dark-text/70 mb-6">
            {passed
              ? 'Congratulations! You have qualified for the next round.'
              : 'Unfortunately, you did not meet the passing threshold. Please review the topics and try again.'}
          </p>

          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90 transition-all font-bold text-lg"
          >
            Back to Application
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text">
      {/* Violation Warnings Toast */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {warnings.slice(0, 3).map(w => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="bg-red-600 text-white rounded-xl px-4 py-3 shadow-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{w.message}</p>
                <p className="text-xs text-red-200">{w.timestamp}</p>
              </div>
              <button onClick={() => clearWarning(w.id)} className="text-red-200 hover:text-white">&times;</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Violation Counter */}
      <div className="fixed top-4 left-4 z-50 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border border-secondary/30 dark:border-dark-secondary/30 rounded-xl px-3 py-2 flex items-center gap-2">
        <Shield className={`w-4 h-4 ${Object.values(violations).reduce((a,b)=>a+b,0) > 0 ? 'text-red-500' : 'text-green-500'}`} />
        <span className="text-xs font-bold text-text dark:text-dark-text">
          Violations: {Object.values(violations).reduce((a,b)=>a+b,0)}
        </span>
      </div>

      {/* Floating Camera Preview */}
      <div className="fixed bottom-4 right-4 z-50 w-48 h-36 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-secondary/30 flex flex-col">
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-xs text-white text-center p-2">
            Waiting for camera...<br/>(Required for proctoring)
          </div>
        )}
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Proctoring Active
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 dark:bg-dark-background/90 backdrop-blur-md border-b border-secondary/20 dark:border-dark-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary dark:text-dark-primary hover:opacity-70 transition-opacity font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            Exit Assessment
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-text/60 dark:text-dark-text/60">Time Remaining</p>
              <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600 dark:text-red-400' : 'text-primary dark:text-dark-primary'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-text/70 dark:text-dark-text/70">
              Question {currentQuestion + 1} of {questions.length}
            </p>
            <p className="text-sm font-semibold text-text/70 dark:text-dark-text/70">
              {Object.keys(answers).length} answered
            </p>
          </div>
          <div className="w-full bg-secondary/20 dark:bg-dark-secondary/20 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-primary dark:bg-dark-primary"
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-secondary/5 dark:bg-dark-secondary/5 rounded-2xl p-8 border border-secondary/30 dark:border-dark-secondary/30 mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-primary dark:text-dark-primary">
              {questions[currentQuestion].question}
            </h2>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleAnswerSelect(currentQuestion, idx)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all font-semibold text-lg ${
                    answers[currentQuestion] === idx
                      ? 'bg-primary/20 dark:bg-dark-primary/20 border-primary dark:border-dark-primary text-primary dark:text-dark-primary'
                      : 'bg-background dark:bg-dark-background border-secondary/30 dark:border-dark-secondary/30 text-text dark:text-dark-text hover:border-secondary dark:hover:border-dark-secondary'
                  }`}
                >
                  <span className="mr-3">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 rounded-lg border-2 border-secondary dark:border-dark-secondary text-secondary dark:text-dark-secondary hover:bg-secondary/10 dark:hover:bg-dark-secondary/10 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 rounded-full font-bold transition-all ${
                  answers[idx] !== undefined
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : idx === currentQuestion
                    ? 'bg-primary dark:bg-dark-primary text-background dark:text-dark-background'
                    : 'bg-secondary/30 dark:bg-dark-secondary/30 text-text dark:text-dark-text hover:bg-secondary/50 dark:hover:bg-dark-secondary/50'
                }`}
              >
                {idx + 1}
              </motion.button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-lg bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90 transition-all font-semibold"
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-6 py-3 rounded-lg bg-primary dark:bg-dark-primary text-background dark:text-dark-background hover:opacity-90 transition-all font-semibold"
            >
              Next
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default MCQAssessment;
