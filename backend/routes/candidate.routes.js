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

        // ── Skill matching ───────────────────────────────────────────────────
        const jobSkills = Array.isArray(job.skills) ? job.skills : [];
        const candSkills = Array.isArray(cand.skills) ? cand.skills : [];

        /**
         * Normalize a skill string for comparison:
         * "React.js" → "reactjs", "Node JS" → "nodejs", "C++" → "c"
         * Keeps only alphanumeric so variations collapse to the same token.
         */
        const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

        /**
         * Build a rich token set from everything we know about the candidate:
         *  - every whitespace-separated word in the resume (normalized)
         *  - every word in each profile skill entry (normalized)
         *  - the entire normalized skill string itself (e.g. "nodejs")
         */
        const candidateTokens = new Set();

        const addToTokens = (text) => {
            // raw words (handles "React.js" → ["react", "js"])
            text.toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter(t => t.length > 1)
                .forEach(t => candidateTokens.add(t));

            // fully-normalized form (handles "React.js" → "reactjs")
            const norm = normalize(text);
            if (norm.length > 1) candidateTokens.add(norm);
        };

        // Add resume text words
        if (resumeText) addToTokens(resumeText);

        // Add every candidate profile skill (both as a phrase and word-by-word)
        for (const skill of candSkills) {
            addToTokens(skill);
        }

        /**
         * Match a single job skill against the candidate token set.
         * Strategy (in order of confidence):
         *  1. Exact normalized match         → "reactjs" in tokens
         *  2. All words of skill present     → "machine" AND "learning" in tokens
         *  3. Any significant word matches   → "react" found, skill is "React.js"
         */
        const skillMatches = (jobSkill) => {
            const norm = normalize(jobSkill);

            // 1. Full normalized form
            if (candidateTokens.has(norm)) return true;

            // Split skill into individual meaningful words
            const skillWords = jobSkill
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter(w => w.length > 1);

            if (skillWords.length === 0) return false;

            // 2. Every word of the skill is present
            if (skillWords.every(w => candidateTokens.has(w))) return true;

            // 3. Partial/abbreviation: resume token starts with skill's first meaningful word
            //    e.g. job needs "postgres", resume has "postgresql"
            const firstWord = skillWords[0];
            if (firstWord.length >= 3) {
                for (const token of candidateTokens) {
                    if (token.startsWith(firstWord) || firstWord.startsWith(token)) {
                        return true;
                    }
                }
            }

            return false;
        };

        const matchedSkills = [];
        const missingSkills = [];

        for (const js of jobSkills) {
            (skillMatches(js) ? matchedSkills : missingSkills).push(js);
        }

        // ── Scoring ──────────────────────────────────────────────────────────
        const matchRatio = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 1;
        const expYears = Math.min(cand.experience_years || 0, 10); // cap at 10 yrs
        const skillScore = Math.round(matchRatio * 70);              // up to 70 pts
        const expScore = Math.round((expYears / 10) * 20);         // up to 20 pts
        const resumeBonus = resumeText.trim().length > 100 ? 10 : 0;  // 10 pts if resume parsed
        const score = Math.min(100, skillScore + expScore + resumeBonus);

        // Shortlist if ≥50% skills matched OR overall score ≥ 45
        const meetsSkillThreshold = jobSkills.length === 0 || matchRatio >= 0.5;
        const meetsScoreThreshold = score >= 45;
        const recommendation = (meetsSkillThreshold || meetsScoreThreshold) ? "shortlist" : "reject";

        const aiData = {
            score,
            recommendation,
            summary: resumeText
                ? `Matched ${matchedSkills.length} of ${jobSkills.length} required skills from resume + profile.`
                : `Resume could not be parsed; matched ${matchedSkills.length} of ${jobSkills.length} skills from profile.`,
            strengths: matchedSkills.slice(0, 3),
            weaknesses: missingSkills.slice(0, 2),
            skill_gaps: missingSkills,
            skill_matches: matchedSkills,
        };

        const newStatus = recommendation === "reject" ? "rejected" : "resume_reviewed";

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
               j.resume_results_published, j.test_results_published, j.results_published
             FROM applications a
             JOIN jobs j ON j.id=a.job_id
             JOIN companies c ON c.id=j.company_id
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