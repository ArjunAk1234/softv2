// ============================================================
//  interview.routes.js  –  Interview scheduling & live session
// ============================================================
import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);

// ── COMPANY: Create interviewer account ───────────────────────────────────────
// POST /interview/company/interviewers
router.post("/company/interviewers", authorize("company"), async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const bcrypt = await import("bcryptjs");
        const hash = await bcrypt.default.hash(password, 12);

        const companyRes = await pool.query("SELECT id FROM companies WHERE user_id=$1", [req.user.id]);
        const companyId = companyRes.rows[0]?.id;
        if (!companyId) return res.status(404).json({ error: "Company not found" });

        const userRes = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,'interviewer') RETURNING id, name, email, role",
            [name, email, hash]
        );
        const user = userRes.rows[0];

        const intRes = await pool.query(
            "INSERT INTO interviewers (user_id, company_id) VALUES ($1,$2) RETURNING *",
            [user.id, companyId]
        );

        const jwt = await import("jsonwebtoken");
        const token = jwt.default.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({ message: "Interviewer created", interviewer: intRes.rows[0], user, token });
    } catch (err) {
        if (err.code === "23505") return res.status(409).json({ error: "Email already registered" });
        next(err);
    }
});

// ── COMPANY: List interviewers ────────────────────────────────────────────────
// GET /interview/company/interviewers
router.get("/company/interviewers", authorize("company"), async (req, res, next) => {
    try {
        const companyRes = await pool.query("SELECT id FROM companies WHERE user_id=$1", [req.user.id]);
        const companyId = companyRes.rows[0]?.id;
        const { rows } = await pool.query(
            `SELECT i.id, i.created_at, u.name, u.email
             FROM interviewers i JOIN users u ON u.id=i.user_id
             WHERE i.company_id=$1 ORDER BY i.created_at DESC`,
            [companyId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// ── COMPANY: Create interview slots ──────────────────────────────────────────
// POST /interview/company/slots
router.post("/company/slots", authorize("company"), async (req, res, next) => {
    try {
        const { jobId, interviewerId, scheduledAt, durationMinutes } = req.body;
        const { rows } = await pool.query(
            `INSERT INTO interview_slots (job_id, interviewer_id, scheduled_at, duration_minutes)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [jobId, interviewerId, scheduledAt, durationMinutes || 45]
        );
        res.status(201).json(rows[0]);
    } catch (err) { next(err); }
});

// ── COMPANY: Bulk auto-create slots (company picks date range, AI suggests) ──
// POST /interview/company/slots/bulk
router.post("/company/slots/bulk", authorize("company"), async (req, res, next) => {
    try {
        const { jobId, interviewerId, startDate, endDate, slotsPerDay, startHour, durationMinutes } = req.body;
        const slots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Skip weekends
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            for (let s = 0; s < (slotsPerDay || 3); s++) {
                const slotTime = new Date(d);
                slotTime.setHours((startHour || 10) + s * 2, 0, 0, 0);
                slots.push([jobId, interviewerId, slotTime.toISOString(), durationMinutes || 45]);
            }
        }
        const created = [];
        for (const s of slots) {
            const r = await pool.query(
                `INSERT INTO interview_slots (job_id, interviewer_id, scheduled_at, duration_minutes)
                 VALUES ($1,$2,$3,$4) RETURNING *`, s
            );
            created.push(r.rows[0]);
        }
        res.status(201).json({ created: created.length, slots: created });
    } catch (err) { next(err); }
});

// ── COMPANY: Get slots for a job ─────────────────────────────────────────────
// GET /interview/company/slots/:jobId
router.get("/company/slots/:jobId", authorize("company"), async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT s.*, u.name as interviewer_name,
               CASE WHEN is_booked THEN 'booked' ELSE 'available' END as slot_status,
               iss.id as session_id, app.candidate_id,
               cu.name as candidate_name, cu.email as candidate_email
             FROM interview_slots s
             JOIN interviewers i ON i.id=s.interviewer_id
             JOIN users u ON u.id=i.user_id
             LEFT JOIN interview_sessions iss ON iss.slot_id=s.id
             LEFT JOIN applications app ON app.id=iss.application_id
             LEFT JOIN users cu ON cu.id=app.candidate_id
             WHERE s.job_id=$1 ORDER BY s.scheduled_at ASC`,
            [req.params.jobId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// ── COMPANY: View all interview sessions for a job ────────────────────────────
// GET /interview/company/sessions/:jobId
router.get("/company/sessions/:jobId", authorize("company"), async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT iss.*, s.scheduled_at, s.duration_minutes,
               u.name as interviewer_name, cu.name as candidate_name, cu.email as candidate_email,
               app.resume_score, app.test_score, app.final_score, app.status as app_status
             FROM interview_sessions iss
             JOIN interview_slots s ON s.id=iss.slot_id
             JOIN interviewers i ON i.id=iss.interviewer_id
             JOIN users u ON u.id=i.user_id
             JOIN applications app ON app.id=iss.application_id
             JOIN users cu ON cu.id=app.candidate_id
             WHERE s.job_id=$1 ORDER BY s.scheduled_at ASC`,
            [req.params.jobId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// ── CANDIDATE: Get available slots for a job ──────────────────────────────────
// GET /interview/slots/:jobId
router.get("/slots/:jobId", authorize("candidate"), async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT s.id, s.scheduled_at, s.duration_minutes, u.name as interviewer_name
             FROM interview_slots s
             JOIN interviewers i ON i.id=s.interviewer_id
             JOIN users u ON u.id=i.user_id
             WHERE s.job_id=$1 AND s.is_booked=false AND s.scheduled_at > NOW()
             ORDER BY s.scheduled_at ASC`,
            [req.params.jobId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// ── CANDIDATE: Book a slot ────────────────────────────────────────────────────
// POST /interview/book/:slotId
router.post("/book/:slotId", authorize("candidate"), async (req, res, next) => {
    try {
        const { applicationId } = req.body;
        const slotRes = await pool.query("SELECT * FROM interview_slots WHERE id=$1 AND is_booked=false", [req.params.slotId]);
        if (!slotRes.rows.length) return res.status(409).json({ error: "Slot not available" });
        const slot = slotRes.rows[0];

        // Verify application belongs to this candidate and is for the right job
        const appRes = await pool.query(
            "SELECT * FROM applications WHERE id=$1 AND candidate_id=$2 AND job_id=$3",
            [applicationId, req.user.id, slot.job_id]
        );
        if (!appRes.rows.length) return res.status(403).json({ error: "Application not found" });

        // Check not already booked for this job
        const existingRes = await pool.query(
            `SELECT iss.id FROM interview_sessions iss
             JOIN interview_slots s ON s.id=iss.slot_id
             WHERE iss.application_id=$1`, [applicationId]
        );
        if (existingRes.rows.length) return res.status(409).json({ error: "Interview already scheduled" });

        await pool.query("UPDATE interview_slots SET is_booked=true WHERE id=$1", [req.params.slotId]);
        const sessRes = await pool.query(
            `INSERT INTO interview_sessions (application_id, slot_id, interviewer_id, status)
             VALUES ($1,$2,$3,'scheduled') RETURNING *`,
            [applicationId, slot.id, slot.interviewer_id]
        );
        await pool.query(
            "UPDATE applications SET status='interview_scheduled', updated_at=NOW() WHERE id=$1",
            [applicationId]
        );

        res.status(201).json(sessRes.rows[0]);
    } catch (err) { next(err); }
});

// ── CANDIDATE: Get my interview sessions ─────────────────────────────────────
// GET /interview/my
router.get("/my", authorize("candidate"), async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT iss.*, s.scheduled_at, s.duration_minutes,
               u.name as interviewer_name, j.title as job_title, c.company_name,
               app.resume_score, app.test_score, app.final_score
             FROM interview_sessions iss
             JOIN interview_slots s ON s.id=iss.slot_id
             JOIN interviewers i ON i.id=iss.interviewer_id
             JOIN users u ON u.id=i.user_id
             JOIN applications app ON app.id=iss.application_id
             JOIN jobs j ON j.id=s.job_id
             JOIN companies c ON c.id=j.company_id
             WHERE app.candidate_id=$1 ORDER BY s.scheduled_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// ── INTERVIEWER: Get my sessions ──────────────────────────────────────────────
// GET /interview/interviewer/sessions
router.get("/interviewer/sessions", authorize("interviewer"), async (req, res, next) => {
    try {
        const intRes = await pool.query("SELECT id FROM interviewers WHERE user_id=$1", [req.user.id]);
        const interviewerId = intRes.rows[0]?.id;
        if (!interviewerId) return res.status(404).json({ error: "Interviewer profile not found" });

        const { rows } = await pool.query(
            `SELECT iss.*, s.scheduled_at, s.duration_minutes,
               cu.name as candidate_name, cu.email as candidate_email,
               j.title as job_title, c.company_name,
               app.resume_score, app.test_score, app.interview_score, app.final_score,
               app.ai_resume_feedback, app.id as application_id
             FROM interview_sessions iss
             JOIN interview_slots s ON s.id=iss.slot_id
             JOIN applications app ON app.id=iss.application_id
             JOIN users cu ON cu.id=app.candidate_id
             JOIN jobs j ON j.id=s.job_id
             JOIN companies c ON c.id=j.company_id
             WHERE iss.interviewer_id=$1 ORDER BY s.scheduled_at ASC`,
            [interviewerId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// ── INTERVIEWER: Get AI notes for a session ───────────────────────────────────
// GET /interview/sessions/:sessionId/ai-notes
router.get("/sessions/:sessionId/ai-notes", authorize("interviewer"), async (req, res, next) => {
    try {
        const sessRes = await pool.query(
            `SELECT iss.*, cu.name as candidate_name, cu.email as candidate_email,
               cand.skills, cand.experience_years, cand.education, cand.linkedin_url, cand.github_url,
               app.resume_score, app.test_score, app.ai_resume_feedback, app.cover_letter,
               j.title as job_title, j.description as job_description, j.skills as job_skills
             FROM interview_sessions iss
             JOIN applications app ON app.id=iss.application_id
             JOIN users cu ON cu.id=app.candidate_id
             JOIN candidates cand ON cand.user_id=cu.id
             JOIN interview_slots s ON s.id=iss.slot_id
             JOIN jobs j ON j.id=s.job_id
             WHERE iss.id=$1`,
            [req.params.sessionId]
        );
        const sess = sessRes.rows[0];
        if (!sess) return res.status(404).json({ error: "Session not found" });

        // Return cached notes if available
        if (sess.ai_notes) return res.json({ notes: sess.ai_notes });

        const prompt = `You are an AI interview assistant. Generate structured interview preparation notes for the interviewer.

Candidate: ${sess.candidate_name}
Job: ${sess.job_title}
Job Description: ${sess.job_description}
Required Skills: ${(sess.job_skills || []).join(", ")}

Candidate Profile:
- Experience: ${sess.experience_years} years
- Education: ${sess.education}
- Skills: ${(sess.skills || []).join(", ")}
- Resume AI Score: ${sess.resume_score}/100
- Technical Test Score: ${sess.test_score}/100
- Cover Letter: ${sess.cover_letter || "Not provided"}
- AI Resume Feedback: ${JSON.stringify(sess.ai_resume_feedback || {})}

Generate:
1. Candidate Strengths (based on data)
2. Areas to Probe (gaps or concerns to explore)
3. Suggested Interview Questions (5 tailored questions)
4. Key Things to Evaluate
5. Red Flags to Watch (if any)

Return as a well-formatted markdown document.`;

        const notes = `# Simulated AI Notes\n\n**Candidate Strengths**\n- General fit\n\n**Areas to Probe**\n- Specific skills from resume\n\n**Suggested Questions**\n1. Can you describe your past projects?\n2. How do you handle challenges?\n\n*(Note: Real AI analysis disabled as per local model requirement)*`;

        await pool.query("UPDATE interview_sessions SET ai_notes=$1 WHERE id=$2", [notes, req.params.sessionId]);
        res.json({ notes });
    } catch (err) { next(err); }
});

// ── INTERVIEWER: Start session ────────────────────────────────────────────────
// POST /interview/sessions/:sessionId/start
router.post("/sessions/:sessionId/start", authorize("interviewer"), async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            "UPDATE interview_sessions SET status='in_progress', started_at=NOW() WHERE id=$1 RETURNING *",
            [req.params.sessionId]
        );
        if (!rows.length) return res.status(404).json({ error: "Session not found" });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// ── INTERVIEWER: Submit scores ────────────────────────────────────────────────
// POST /interview/sessions/:sessionId/complete
router.post("/sessions/:sessionId/complete", authorize("interviewer"), async (req, res, next) => {
    try {
        const { score, feedback } = req.body;
        if (score == null || score < 0 || score > 100)
            return res.status(400).json({ error: "Score must be 0-100" });

        const sessRes = await pool.query(
            `UPDATE interview_sessions
             SET status='completed', ended_at=NOW(), interviewer_score=$1, interviewer_feedback=$2
             WHERE id=$3 RETURNING *`,
            [score, feedback, req.params.sessionId]
        );
        const sess = sessRes.rows[0];
        if (!sess) return res.status(404).json({ error: "Session not found" });

        // Recalculate final score: resume 30% + test 30% + interview 40%
        const appRes = await pool.query(
            "SELECT resume_score, test_score FROM applications WHERE id=$1",
            [sess.application_id]
        );
        const app = appRes.rows[0];
        const resumeScore = app.resume_score || 0;
        const testScore = app.test_score || 0;
        const finalScore = Math.round(resumeScore * 0.3 + testScore * 0.3 + score * 0.4);

        await pool.query(
            `UPDATE applications
             SET interview_score=$1, final_score=$2, status='interview_completed', updated_at=NOW()
             WHERE id=$3`,
            [score, finalScore, sess.application_id]
        );

        res.json({ session: sess, finalScore });
    } catch (err) { next(err); }
});

// ── COMPANY: Final ranking (all 3 scores) ────────────────────────────────────
// GET /interview/company/ranking/:jobId
router.get("/company/ranking/:jobId", authorize("company"), async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id as application_id, a.resume_score, a.test_score, a.interview_score,
               a.final_score, a.status, u.name, u.email, c.experience_years,
               ps.is_flagged, ps.flag_reasons,
               iss.interviewer_score, iss.interviewer_feedback
             FROM applications a
             JOIN users u ON u.id=a.candidate_id
             JOIN candidates c ON c.user_id=a.candidate_id
             LEFT JOIN proctoring_sessions ps ON ps.application_id=a.id
             LEFT JOIN interview_sessions iss ON iss.application_id=a.id
             WHERE a.job_id=$1 AND a.final_score IS NOT NULL
             ORDER BY a.final_score DESC`,
            [req.params.jobId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

export default router;
