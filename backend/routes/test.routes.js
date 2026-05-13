import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// ── POST /api/test/run-code  (no auth needed for code execution proxy) ────────
// Proxies to Judge0 CE to avoid CORS in the browser.
const JUDGE0_LANG_IDS = { python: 71, javascript: 63, java: 62, cpp: 54, go: 60 };

router.post("/run-code", async (req, res, next) => {
    try {
        const { language, code, stdin = "" } = req.body;
        const langId = JUDGE0_LANG_IDS[language] ?? 71;

        const j0Res = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    source_code: code,
                    language_id: langId,
                    stdin,
                    cpu_time_limit: 5,
                    memory_limit: 128000,
                }),
            }
        );

        if (!j0Res.ok) {
            const text = await j0Res.text();
            return res.status(502).json({ error: `Judge0 error: ${text.slice(0, 300)}` });
        }

        const data = await j0Res.json();
        res.json({
            stdout: (data.stdout || "").trim(),
            stderr: (data.stderr || data.compile_output || "").trim(),
            statusId: data.status?.id ?? 0,
            statusDesc: data.status?.description || "Unknown",
            exitCode: data.exit_code ?? 0,
            time: data.time,
            memory: data.memory,
        });
    } catch (err) { next(err); }
});

router.use(authenticate);

// // GET /api/test/:appId/start
// router.get("/:appId/start", authorize("candidate"), async (req, res, next) => {
//     try {
//         const appId = req.params.appId;

//         const appRes = await pool.query(
//             `SELECT a.*, j.id as job_id, j.title, j.description, j.skills,
//                     jt.questions as predefined_questions,
//                     jt.duration_minutes as predefined_duration,
//                     jt.deadline_at as job_test_deadline_at
//              FROM applications a
//              JOIN jobs j ON j.id = a.job_id
//              LEFT JOIN job_tests jt ON jt.job_id = j.id
//              WHERE a.id=$1 AND a.candidate_id=$2`,
//             [appId, req.user.id]
//         );

//         const app = appRes.rows[0];
//         if (!app) return res.status(404).json({ error: "Application not found" });

//         if (app.status !== "test_invited") {
//             // If job_tests exist, allow starting even if status is stale (safety for onboarding/older data).
//             // This prevents permanent 403 lockouts for candidates whose applications weren't updated to `test_invited`.
//             if (app.predefined_questions) {
//                 await pool.query("UPDATE applications SET status='test_invited', updated_at=NOW() WHERE id=$1", [appId]);
//                 app.status = 'test_invited';
//             } else {
//                 return res.status(403).json({ error: "Test not invited for this application" });
//             }
//         }

//         if (app.job_test_deadline_at) {
//             const now = new Date();
//             if (now > app.job_test_deadline_at) {
//                 return res.status(403).json({ error: "Test deadline has passed" });
//             }
//         }

//         const existingSess = await pool.query("SELECT * FROM test_sessions WHERE application_id=$1", [appId]);
//         if (existingSess.rows.length > 0) return res.json(existingSess.rows[0]);

//         let questions;
//         let duration = 45;
//         let jobDeadlineAt = app.job_test_deadline_at || null;

//         if (app.predefined_questions) {
//             questions = app.predefined_questions;

//             // support both formats
//             // old: { mcqs: [...], coding: [...], ... }
//             if (questions.mcqs) {
//                 questions = normalizeQuestionsPayload(questions);
//             }

//             duration = app.predefined_duration || duration;
//         } else {
//             // fallback mock
//             questions = {
//                 mcq: {
//                     passThreshold: 50,
//                     questions: [
//                         { id: "m1", question: "What is a variable?", options: ["A", "B", "C", "D"], correct_index: 0, points: 10 },
//                         { id: "m2", question: "What is React?", options: ["A", "B", "C", "D"], correct_index: 1, points: 10 }
//                     ],
//                 },
//                 coding: {
//                     passThreshold: 50,
//                     questions: [
//                         { id: "c1", title: "Reverse String", description: "Write a function to reverse a string.", language_options: ["python"], boilerplate: "", testCases: [], points: 40 }
//                     ]
//                 }
//             };
//         }

//         const sessionRes = await pool.query(
//             `INSERT INTO test_sessions (application_id, questions, duration_minutes, status, started_at)
//              VALUES ($1, $2, $3, 'in_progress', NOW()) RETURNING *`,
//             [appId, JSON.stringify(questions), duration]
//         );

//         await pool.query("UPDATE applications SET status='test_in_progress', updated_at=NOW() WHERE id=$1", [appId]);
//         await pool.query(
//             `INSERT INTO proctoring_sessions (application_id, tab_switches, window_switches, face_away_count, multiple_faces_count, is_flagged, flag_reasons)
//              VALUES ($1, 0, 0, 0, 0, false, '[]') ON CONFLICT (application_id) DO NOTHING`,
//             [appId]
//         );

//         res.json({
//             ...sessionRes.rows[0],
//             job_test_deadline_at: jobDeadlineAt,
//         });
//     } catch (err) { next(err); }
// });

router.get("/:appId/start", authorize("candidate"), async (req, res, next) => {
    try {
        const appId = req.params.appId;

        const appRes = await pool.query(
            `SELECT a.*, j.id as job_id, j.title, j.description, j.skills,
              jt.questions as predefined_questions,
              jt.duration_minutes as predefined_duration,
              jt.deadline_at as job_test_deadline_at
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       LEFT JOIN job_tests jt ON jt.job_id = j.id
       WHERE a.id=$1 AND a.candidate_id=$2`,
            [appId, req.user.id]
        );

        const app = appRes.rows[0];
        if (!app) return res.status(404).json({ error: "Application not found" });

        if (app.status !== "test_invited") {
            if (app.predefined_questions) {
                await pool.query("UPDATE applications SET status='test_invited', updated_at=NOW() WHERE id=$1", [appId]);
                app.status = "test_invited";
            } else {
                return res.status(403).json({ error: "Test not invited for this application" });
            }
        }

        const jobDeadlineAt = app.job_test_deadline_at || null;

        if (jobDeadlineAt && new Date() > new Date(jobDeadlineAt)) {
            return res.status(403).json({ error: "Test deadline has passed" });
        }

        // ── Build the canonical questions payload FIRST ──────────────────────────
        let questions;
        let duration = 45;

        if (app.predefined_questions) {
            questions = app.predefined_questions;
            // Convert old { mcqs: [...] } shape to normalized { mcq: {...} } shape
            if (questions.mcqs) {
                questions = normalizeQuestionsPayload(questions);
            }
            duration = app.predefined_duration || duration;
        } else {
            // Fallback mock — always has real questions
            questions = {
                mcq: {
                    passThreshold: 50,
                    questions: [
                        { id: "m1", question: "What is a variable?", options: ["A container for data", "A type of loop", "A language", "An error"], correct_index: 0, points: 10 },
                        { id: "m2", question: "What is React?", options: ["A database", "A JS UI library", "A language", "A server"], correct_index: 1, points: 10 },
                    ],
                },
                coding: {
                    passThreshold: 50,
                    questions: [
                        { id: "c1", title: "Reverse String", description: "Write a function to reverse a string.", language_options: ["python"], boilerplate: "", testCases: [], points: 40 },
                    ],
                },
                duration_minutes: duration,
            };
        }

        // ── Check for existing session AFTER we have canonical questions ──────────
        const existingSess = await pool.query(
            "SELECT * FROM test_sessions WHERE application_id=$1 ORDER BY created_at DESC LIMIT 1",
            [appId]
        );

        if (existingSess.rows.length > 0) {
            const sess = existingSess.rows[0];
            // Session is valid if it has either MCQ questions OR coding questions
            const existingMcqQs = sess.questions?.mcq?.questions;
            const existingCodingQs = sess.questions?.coding?.questions;
            const hasMcq = Array.isArray(existingMcqQs) && existingMcqQs.length > 0;
            const hasCoding = Array.isArray(existingCodingQs) && existingCodingQs.length > 0;
            const sessionIsValid = hasMcq || hasCoding;

            if (sessionIsValid && sess.status !== 'completed') {
                // Good session — return it as-is
                return res.json({ ...sess, job_test_deadline_at: jobDeadlineAt });
            }

            // Stale/empty/completed session — delete it and fall through to create a fresh one
            await pool.query("DELETE FROM test_sessions WHERE id=$1", [sess.id]);
        }


        // ── Create new session ────────────────────────────────────────────────────
        const sessionRes = await pool.query(
            `INSERT INTO test_sessions (application_id, questions, duration_minutes, status, started_at)
       VALUES ($1, $2, $3, 'in_progress', NOW()) RETURNING *`,
            [appId, JSON.stringify(questions), duration]
        );

        await pool.query("UPDATE applications SET status='test_in_progress', updated_at=NOW() WHERE id=$1", [appId]);
        await pool.query(
            `INSERT INTO proctoring_sessions (application_id, tab_switches, window_switches, face_away_count, multiple_faces_count, is_flagged, flag_reasons)
       VALUES ($1, 0, 0, 0, 0, false, '[]') ON CONFLICT (application_id) DO NOTHING`,
            [appId]
        );

        return res.json({ ...sessionRes.rows[0], job_test_deadline_at: jobDeadlineAt });
    } catch (err) { next(err); }
});
// POST /api/test/:appId/submit
router.post("/:appId/submit", authorize("candidate"), async (req, res, next) => {
    try {
        const { sessionId, mcqAnswers, codingAnswers } = req.body;
        const sessionIdInt = parseInt(sessionId, 10);

        const sessRes = await pool.query(
            "SELECT * FROM test_sessions WHERE id=$1 AND application_id=$2",
            [sessionIdInt, req.params.appId]
        );
        const session = sessRes.rows[0];
        if (!session || session.status === "completed") return res.status(400).json({ error: "Invalid session" });

        // deadline enforcement (server-side)
        const timeNow = new Date();
        const appRes = await pool.query(
            `SELECT jt.deadline_at AS job_deadline_at, t.started_at, t.duration_minutes
             FROM applications a
             JOIN jobs j ON j.id=a.job_id
             LEFT JOIN job_tests jt ON jt.job_id=j.id
             JOIN test_sessions t ON t.id=$1
             WHERE a.id=$2 AND a.candidate_id=$3`,
            [sessionId, req.params.appId, req.user.id]
        );

        const deadlineAt = appRes.rows[0]?.job_deadline_at || null;
        const startedAt = appRes.rows[0]?.started_at ? new Date(appRes.rows[0].started_at) : new Date(session.started_at);
        const durationMinutes = appRes.rows[0]?.duration_minutes || session.duration_minutes || 0;
        const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000 + 60000); // +1min grace

        if (deadlineAt && timeNow > new Date(deadlineAt)) {
            return res.status(403).json({ error: "Test deadline has passed" });
        }
        // Relaxed: only block if more than 2 minutes over
        if (durationMinutes && timeNow > expiresAt) {
            return res.status(403).json({ error: "Test time expired" });
        }

        const questions = session.questions;

        // Support both new normalized schema and old schema.
        const mcqBlock = questions?.mcq || (questions?.mcqs ? { questions: questions.mcqs } : null);
        const codingBlock = questions?.coding || (questions?.coding ? { questions: questions.coding } : null);

        // MCQ scoring
        let mcqScore = 0;
        let mcqMaxPoints = 0;
        if (mcqBlock?.questions) {
            for (const q of mcqBlock.questions) {
                const points = q.points ?? 10;
                mcqMaxPoints += points;
                const userAnswer = mcqAnswers?.[q.id];
                // New format: correct_index
                if (typeof q.correct_index === "number") {
                    if (userAnswer === q.correct_index) mcqScore += points;
                } else {
                    // Old format
                    if (userAnswer?.charAt(0).toUpperCase() === String(q.correct).toUpperCase()) mcqScore += points;
                }
            }
        }

        // Coding scoring – score proportionally by passed test cases (visible + hidden)
        let codingScore = 0;
        let codingMaxPoints = 0;
        let codingTestResults = [];

        const codingQuestions = codingBlock?.questions || [];
        for (const prob of codingQuestions) {
            const points = prob.points ?? 40;
            codingMaxPoints += points;

            const userCode = codingAnswers?.[prob.id] || "";
            // All test cases (both visible and hidden) used for scoring
            const allTestCases = prob.testCases || [];

            const result = evaluateCodingWithTestcases({ code: userCode, testCases: allTestCases });
            const passedCount = result.results.filter(r => r.passed).length;
            const totalCases = allTestCases.length;

            codingTestResults.push({
                problemId: prob.id,
                passedCount,
                totalCases,
                passedAll: result.passedAll,
                results: result.results,
            });

            if (totalCases === 0) {
                codingScore += Math.floor(points * 0.5); // partial credit if no test cases
            } else {
                codingScore += Math.round((passedCount / totalCases) * points);
            }
        }

        const totalScore = mcqScore + codingScore;
        await pool.query(
            `UPDATE test_sessions
             SET status='completed', submitted_at=NOW(), mcq_answers=$1, coding_answers=$2, total_score=$3
             WHERE id=$4`,
            [JSON.stringify(mcqAnswers), JSON.stringify(codingAnswers), totalScore, sessionIdInt]
        );

        const appRes2 = await pool.query("SELECT resume_score FROM applications WHERE id=$1", [req.params.appId]);
        const resumeScore = appRes2.rows[0]?.resume_score || 0;
        // Weighted: resume 30%, test 70% (test includes both MCQ + coding)
        const finalScore = Math.round((resumeScore * 0.3) + (totalScore * 0.7));
        await pool.query(
            "UPDATE applications SET test_score=$1, final_score=$2, status='test_completed' WHERE id=$3",
            [totalScore, finalScore, req.params.appId]
        );

        res.json({ message: "Submitted", finalScore, totalScore, mcqScore, codingScore, codingTestResults });
    } catch (err) { next(err); }
});

function evaluateCodingWithTestcases({ code, testCases }) {
    // NOTE: Real sandboxed execution happens in the browser via Pyodide.
    // The backend receives the raw code string. We use a simple heuristic:
    // The frontend appends 'OUTPUT = <last_result>' to the code string it sends.
    // We parse that marker to determine pass/fail for each test case.
    // For hidden test cases, the frontend cannot run them, so they are always
    // evaluated against the OUTPUT marker from the last visible run.
    //
    // Replace this with a proper sandbox (Docker/Firecracker) for production.

    const outputMatch = code.match(/OUTPUT\s*=\s*([\s\S]*?)\s*(?:\n|$)/m);
    const singleOutput = outputMatch ? outputMatch[1].trim() : null;

    const results = (testCases || []).map((tc, idx) => {
        const expected = String(tc.expected ?? '').trim();
        const actual = singleOutput != null ? singleOutput : null;
        const passed = actual != null && actual === expected;
        return {
            id: idx + 1,
            input: tc.input,
            expected,
            actual: actual ?? "",
            passed,
            hidden: tc.hidden || false,
        };
    });

    const passedAll = results.length > 0 && results.every((r) => r.passed);
    return { passedAll, results };
}

// POST /api/test/:appId/proctor/event
router.post("/:appId/proctor/event", authorize("candidate"), async (req, res, next) => {
    try {
        const { eventType, detail } = req.body;
        const colMap = { tab_switch: "tab_switches", window_switch: "window_switches", face_away: "face_away_count", multiple_faces: "multiple_faces_count" };
        const col = colMap[eventType];
        if (col) {
            await pool.query(`UPDATE proctoring_sessions SET ${col}=${col}+1, updated_at=NOW() WHERE application_id=$1`, [req.params.appId]);
        }
        await pool.query("INSERT INTO proctor_events (application_id, event_type, detail) VALUES ($1,$2,$3)", [req.params.appId, eventType, JSON.stringify(detail)]);
        res.json({ recorded: true });
    } catch (err) { next(err); }
});

// GET /api/test/:appId/proctor/report
router.get("/:appId/proctor/report", authorize("company"), async (req, res, next) => {
    try {
        const ps = await pool.query("SELECT * FROM proctoring_sessions WHERE application_id=$1", [req.params.appId]);
        const events = await pool.query("SELECT * FROM proctor_events WHERE application_id=$1 ORDER BY created_at ASC", [req.params.appId]);
        res.json({ summary: ps.rows[0], events: events.rows });
    } catch (err) { next(err); }
});

// GET /api/test/:appId/result
router.get("/:appId/result", authorize("candidate"), async (req, res, next) => {
    try {
        const app = await pool.query("SELECT * FROM applications WHERE id=$1 AND candidate_id=$2", [req.params.appId, req.user.id]);
        const sess = await pool.query("SELECT * FROM test_sessions WHERE application_id=$1 ORDER BY created_at DESC LIMIT 1", [req.params.appId]);
        res.json({ application: app.rows[0], testSession: sess.rows[0] });
    } catch (err) { next(err); }
});

function normalizeQuestionsPayload(questions) {
    // Backward compatibility: convert old repo format into normalized schema
    // Old: { mcqs: [{id, question, options, correct (string), points}], coding: [{id,title,description,points}] }
    if (questions?.mcqs || questions?.coding) {
        return {
            mcq: {
                passThreshold: questions.passThreshold ?? 50,
                questions: (questions.mcqs || []).map((q) => ({
                    id: q.id,
                    question: q.question,
                    options: q.options || [],
                    correct_index:
                        typeof q.correct === "number"
                            ? q.correct
                            : (q.options || []).findIndex(
                                (o) => String(o).toLowerCase() === String(q.correct).toLowerCase()
                            ),
                    points: q.points ?? 10,
                })),
            },
            coding: {
                passThreshold: questions.passThreshold ?? 50,
                questions: (Array.isArray(questions.coding)
                    ? questions.coding
                    : Array.isArray(questions.coding?.questions)
                        ? questions.coding.questions
                        : []
                ).map((q) => ({
                    id: q.id,
                    title: q.title,
                    description: q.description,
                    language_options: q.language_options || ["python"],
                    boilerplate: q.boilerplate || "",
                    testCases: q.testCases || q.testcases || [],
                    points_per_testcase: q.points_per_testcase,
                    points: q.points,
                })),
            },
            duration_minutes: questions.duration_minutes,
        };
    }
    return questions;
}

export default router;
