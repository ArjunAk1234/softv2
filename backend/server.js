// // // // ============================================================
// // // //  server.js  –  Entry point
// // // // ============================================================
// // // import express from "express";
// // // import cors from "cors";
// // // import dotenv from "dotenv";
// // // import { createServer } from "http";
// // // import { Server as IOServer } from "socket.io";

// // // import authRoutes from "./routes/auth.routes.js";
// // // import companyRoutes from "./routes/company.routes.js";
// // // import candidateRoutes from "./routes/candidate.routes.js";
// // // import testRoutes from "./routes/test.routes.js";
// // // import interviewRoutes from "./routes/interview.routes.js";
// // // import { errorHandler } from "./middleware/error.middleware.js";
// // // import { pool } from "./config/db.js";

// // // dotenv.config();

// // // const app = express();
// // // const httpServer = createServer(app);

// // // // ── Socket.IO ─────────────────────────────────────────────
// // // export const io = new IOServer(httpServer, {
// // //   cors: { origin: "*" },
// // // });

// // // io.on("connection", (socket) => {
// // //   console.log("Socket connected:", socket.id);

// // //   // Candidate joins proctored test room
// // //   socket.on("join_test", ({ applicationId, candidateId }) => {
// // //     socket.join(`test_${applicationId}`);
// // //     console.log(`Candidate ${candidateId} joined test room for app ${applicationId}`);
// // //   });

// // //   // Both interviewer and candidate join interview room
// // //   socket.on("join_interview", ({ sessionId, role }) => {
// // //     const roomName = `interview_${sessionId}`;

// // //     // Check who's already in the room BEFORE joining
// // //     const existingRoom = io.sockets.adapter.rooms.get(roomName);
// // //     const existingCount = existingRoom ? existingRoom.size : 0;

// // //     // Now join
// // //     socket.join(roomName);
// // //     socket.data.interviewRole = role;
// // //     console.log(`${role} joined interview room ${sessionId} (existing: ${existingCount})`);

// // //     // Tell everyone already in the room about the new joiner
// // //     socket.to(roomName).emit("peer_joined", { role });

// // //     // Also tell the NEW joiner about everyone already in the room
// // //     // (critical when interviewer joins second — needs to know candidate is there)
// // //     if (existingCount > 0) {
// // //       existingRoom.forEach((sid) => {
// // //         const s = io.sockets.sockets.get(sid);
// // //         if (s && s.data.interviewRole) {
// // //           socket.emit("peer_joined", { role: s.data.interviewRole });
// // //         }
// // //       });
// // //     }
// // //   });

// // //   // Interviewer ends the session — broadcast to candidate
// // //   socket.on("end_interview", ({ sessionId }) => {
// // //     socket.to(`interview_${sessionId}`).emit("interview_ended");
// // //     console.log(`Interview room ${sessionId} ended by interviewer`);
// // //   });

// // //   // Real-time interview chat/events
// // //   socket.on("interview_event", ({ sessionId, type, data }) => {
// // //     socket.to(`interview_${sessionId}`).emit("interview_event", { type, data });
// // //   });

// // //   socket.on("disconnect", () => {
// // //     console.log("Socket disconnected:", socket.id);
// // //   });
// // // });

// // // // ── Global Middleware ───────────────────────────────────────
// // // app.use(cors());
// // // app.use(express.json());
// // // app.use(express.urlencoded({ extended: true }));

// // // // ── Static uploads ─────────────────────────────────────────
// // // app.use("/uploads", express.static("uploads"));

// // // // ── Routes ─────────────────────────────────────────────────
// // // app.use("/auth", authRoutes);
// // // app.use("/company", companyRoutes);
// // // app.use("/candidate", candidateRoutes);
// // // app.use("/test", testRoutes);
// // // app.use("/interview", interviewRoutes);

// // // // ── Health check ───────────────────────────────────────────
// // // app.get("/health", async (_req, res) => {
// // //   try {
// // //     await pool.query("SELECT 1");
// // //     res.json({ status: "ok", db: "connected" });
// // //   } catch {
// // //     res.status(500).json({ status: "error", db: "disconnected" });
// // //   }
// // // });

// // // // ── Error handler (last) ───────────────────────────────────
// // // app.use(errorHandler);

// // // // ── Start ──────────────────────────────────────────────────
// // // const PORT = process.env.PORT || 8006;

// // // httpServer.listen(PORT, () =>
// // //   console.log(`🚀  Server running on http://localhost:${PORT}`)
// // // );


// // // ============================================================
// // //  server.js  –  Entry point
// // // ============================================================
// // import express from "express";
// // import cors from "cors";
// // import dotenv from "dotenv";
// // import { createServer } from "http";
// // import { Server as IOServer } from "socket.io";

// // import authRoutes from "./routes/auth.routes.js";
// // import companyRoutes from "./routes/company.routes.js";
// // import candidateRoutes from "./routes/candidate.routes.js";
// // import testRoutes from "./routes/test.routes.js";
// // import interviewRoutes from "./routes/interview.routes.js";
// // import { errorHandler } from "./middleware/error.middleware.js";
// // import { pool } from "./config/db.js";

// // // ← REMOVED: import { registerInterviewSocket } from './interview.socket.js';
// // //   That created a second io.on("connection") handler, causing every event
// // //   to be processed twice and peer signals to fire with the wrong event name.

// // dotenv.config();

// // const app = express();
// // const httpServer = createServer(app);

// // // ── Socket.IO ──────────────────────────────────────────────────────────────
// // export const io = new IOServer(httpServer, {
// //   cors: { origin: "*" },
// // });

// // io.on("connection", (socket) => {
// //   console.log("Socket connected:", socket.id);

// //   socket.onAny((event, ...args) => {
// //     console.log(`[RAW] socket=${socket.id} event=${event}`, JSON.stringify(args));
// //   });
// //   // ── Proctored test room ──────────────────────────────────────────────────
// //   socket.on("join_test", ({ applicationId, candidateId }) => {
// //     socket.join(`test_${applicationId}`);
// //     console.log(`Candidate ${candidateId} joined test room for app ${applicationId}`);
// //   });

// //   // ── Interview room ───────────────────────────────────────────────────────
// //   socket.on("join_interview", ({ sessionId, role }) => {
// //     const room = `interview_${sessionId}`;

// //     // Snapshot who is already in the room BEFORE this socket joins
// //     const existingRoom = io.sockets.adapter.rooms.get(room);
// //     const existingCount = existingRoom ? existingRoom.size : 0;

// //     socket.join(room);
// //     socket.data.interviewRole = role;
// //     socket.data.sessionId = sessionId;

// //     console.log(`[Interview] ${role} joined room ${room} (peers already present: ${existingCount})`);

// //     if (existingCount === 0) {
// //       // First person in the room — nothing to signal yet
// //       return;
// //     }

// //     // ── Tell existing members a new peer has arrived ─────────────────────
// //     // (socket.to() excludes the sender, so only existing members get this)
// //     socket.to(room).emit("peer_joined", { role });

// //     // ── FIX: Tell the NEWCOMER that peers are already present ────────────
// //     // Without this, when the interviewer joins AFTER the candidate no offer
// //     // is ever created — both sides sit on "waiting" forever.
// //     // We emit "peer_present" (a distinct event) so InterviewRoom.jsx can
// //     // trigger createOffer() separately from the peer_joined path.
// //     existingRoom.forEach((sid) => {
// //       const existingSocket = io.sockets.sockets.get(sid);
// //       if (existingSocket && existingSocket.data.interviewRole) {
// //         socket.emit("peer_present", { role: existingSocket.data.interviewRole });
// //       }
// //     });
// //   });

// //   // ── WebRTC signalling + chat relay ───────────────────────────────────────
// //   // Forwards offer / answer / ice / chat to everyone else in the room.
// //   // socket.on("interview_event", ({ sessionId, type, data }) => {
// //   //   socket.to(`interview_${sessionId}`).emit("interview_event", { type, data });
// //   // });
// //   socket.on("interview_event", ({ sessionId, type, data }) => {
// //     const room = `interview_${sessionId}`;
// //     const members = io.sockets.adapter.rooms.get(room);
// //     console.log(`[relay] type=${type} room=${room} members=${members ? [...members].join(',') : 'EMPTY'} sender=${socket.id}`);
// //     socket.to(room).emit("interview_event", { type, data });
// //   });

// //   // ── Interviewer ends session → kick candidate ────────────────────────────
// //   socket.on("end_interview", ({ sessionId }) => {
// //     socket.to(`interview_${sessionId}`).emit("interview_ended");
// //     console.log(`[Interview] Room ${sessionId} ended by interviewer`);
// //   });

// //   // ── Disconnect ───────────────────────────────────────────────────────────
// //   socket.on("disconnect", () => {
// //     const { interviewRole, sessionId } = socket.data || {};
// //     if (sessionId) {
// //       socket.to(`interview_${sessionId}`).emit("peer_left", { role: interviewRole });
// //     }
// //     console.log("Socket disconnected:", socket.id);
// //   });
// // });

// // // ── Global Middleware ──────────────────────────────────────────────────────
// // app.use(cors());
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // // ── Static uploads ─────────────────────────────────────────────────────────
// // app.use("/uploads", express.static("uploads"));

// // // ── Routes ─────────────────────────────────────────────────────────────────
// // app.use("/auth", authRoutes);
// // app.use("/company", companyRoutes);
// // app.use("/candidate", candidateRoutes);
// // app.use("/test", testRoutes);
// // app.use("/interview", interviewRoutes);

// // // ── Health check ───────────────────────────────────────────────────────────
// // app.get("/health", async (_req, res) => {
// //   try {
// //     await pool.query("SELECT 1");
// //     res.json({ status: "ok", db: "connected" });
// //   } catch {
// //     res.status(500).json({ status: "error", db: "disconnected" });
// //   }
// // });

// // // ── Error handler (must be last) ───────────────────────────────────────────
// // app.use(errorHandler);

// // // ── Start ──────────────────────────────────────────────────────────────────
// // const PORT = process.env.PORT || 8006;
// // httpServer.listen(PORT, () =>
// //   console.log(`🚀  Server running on http://localhost:${PORT}`)
// // );
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { createServer } from "http";
// import { Server as IOServer } from "socket.io";

// import authRoutes from "./routes/auth.routes.js";
// import companyRoutes from "./routes/company.routes.js";
// import candidateRoutes from "./routes/candidate.routes.js";
// import testRoutes from "./routes/test.routes.js";
// import interviewRoutes from "./routes/interview.routes.js";
// import { errorHandler } from "./middleware/error.middleware.js";
// import { pool } from "./config/db.js";

// dotenv.config();

// const app = express();
// const httpServer = createServer(app);

// // ── Socket.IO ──────────────────────────────────────────────────────────────
// export const io = new IOServer(httpServer, {
//   cors: { origin: "*" },
// });

// io.on("connection", (socket) => {
//   console.log("Socket connected:", socket.id);

//   socket.onAny((event, ...args) => {
//     console.log(`[RAW] socket=${socket.id} event=${event}`, JSON.stringify(args));
//   });

//   // ── Proctored test room ──────────────────────────────────────────────────
//   socket.on("join_test", ({ applicationId, candidateId }) => {
//     socket.join(`test_${applicationId}`);
//     console.log(`Candidate ${candidateId} joined test room for app ${applicationId}`);
//   });

//   // ── Interview room ───────────────────────────────────────────────────────
//   socket.on("join_interview", ({ sessionId, role }) => {
//     console.log(`[join_interview] ← RECEIVED socket=${socket.id} sessionId=${sessionId} role=${role}`);
//     // ... rest of handler

//     // Snapshot who is already in the room BEFORE this socket joins
//     const existingRoom = io.sockets.adapter.rooms.get(room);
//     const existingCount = existingRoom ? existingRoom.size : 0;
//     const existingMembers = existingRoom ? [...existingRoom] : [];

//     socket.join(room);
//     socket.data.interviewRole = role;
//     socket.data.sessionId = sessionId;

//     // Confirm join worked
//     const newRoom = io.sockets.adapter.rooms.get(room);
//     console.log(
//       `[join_interview] socket=${socket.id} role=${role} room=${room} ` +
//       `peers_before=${existingCount} members_now=${newRoom ? [...newRoom].join(",") : "EMPTY"}`
//     );

//     if (existingCount === 0) {
//       // First person — nothing to signal yet
//       return;
//     }

//     // Tell existing members a new peer has arrived
//     socket.to(room).emit("peer_joined", { role });

//     // Tell the newcomer which peers are already present
//     existingMembers.forEach((sid) => {
//       const existingSocket = io.sockets.sockets.get(sid);
//       if (existingSocket && existingSocket.data.interviewRole) {
//         socket.emit("peer_present", { role: existingSocket.data.interviewRole });
//       }
//     });
//   });

//   // ── WebRTC signalling + chat relay ───────────────────────────────────────
//   socket.on("interview_event", ({ sessionId, type, data }) => {
//     const room = `interview_${sessionId}`;
//     const members = io.sockets.adapter.rooms.get(room);
//     console.log(
//       `[relay] type=${type} room=${room} ` +
//       `members=${members ? [...members].join(",") : "EMPTY"} sender=${socket.id}`
//     );

//     // If sender is not in the room (reconnect edge case), re-join them
//     if (!members || !members.has(socket.id)) {
//       console.warn(
//         `[relay] sender ${socket.id} is NOT in room ${room} — auto-rejoining as ${socket.data.interviewRole || "unknown"}`
//       );
//       socket.join(room);
//     }

//     socket.to(room).emit("interview_event", { type, data });
//   });

//   // ── Interviewer ends session → kick candidate ────────────────────────────
//   socket.on("end_interview", ({ sessionId }) => {
//     socket.to(`interview_${sessionId}`).emit("interview_ended");
//     console.log(`[Interview] Room ${sessionId} ended by interviewer`);
//   });

//   // ── Disconnect ───────────────────────────────────────────────────────────
//   socket.on("disconnect", () => {
//     const { interviewRole, sessionId } = socket.data || {};
//     if (sessionId) {
//       socket.to(`interview_${sessionId}`).emit("peer_left", { role: interviewRole });
//     }
//     console.log("Socket disconnected:", socket.id);
//   });
// });

// // ── Global Middleware ──────────────────────────────────────────────────────
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ── Static uploads ─────────────────────────────────────────────────────────
// app.use("/uploads", express.static("uploads"));

// // ── Routes ─────────────────────────────────────────────────────────────────
// app.use("/auth", authRoutes);
// app.use("/company", companyRoutes);
// app.use("/candidate", candidateRoutes);
// app.use("/test", testRoutes);
// app.use("/interview", interviewRoutes);

// // ── Health check ───────────────────────────────────────────────────────────
// app.get("/health", async (_req, res) => {
//   try {
//     await pool.query("SELECT 1");
//     res.json({ status: "ok", db: "connected" });
//   } catch {
//     res.status(500).json({ status: "error", db: "disconnected" });
//   }
// });

// // ── Error handler (must be last) ───────────────────────────────────────────
// app.use(errorHandler);

// // ── Start ──────────────────────────────────────────────────────────────────
// const PORT = process.env.PORT || 8006;
// httpServer.listen(PORT, () =>
//   console.log(`🚀  Server running on http://localhost:${PORT}`)
// );

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

// ── Socket.IO ──────────────────────────────────────────────────────────────
export const io = new IOServer(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.onAny((event, ...args) => {
    console.log(`[RAW] socket=${socket.id} event=${event}`, JSON.stringify(args));
  });

  // ── Proctored test room ────────────────────────────────────────────────
  socket.on("join_test", ({ applicationId, candidateId }) => {
    socket.join(`test_${applicationId}`);
    console.log(`Candidate ${candidateId} joined test room for app ${applicationId}`);
  });

  // ── Interview room ─────────────────────────────────────────────────────
  // socket.on("join_interview", ({ sessionId, role }) => {
  //   const room = `interview_${sessionId}`;

  //   const existingRoom = io.sockets.adapter.rooms.get(room);
  //   const existingCount = existingRoom ? existingRoom.size : 0;
  //   const existingMembers = existingRoom ? [...existingRoom] : [];

  //   socket.join(room);
  //   socket.data.interviewRole = role;
  //   socket.data.sessionId = sessionId;

  //   const newRoom = io.sockets.adapter.rooms.get(room);
  //   console.log(
  //     `[join_interview] socket=${socket.id} role=${role} room=${room} ` +
  //     `peers_before=${existingCount} members_now=${newRoom ? [...newRoom].join(",") : "EMPTY"}`
  //   );

  //   if (existingCount === 0) {
  //     return;
  //   }

  //   socket.to(room).emit("peer_joined", { role });

  //   existingMembers.forEach((sid) => {
  //     const existingSocket = io.sockets.sockets.get(sid);
  //     if (existingSocket && existingSocket.data.interviewRole) {
  //       socket.emit("peer_present", { role: existingSocket.data.interviewRole });
  //     }
  //   });
  // });
  socket.on("join_interview", ({ sessionId, role }) => {
    const room = `interview_${sessionId}`;

    // If this socket is already in this room, ignore duplicate join
    if (socket.rooms.has(room)) {
      console.log(`[join_interview] socket=${socket.id} already in ${room}, skipping`);
      return;
    }

    const existingRoom = io.sockets.adapter.rooms.get(room);
    const existingCount = existingRoom ? existingRoom.size : 0;
    const existingMembers = existingRoom ? [...existingRoom] : [];

    socket.join(room);
    socket.data.interviewRole = role;
    socket.data.sessionId = sessionId;

    const newRoom = io.sockets.adapter.rooms.get(room);
    console.log(
      `[join_interview] socket=${socket.id} role=${role} room=${room} ` +
      `peers_before=${existingCount} members_now=${newRoom ? [...newRoom].join(",") : "EMPTY"}`
    );

    if (existingCount === 0) return;

    socket.to(room).emit("peer_joined", { role });

    existingMembers.forEach((sid) => {
      const existingSocket = io.sockets.sockets.get(sid);
      if (existingSocket && existingSocket.data.interviewRole) {
        socket.emit("peer_present", { role: existingSocket.data.interviewRole });
      }
    });
  });
  // ── WebRTC signalling + chat relay ─────────────────────────────────────
  socket.on("interview_event", ({ sessionId, type, data }) => {
    const room = `interview_${sessionId}`;                          // ← defined first
    const members = io.sockets.adapter.rooms.get(room);

    console.log(
      `[relay] type=${type} room=${room} ` +
      `members=${members ? [...members].join(",") : "EMPTY"} sender=${socket.id}`
    );

    if (!members || !members.has(socket.id)) {
      console.warn(
        `[relay] sender ${socket.id} NOT in room ${room} — auto-rejoining as ${socket.data.interviewRole || "unknown"}`
      );
      socket.join(room);
    }

    socket.to(room).emit("interview_event", { type, data });
  });

  // ── Interviewer ends session ───────────────────────────────────────────
  socket.on("end_interview", ({ sessionId }) => {
    socket.to(`interview_${sessionId}`).emit("interview_ended");
    console.log(`[Interview] Room ${sessionId} ended by interviewer`);
  });

  // ── Disconnect ─────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const { interviewRole, sessionId } = socket.data || {};
    if (sessionId) {
      socket.to(`interview_${sessionId}`).emit("peer_left", { role: interviewRole });
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// ── Global Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ─────────────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/company", companyRoutes);
app.use("/candidate", candidateRoutes);
app.use("/test", testRoutes);
app.use("/interview", interviewRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// ── Error handler (must be last) ───────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8006;
httpServer.listen(PORT, () =>
  console.log(`🚀  Server running on http://localhost:${PORT}`)
);