import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const router = Router();

router.use(authenticate, authorize("candidate"));

// Multer Config
const uploadDir = "./uploads/resumes";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = [".pdf", ".doc", ".docx"];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error("Only PDF/DOC/DOCX allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

// GET /api/candidate/jobs
router.get("/jobs", async (req, res, next) => {
    try {
        const { search, location } = req.query;
        let query = `SELECT j.*, c.company_name, (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.id) AS applicant_count
                 FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.is_active=true`;
        const params = [];
        if (search) { params.push(`%${search}%`); query += ` AND (j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`; }
        if (location) { params.push(`%${location}%`); query += ` AND j.location ILIKE $${params.length}`; }
        query += " ORDER BY j.created_at DESC";
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) { next(err); }
});

// GET /api/candidate/jobs/:jobId
router.get("/jobs/:jobId", async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT j.*, c.company_name FROM jobs j JOIN companies c ON c.id=j.company_id WHERE j.id=$1`, [req.params.jobId]
        );
        if (!rows.length) return res.status(404).json({ error: "Job not found" });
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// POST /api/candidate/apply/:jobId
router.post("/apply/:jobId", async (req, res, next) => {
    try {
        const { coverLetter } = req.body;
        const exists = await pool.query("SELECT id FROM applications WHERE job_id=$1 AND candidate_id=$2", [req.params.jobId, req.user.id]);
        if (exists.rows.length) return res.status(409).json({ error: "Already applied" });
        const { rows } = await pool.query(
            `INSERT INTO applications (job_id, candidate_id, status, cover_letter) VALUES ($1,$2,'applied',$3) RETURNING *`,
            [req.params.jobId, req.user.id, coverLetter]
        );
        res.status(201).json(rows[0]);
    } catch (err) { next(err); }
});

// // POST /api/candidate/applications/:appId/resume
// router.post("/applications/:appId/resume", upload.single("resume"), async (req, res, next) => {
//     try {
//         if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//         const jobRes = await pool.query(
//             `SELECT j.* FROM jobs j JOIN applications a ON a.job_id=j.id WHERE a.id=$1`,
//             [req.params.appId]
//         );
//         const candRes = await pool.query("SELECT * FROM candidates WHERE user_id=$1", [req.user.id]);
//         const job = jobRes.rows[0];
//         const cand = candRes.rows[0];

//         // Extract text from PDF or DOCX
//         let resumeText = "";
//         const ext = path.extname(req.file.originalname).toLowerCase();
//         try {
//             if (ext === ".pdf") {
//                 const pdfParse = require("pdf-parse");
//                 const dataBuffer = fs.readFileSync(req.file.path);
//                 const pdfData = await pdfParse(dataBuffer);
//                 resumeText = pdfData.text;
//             } else if (ext === ".docx" || ext === ".doc") {
//                 const mammoth = require("mammoth");
//                 const result = await mammoth.extractRawText({ path: req.file.path });
//                 resumeText = result.value;
//             }
//         } catch (parseErr) {
//             console.warn("Resume parse failed, using profile data only:", parseErr.message);
//         }

//         // Local Model Logic (No online API)
//         const jobSkills = job.skills || [];
//         const candSkills = cand.skills || [];

//         let matchedSkills = [];
//         let missingSkills = [];
//         const combinedText = (resumeText + " " + candSkills.join(" ")).toLowerCase();

//         for (const js of jobSkills) {
//             const skillLower = js.toLowerCase();
//             // Fuzzier match: strip special chars to find base word (e.g., 'react.js' -> 'react')
//             const baseSkill = skillLower.replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/)[0]; 

//             if (combinedText.includes(skillLower) || (baseSkill && baseSkill.length > 2 && combinedText.includes(baseSkill))) {
//                 matchedSkills.push(js);
//             } else {
//                 missingSkills.push(js);
//             }
//         }

//         const matchRatio = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) : 1;
//         // Base score up to 80 based on skills, plus up to 20 for experience (4 pts per year)
//         const score = Math.min(100, Math.round(matchRatio * 80) + (cand.experience_years || 0) * 4);
//         const recommendation = score >= 40 ? "shortlist" : "reject";

//         const aiData = {
//             score: score,
//             recommendation: recommendation,
//             summary: `Local analysis matched ${matchedSkills.length} out of ${jobSkills.length} required skills.`,
//             strengths: matchedSkills.slice(0, 3),
//             weaknesses: missingSkills.slice(0, 2),
//             skill_gaps: missingSkills,
//             skill_matches: matchedSkills
//         };

//         const newStatus = aiData.recommendation === "reject" ? "rejected" : "resume_reviewed";

//         await pool.query(
//             `UPDATE applications SET resume_path=$1, resume_score=$2, ai_resume_feedback=$3, status=$4, updated_at=NOW() WHERE id=$5`,
//             [req.file.path, aiData.score, JSON.stringify(aiData), newStatus, req.params.appId]
//         );
//         res.json({ score: aiData.score, status: newStatus, feedback: aiData });
//     } catch (err) { next(err); }
// });
// POST /api/candidate/applications/:appId/resume
router.post("/applications/:appId/resume", upload.single("resume"), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const jobRes = await pool.query(
            `SELECT j.* FROM jobs j JOIN applications a ON a.job_id=j.id WHERE a.id=$1`,
            [req.params.appId]
        );
        const candRes = await pool.query("SELECT * FROM candidates WHERE user_id=$1", [req.user.id]);
        const job = jobRes.rows[0];
        const cand = candRes.rows[0];

        // ── Extract resume text ──────────────────────────────────────────────
        let resumeText = "";
        const ext = path.extname(req.file.originalname).toLowerCase();
        try {
            if (ext === ".pdf") {
                const pdfParse = require("pdf-parse");
                const dataBuffer = fs.readFileSync(req.file.path);
                const pdfData = await pdfParse(dataBuffer);
                resumeText = pdfData.text || "";
            } else if (ext === ".docx" || ext === ".doc") {
                const mammoth = require("mammoth");
                const result = await mammoth.extractRawText({ path: req.file.path });
                resumeText = result.value || "";
            }
        } catch (parseErr) {
            console.warn("Resume parse failed, using profile data only:", parseErr.message);
        }

        // ── LLM Skill matching using Groq API ────────────────────────────────
        const jobSkills = Array.isArray(job.skills) ? job.skills : [];
        const candSkills = Array.isArray(cand.skills) ? cand.skills : [];
        
        let aiData = {
            score: 0,
            recommendation: "reject",
            summary: "Analysis failed.",
            strengths: [],
            weaknesses: [],
            skill_gaps: jobSkills,
            skill_matches: [],
        };

        try {
            const prompt = `You are an expert technical recruiter AI. Analyze the candidate's resume and profile against the job description.
            
Job Title: ${job.title || "N/A"}
Job Description: ${job.description || "N/A"}
Required Skills: ${jobSkills.join(", ")}

Candidate Experience: ${cand.experience_years || 0} years
Candidate Profile Skills: ${candSkills.join(", ")}

Candidate Resume Text:
${resumeText.substring(0, 4000)}

Evaluate the candidate and return ONLY a JSON object with the following structure:
{
  "score": <number 0-100 based on fit>,
  "recommendation": <"shortlist" if score >= 50, else "reject">,
  "summary": "<1-2 sentence justification>",
  "strengths": [<array of string strengths>],
  "weaknesses": [<array of string weaknesses>],
  "skill_gaps": [<array of missing skills from required skills>],
  "skill_matches": [<array of matched skills from required skills>]
}`;

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                aiData = JSON.parse(content);
            } else {
                console.error("Groq API error:", await response.text());
                aiData.summary = "AI analysis temporarily unavailable. Basic profile match applied.";
                aiData.score = candSkills.length > 0 ? 50 : 20; 
                aiData.recommendation = aiData.score >= 50 ? "shortlist" : "reject";
            }
        } catch (error) {
            console.error("Groq API error:", error.message);
            aiData.summary = "AI analysis failed due to server error.";
        }

        const newStatus = aiData.recommendation === "reject" ? "rejected" : "resume_reviewed";

        await pool.query(
            `UPDATE applications
             SET resume_path=$1, resume_score=$2, ai_resume_feedback=$3, status=$4, updated_at=NOW()
             WHERE id=$5`,
            [req.file.path, aiData.score, JSON.stringify(aiData), newStatus, req.params.appId]
        );

        res.json({ score: aiData.score, status: newStatus, feedback: aiData });
    } catch (err) { next(err); }
});
// GET /api/candidate/applications
router.get("/applications", async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT a.*, j.title AS job_title, j.location, j.job_type, c.company_name,
               j.resume_results_published, j.test_results_published, j.results_published,
               iss.id AS interview_session_id, iss.status AS interview_session_status,
               sl.scheduled_at, sl.duration_minutes,
               u_iv.name AS interviewer_name
             FROM applications a
             JOIN jobs j ON j.id=a.job_id
             JOIN companies c ON c.id=j.company_id
             LEFT JOIN interview_sessions iss ON iss.application_id=a.id
             LEFT JOIN interview_slots sl ON sl.id=iss.slot_id
             LEFT JOIN interviewers iv ON iv.id=iss.interviewer_id
             LEFT JOIN users u_iv ON u_iv.id=iv.user_id
             WHERE a.candidate_id=$1 ORDER BY a.created_at DESC`, [req.user.id]
        );
        res.json(rows);
    } catch (err) { next(err); }
});



// GET /api/candidate/profile
router.get("/profile", async (req, res, next) => {
    try {
        const { rows } = await pool.query(`SELECT u.name, u.email, c.* FROM users u JOIN candidates c ON c.user_id=u.id WHERE u.id=$1`, [req.user.id]);
        res.json(rows[0]);
    } catch (err) { next(err); }
});

// PUT /api/candidate/profile
router.put("/profile", async (req, res, next) => {
    try {
        const { phone, skills, experienceYears, education, linkedinUrl, githubUrl } = req.body;
        const { rows } = await pool.query(
            `UPDATE candidates SET phone=COALESCE($1,phone), skills=COALESCE($2,skills), experience_years=COALESCE($3,experience_years),
         education=COALESCE($4,education), linkedin_url=COALESCE($5,linkedin_url), github_url=COALESCE($6,github_url), updated_at=NOW()
       WHERE user_id=$7 RETURNING *`, [phone, skills, experienceYears, education, linkedinUrl, githubUrl, req.user.id]
        );
        res.json(rows[0]);
    } catch (err) { next(err); }
});

export default router;