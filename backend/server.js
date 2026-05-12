// ============================================================
//  server.js  –  Entry point
// ============================================================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import testRoutes from "./routes/test.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { pool } from "./config/db.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ── Socket.IO ─────────────────────────────────────────────
export const io = new IOServer(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Candidate joins proctored test room
  socket.on("join_test", ({ applicationId, candidateId }) => {
    socket.join(`test_${applicationId}`);
    console.log(`Candidate ${candidateId} joined test room for app ${applicationId}`);
  });

  // Interviewer joins interview room
  socket.on("join_interview", ({ sessionId, role }) => {
    socket.join(`interview_${sessionId}`);
    console.log(`${role} joined interview room ${sessionId}`);
    socket.to(`interview_${sessionId}`).emit("peer_joined", { role });
  });

  // Real-time interview chat/events
  socket.on("interview_event", ({ sessionId, type, data }) => {
    socket.to(`interview_${sessionId}`).emit("interview_event", { type, data });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ── Global Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ─────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ── Routes ─────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/company", companyRoutes);
app.use("/candidate", candidateRoutes);
app.use("/test", testRoutes);
app.use("/interview", interviewRoutes);

// ── Health check ───────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// ── Error handler (last) ───────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 8006;

httpServer.listen(PORT, () =>
  console.log(`🚀  Server running on http://localhost:${PORT}`)
);