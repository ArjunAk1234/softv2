// ============================================================
//  interview.socket.js  –  Drop this into your socket server
//  (wherever you initialise socket.io — typically server.js
//   or a dedicated socket/index.js file)
// ============================================================
//
//  Usage:
//    import { registerInterviewSocket } from './interview.socket.js';
//    registerInterviewSocket(io);
//
// ============================================================

export function registerInterviewSocket(io) {

    io.on('connection', (socket) => {

        // ── join_interview ────────────────────────────────────────────────────────
        // Both roles (interviewer / candidate) emit this on mount.
        // KEY FIX: we must tell the NEWCOMER that a peer is already present
        // (peer_present), not just tell the existing members (peer_joined).
        // Without peer_present the interviewer never creates an offer when they
        // join after the candidate, leaving both sides stuck on "waiting".
        socket.on('join_interview', ({ sessionId, role }) => {
            const room = `interview_${sessionId}`;
            socket.join(room);

            // Store role on the socket so we can reference it in other handlers
            socket.data.role = role;
            socket.data.sessionId = sessionId;

            const clients = io.sockets.adapter.rooms.get(room);
            const peerCount = clients ? clients.size : 0;

            console.log(`[Interview] ${role} joined room ${room} — peers in room: ${peerCount}`);

            if (peerCount > 1) {
                // ── Notify EXISTING members that a new peer joined ─────────────────
                // (the newcomer's socket is already in the room, so we use
                //  socket.to() which broadcasts to everyone EXCEPT the sender)
                socket.to(room).emit('peer_joined', { role });

                // ── FIX: Notify the NEWCOMER that a peer is already present ────────
                // This triggers the interviewer to create an offer even when they
                // join AFTER the candidate — the missing piece that caused "waiting".
                socket.emit('peer_present', { role: 'other' });
            }
        });

        // ── interview_event ───────────────────────────────────────────────────────
        // Relay WebRTC signalling (offer / answer / ice) and chat messages
        // to everyone else in the room.
        socket.on('interview_event', ({ sessionId, type, data }) => {
            const room = `interview_${sessionId}`;
            // Broadcast to all OTHER sockets in the room
            socket.to(room).emit('interview_event', { type, data });
        });

        // ── end_interview ─────────────────────────────────────────────────────────
        // Interviewer submits score → kick the candidate out of the room.
        socket.on('end_interview', ({ sessionId }) => {
            const room = `interview_${sessionId}`;
            socket.to(room).emit('interview_ended');
            console.log(`[Interview] Session ${sessionId} ended by interviewer`);
        });

        // ── disconnect ────────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const { role, sessionId } = socket.data || {};
            if (sessionId) {
                const room = `interview_${sessionId}`;
                socket.to(room).emit('peer_left', { role });
                console.log(`[Interview] ${role} disconnected from ${room}`);
            }
        });

    });
}