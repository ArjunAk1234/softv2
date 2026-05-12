import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

// GET /api/test/:appId/start
router.get("/:appId/start", authorize("candidate"), async (req, res, next) => {
    try {
        const appId = req.params.appId;

        const appRes = await pool.query(
            `SELECT a.*, j.id as job_id, j.title, j.description, j.skills, jt.questions as predefined_questions, jt.duration_minutes as predefined_duration
       FROM applications a JOIN jobs j ON j.id = a.job_id
       LEFT JOIN job_tests jt ON jt.job_id = j.id
       WHERE a.id=$1 AND a.candidate_id=$2`,
            [appId, req.user.id]
        );

        const app = appRes.rows[0];
        if (!app) return res.status(404).json({ error: "Application not found" });

        const existingSess = await pool.query("SELECT * FROM test_sessions WHERE application_id=$1", [appId]);
        if (existingSess.rows.length > 0) return res.json(existingSess.rows[0]);

        let questions, duration = 45;

        if (app.predefined_questions) {
            questions = app.predefined_questions;
            duration = app.predefined_duration;
        } else {
            questions = {
                mcqs: [
                    { id: "m1", question: "What is a variable?", options: ["A", "B", "C", "D"], correct: "A", points: 10 },
                    { id: "m2", question: "What is React?", options: ["A", "B", "C", "D"], correct: "B", points: 10 }
                ],
                coding: [
                    { id: "c1", title: "Reverse String", description: "Write a function to reverse a string.", points: 40 }
                ]
            };
        }

        const sessionRes = await pool.query(
            `INSERT INTO test_sessions (application_id, questions, duration_minutes, status, started_at)
       VALUES ($1, $2, $3, 'in_progress', NOW()) RETURNING *`,
            [appId, JSON.stringify(questions), duration]
        );

        await pool.query("UPDATE applications SET status='test_in_progress', updated_at=NOW() WHERE id=$1", [appId]);
        await pool.query(
            `INSERT INTO proctoring_sessions (application_id, tab_switches, window_switches, face_away_count, multiple_faces_count, is_flagged, flag_reasons)
       VALUES ($1, 0, 0, 0, 0, false, '[]') ON CONFLICT (application_id) DO NOTHING`, [appId]
        );

        res.json(sessionRes.rows[0]);
    } catch (err) { next(err); }
});

// POST /api/test/:appId/submit
router.post("/:appId/submit", authorize("candidate"), async (req, res, next) => {
    try {
        const { sessionId, mcqAnswers, codingAnswers } = req.body;
        const sessRes = await pool.query("SELECT * FROM test_sessions WHERE id=$1 AND application_id=$2", [sessionId, req.params.appId]);
        const session = sessRes.rows[0];
        if (!session || session.status === "completed") return res.status(400).json({ error: "Invalid session" });

        const questions = session.questions;
        let mcqScore = 0;
        for (const q of questions.mcqs) {
            if (mcqAnswers?.[q.id]?.charAt(0).toUpperCase() === q.correct.toUpperCase()) mcqScore += q.points;
        }

        let codingScore = 0;
        for (const q of questions.coding) {
            const submission = codingAnswers?.[q.id] || "";
            const evalPrompt = `Score this code from 0 to ${q.points}: ${submission}`;
            codingScore += Math.floor(q.points * 0.8); // 80% default score
        }

        const totalScore = mcqScore + codingScore;
        await pool.query(
            `UPDATE test_sessions SET status='completed', submitted_at=NOW(), mcq_answers=$1, coding_answers=$2, total_score=$3 WHERE id=$4`,
            [JSON.stringify(mcqAnswers), JSON.stringify(codingAnswers), totalScore, sessionId]
        );

        const appRes = await pool.query("SELECT resume_score FROM applications WHERE id=$1", [req.params.appId]);
        const finalScore = Math.round((appRes.rows[0].resume_score * 0.4) + (totalScore * 0.6));
        await pool.query("UPDATE applications SET test_score=$1, final_score=$2, status='test_completed' WHERE id=$3", [totalScore, finalScore, req.params.appId]);

        res.json({ message: "Submitted", finalScore });
    } catch (err) { next(err); }
});

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

export default router;