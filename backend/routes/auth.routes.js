import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

const signToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
    try {
        const { name, email, password, role, companyName } = req.body;

        if (!["candidate", "company", "interviewer"].includes(role))
            return res.status(400).json({ error: "role must be candidate, company, or interviewer" });

        const hash = await bcrypt.hash(password, 12);

        const { rows } = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role",
            [name, email, hash, role]
        );
        const user = rows[0];

        if (role === "company") {
            await pool.query(
                "INSERT INTO companies (user_id, company_name) VALUES ($1,$2)",
                [user.id, companyName || name]
            );
        }

        if (role === "candidate") {
            await pool.query("INSERT INTO candidates (user_id) VALUES ($1)", [user.id]);
        }

        res.status(201).json({ token: signToken(user), user });
    } catch (err) {
        if (err.code === "23505")
            return res.status(409).json({ error: "Email already registered" });
        next(err);
    }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password)))
            return res.status(401).json({ error: "Invalid credentials" });

        res.json({
            token: signToken(user),
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) { next(err); }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            "SELECT id, name, email, role FROM users WHERE id=$1",
            [req.user.id]
        );
        res.json(rows[0]);
    } catch (err) { next(err); }
});

export default router;