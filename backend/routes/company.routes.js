import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, authorize("company"));

// POST /api/company/jobs
router.post("/jobs", async (req, res, next) => {
    try {
        const { title, description, skills, location, jobType, salaryMin, salaryMax, deadline } = req.body;
        const companyRes = await pool.query("SELECT id FROM companies WHERE user_id=$1", [req.user.id]);
        const companyId = companyRes.rows[0]?.id;
        if (!companyId) return res.status(404).json({ error: "Company profile not found" });

        const { rows } = await pool.query(
            `INSERT INTO jobs (company_id, title, description, skills, location, job_type, salary_min, salary_max, deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [companyId, title, description, skills || [], location, jobType, salaryMin, salaryMax, deadline]
        );
        res.status(201).json(rows[0]);
    } catch (err) { next(err); }
});

// GET /api/company/jobs
router.get("/jobs", async (req, res, next) => {
    try {
        const companyRes = await pool.query("SELECT id FROM companies WHERE user_id=$1", [req.user.id]);
        const companyId = companyRes.rows[0]?.id;
        const { rows } = await pool.query(
            `SELECT j.*, COUNT(a.id) AS total_applicants,
         COUNT(a.id) FILTER (WHERE a.status='shortlisted') AS shortlisted,
         COUNT(a.id) FILTER (WHERE a.status='rejected') AS rejected,
         COUNT(a.id) FILTER (WHERE a.status='test_invited') AS test_invited,
         COUNT(a.id) FILTER (WHERE a.status='test_completed') AS test_completed,
         COUNT(a.id) FILTER (WHERE a.status='hired') AS hired
       FROM jobs j LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.company_id=$1 GROUP BY j.id ORDER BY j.created_at DESC`,
            [companyId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/company/jobs/:jobId
router.get("/jobs/:jobId", async (req, res, next) => {
    try {
        const { rows } = await pool.query("SELECT * FROM jobs WHERE id=$1", [req.params.jobId]);
        if (!rows.length) return res.status(404).json({ error: "Job not found" });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// PUT /api/company/jobs/:jobId
router.put("/jobs/:jobId", async (req, res, next) => {
    try {
        const { title, description, skills, location, jobType, salaryMin, salaryMax, deadline, isActive } = req.body;
        const { rows } = await pool.query(
            `UPDATE jobs SET title=COALESCE($1,title), description=COALESCE($2,description), skills=COALESCE($3,skills),
         location=COALESCE($4,location), job_type=COALESCE($5,job_type), salary_min=COALESCE($6,salary_min),
         salary_max=COALESCE($7,salary_max), deadline=COALESCE($8,deadline), is_active=COALESCE($9,is_active)
       WHERE id=$10 RETURNING *`,
            [title, description, skills, location, jobType, salaryMin, salaryMax, deadline, isActive, req.params.jobId]
        );
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// DELETE /api/company/jobs/:jobId
router.delete("/jobs/:jobId", async (req, res, next) => {
    try {
        await pool.query("DELETE FROM jobs WHERE id=$1", [req.params.jobId]);
        res.json({ message: "Job deleted" });
    } catch (err) { next(err); }
});

// GET /api/company/applicants/:jobId
router.get("/applicants/:jobId", async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = `
      SELECT a.*, u.name, u.email, c.phone, c.skills AS candidate_skills, c.experience_years,
        ps.tab_switches, ps.window_switches, ps.face_away_count, ps.multiple_faces_count, ps.is_flagged, ps.flag_reasons
      FROM applications a
      JOIN users u ON u.id = a.candidate_id
      JOIN candidates c ON c.user_id = a.candidate_id
      LEFT JOIN proctoring_sessions ps ON ps.application_id = a.id
      WHERE a.job_id=$1`;
        const params = [req.params.jobId];
        if (status) { query += " AND a.status=$2"; params.push(status); }
        query += " ORDER BY a.final_score DESC NULLS LAST";
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/company/ranking/:jobId
router.get("/ranking/:jobId", async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.id, a.candidate_id, a.resume_score, a.test_score,
              a.interview_score, a.final_score, a.status, u.name, u.email, c.experience_years,
              ps.is_flagged, ps.flag_reasons,
              iss.interviewer_score, iss.interviewer_feedback,
              sl.scheduled_at as interview_date
       FROM applications a
       JOIN users u ON u.id = a.candidate_id
       JOIN candidates c ON c.user_id = a.candidate_id
       LEFT JOIN proctoring_sessions ps ON ps.application_id = a.id
       LEFT JOIN interview_sessions iss ON iss.application_id = a.id
       LEFT JOIN interview_slots sl ON sl.id = iss.slot_id
       WHERE a.job_id=$1 AND a.final_score IS NOT NULL ORDER BY a.final_score DESC`,
            [req.params.jobId]
        );
        res.json(rows);
    } catch (err) { next(err); }
});

// PATCH /api/company/applications/:appId/status
router.patch("/applications/:appId/status", async (req, res, next) => {
    try {
        const { status } = req.body;
        const allowed = ["shortlisted", "rejected", "test_invited", "interview_scheduled", "interview_completed", "hired"];
        if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
        const { rows } = await pool.query(
            "UPDATE applications SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
            [status, req.params.appId]
        );
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// GET /api/company/dashboard
router.get("/dashboard", async (req, res, next) => {
    try {
        const companyRes = await pool.query("SELECT id FROM companies WHERE user_id=$1", [req.user.id]);
        const companyId = companyRes.rows[0]?.id;
        const { rows } = await pool.query(
            `SELECT COUNT(DISTINCT j.id) AS total_jobs, COUNT(a.id) AS total_applications,
         COUNT(a.id) FILTER (WHERE a.status='hired') AS total_hired,
         COUNT(a.id) FILTER (WHERE a.status='shortlisted') AS total_shortlisted
       FROM jobs j LEFT JOIN applications a ON a.job_id=j.id WHERE j.company_id=$1`,
            [companyId]
        );
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// GET /api/company/applications/:appId/details
router.get("/applications/:appId/details", async (req, res, next) => {
    try {
        const appId = req.params.appId;
        const appRes = await pool.query(
            `SELECT a.*, u.name, u.email, c.skills as profile_skills, c.experience_years
       FROM applications a JOIN users u ON u.id = a.candidate_id
       JOIN candidates c ON c.user_id = a.candidate_id WHERE a.id = $1`, [appId]
        );
        if (appRes.rows.length === 0) return res.status(404).json({ error: "Application not found" });
        const application = appRes.rows[0];

        const testRes = await pool.query("SELECT * FROM test_sessions WHERE application_id = $1", [appId]);
        const proctorRes = await pool.query("SELECT * FROM proctoring_sessions WHERE application_id = $1", [appId]);

        res.json({
            candidate: { name: application.name, email: application.email, experience: application.experience_years },
            phases: {
                resume_screening: { status: application.resume_score ? "completed" : "pending", score: application.resume_score, feedback: application.ai_resume_feedback },
                technical_test: { status: testRes.rows[0]?.status || "not_started", total_score: testRes.rows[0]?.total_score, details: testRes.rows[0] },
                proctoring: { is_flagged: proctorRes.rows[0]?.is_flagged || false, flags: proctorRes.rows[0]?.flag_reasons || [], violations: { tab_switches: proctorRes.rows[0]?.tab_switches, face_away: proctorRes.rows[0]?.face_away_count } }
            },
            final_score: application.final_score,
            current_status: application.status
        });
    } catch (err) { next(err); }
});

// GET /api/company/jobs/:jobId/test  — fetch existing test for editing
router.get("/jobs/:jobId/test", async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM job_tests WHERE job_id=$1",
            [req.params.jobId]
        );
        if (!rows.length) return res.status(404).json({ error: "No test found" });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// POST /api/company/jobs/:jobId/test  (also handles PUT via same logic)
router.post("/jobs/:jobId/test", async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { questions, duration_minutes, deadline_at } = req.body;

        if (!questions) return res.status(400).json({ error: "questions is required" });

        const duration = duration_minutes ?? 60;
        const deadline = deadline_at ? new Date(deadline_at) : null;

        const normalizedQuestions = normalizeQuestionsPayload(questions);
        
        // Debug: log MCQ count so we can verify what arrives
        console.log('[TEST SAVE] jobId:', jobId, 'MCQ count:', normalizedQuestions?.mcq?.questions?.length, 'Coding count:', normalizedQuestions?.coding?.questions?.length);

        const { rows } = await pool.query(
            `INSERT INTO job_tests (job_id, questions, duration_minutes, deadline_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (job_id)
             DO UPDATE SET questions=$2, duration_minutes=$3, deadline_at=$4, updated_at=NOW()
             RETURNING *`,
            [jobId, JSON.stringify(normalizedQuestions), duration, deadline]
        );

        res.status(201).json({ message: "Test created for job", test: rows[0] });
    } catch (err) { next(err); }
});

// PUT /api/company/jobs/:jobId/test  — alias for editing
router.put("/jobs/:jobId/test", async (req, res, next) => {
    req.method = 'POST';
    return router.handle(req, res, next);
});


function normalizeQuestionsPayload(questions) {
    // OLD format: { mcqs: [...], coding: [...] }  — mcqs is the old key, coding is an array
    // NEW format: { mcq: { questions: [...] }, coding: { questions: [...] } }
    // BUG FIX: old check `questions?.coding` was always true for new format too (coding is an object)
    // Only enter old-format path if `mcqs` key exists (old) OR coding is a plain array (old)
    const isOldFormat = Array.isArray(questions?.mcqs) || Array.isArray(questions?.coding);

    if (isOldFormat) {
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
                questions: (Array.isArray(questions.coding) ? questions.coding : []).map((q) => ({
                    id: q.id,
                    title: q.title,
                    description: q.description,
                    language_options: q.language_options || ["python"],
                    boilerplate: q.boilerplate || "",
                    testCases: q.testCases || [],
                    points_per_testcase: q.points_per_testcase,
                    points: q.points,
                })),
            },
            duration_minutes: questions.duration_minutes,
        };
    }

    // New format already in { mcq: { questions: [...] }, coding: { questions: [...] } } — return as-is
    return questions;
}


// POST /api/company/jobs/:jobId/generate-test-ai
router.post("/jobs/:jobId/generate-test-ai", async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const jobRes = await pool.query("SELECT title, description, skills FROM jobs WHERE id=$1", [jobId]);
        const job = jobRes.rows[0];
        let generatedData = {
            mcqs: [
                { question: "What is a variable?", options: ["A", "B", "C", "D"], correct_option: 0 },
                { question: "What is React?", options: ["A", "B", "C", "D"], correct_option: 1 }
            ],
            coding: [
                { title: "Reverse String", description: "Write a function to reverse a string." }
            ]
        };
        res.json({ suggested_test: generatedData });
    } catch (err) { next(err); }
});

// POST /api/company/jobs/:jobId/bulk-screen
router.post("/jobs/:jobId/bulk-screen", async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const jobRes = await pool.query("SELECT skills FROM jobs WHERE id=$1", [jobId]);
        const jobSkills = jobRes.rows[0]?.skills || [];

        const appsRes = await pool.query(
            `SELECT a.id, c.skills as cand_skills, c.experience_years 
             FROM applications a 
             JOIN candidates c ON c.id = a.candidate_id 
             WHERE a.job_id=$1 AND a.status='applied'`,
            [jobId]
        );

        let count = 0;
        for (const app of appsRes.rows) {
            const candSkills = app.cand_skills || [];
            let matched = 0;
            const candCombined = candSkills.join(" ").toLowerCase();

            for (const js of jobSkills) {
                const skillLower = js.toLowerCase();
                const baseSkill = skillLower.replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/)[0];
                if (candCombined.includes(skillLower) || (baseSkill && baseSkill.length > 2 && candCombined.includes(baseSkill))) {
                    matched++;
                }
            }
            const matchRatio = jobSkills.length > 0 ? (matched / jobSkills.length) : 1;
            const score = Math.min(100, Math.round(matchRatio * 80) + (app.experience_years || 0) * 4);

            const newStatus = score >= 40 ? "shortlisted" : "rejected";
            const feedback = { score, summary: `Local analysis scored ${score}% based on skills match (${matched}/${jobSkills.length}) and experience.`, recommendation: score >= 40 ? "shortlist" : "reject" };

            await pool.query(
                "UPDATE applications SET resume_score=$1, status=$2, ai_resume_feedback=$3, updated_at=NOW() WHERE id=$4",
                [score, newStatus, JSON.stringify(feedback), app.id]
            );
            count++;
        }
        res.json({ message: `Bulk screened ${count} candidates.`, count });
    } catch (err) { next(err); }
});

export default router;
