// import React, { useEffect, useRef, useState } from 'react';
// import { motion } from 'framer-motion';
// import { io } from 'socket.io-client';
// import {
//   Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Send,
//   Star, CheckCircle, Loader2, XCircle, Clock
// } from 'lucide-react';

// const API_BASE = 'http://localhost:8006';

// export default function InterviewRoom({ session, role, token, candidateName, interviewerName, onLeave }) {
//   const localVideoRef  = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const pcRef          = useRef(null);
//   const socketRef      = useRef(null);
//   const localStreamRef = useRef(null);
//   const iceBuf         = useRef([]);   // buffer ICE until remoteDesc is set
//   const remoteSet      = useRef(false);

//   const [micOn,   setMicOn]   = useState(true);
//   const [camOn,   setCamOn]   = useState(true);
//   const [camErr,  setCamErr]  = useState(false);
//   const [status,  setStatus]  = useState('connecting'); // connecting | waiting | connected
//   const [msgs,    setMsgs]    = useState([]);
//   const [input,   setInput]   = useState('');
//   const [chat,    setChat]    = useState(false);
//   const [elapsed, setElapsed] = useState(0);

//   const [scoreForm, setScoreForm] = useState(false);
//   const [score,     setScore]     = useState(75);
//   const [feedback,  setFeedback]  = useState('');
//   const [scoring,   setScoring]   = useState(false);
//   const [scored,    setScored]    = useState(false);
//   const [ended,     setEnded]     = useState(false);   // candidate kicked

//   const chatEnd = useRef(null);
//   const alive   = useRef(true);
//   const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

//   // Timer
//   useEffect(() => {
//     const t = setInterval(() => setElapsed(e => e + 1), 1000);
//     return () => { alive.current = false; clearInterval(t); };
//   }, []);

//   useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

//   const stopAll = () => {
//     localStreamRef.current?.getTracks().forEach(t => t.stop());
//     pcRef.current?.close();
//     socketRef.current?.disconnect();
//   };

//   // ── Flush buffered ICE after remote desc is set ──────────────────────────────
//   const flushIce = async (pc) => {
//     for (const c of iceBuf.current) {
//       try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
//     }
//     iceBuf.current = [];
//   };

//   // ── Main setup ───────────────────────────────────────────────────────────────
//   useEffect(() => {
//     let pc;

//     const run = async () => {
//       // 1. Camera / mic
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         localStreamRef.current = stream;
//         if (localVideoRef.current) localVideoRef.current.srcObject = stream;
//       } catch {
//         setCamErr(true);
//       }

//       // 2. PeerConnection
//       pc = new RTCPeerConnection({
//         iceServers: [
//           { urls: 'stun:stun.l.google.com:19302' },
//           { urls: 'stun:stun1.l.google.com:19302' },
//         ],
//       });
//       pcRef.current = pc;

//       // Add local tracks (or transceivers so we can still receive remote)
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(t =>
//           pc.addTrack(t, localStreamRef.current)
//         );
//       } else {
//         pc.addTransceiver('video', { direction: 'recvonly' });
//         pc.addTransceiver('audio', { direction: 'recvonly' });
//       }

//       pc.ontrack = ({ streams, track }) => {
//         if (!alive.current) return;
//         const el = remoteVideoRef.current;
//         if (!el) return;
//         if (streams && streams[0]) {
//           el.srcObject = streams[0];
//         } else {
//           if (!el.srcObject) el.srcObject = new MediaStream();
//           el.srcObject.addTrack(track);
//         }
//         el.play().catch(() => {});
//         setStatus('connected');
//       };

//       pc.onicecandidate = ({ candidate }) => {
//         if (candidate) {
//           socketRef.current?.emit('interview_event', {
//             sessionId: session.id, type: 'ice', data: candidate,
//           });
//         }
//       };

//       pc.oniceconnectionstatechange = () => {
//         const s = pc.iceConnectionState;
//         if (s === 'connected' || s === 'completed') setStatus('connected');
//         if (s === 'failed') pc.restartIce?.();
//       };

//       // 3. Socket — use proper npm import, no CDN
//       const socket = io('http://localhost:8006', { transports: ['websocket', 'polling'] });
//       socketRef.current = socket;

//       socket.on('connect', () => {
//         if (!alive.current) return;
//         console.log('[Socket] connected', socket.id, 'as', role);
//         socket.emit('join_interview', { sessionId: session.id, role });
//         setStatus('waiting');
//       });

//       socket.on('connect_error', (e) => console.error('[Socket] connect_error', e.message));

//       // Other peer joined → interviewer makes offer
//       socket.on('peer_joined', async ({ role: peerRole }) => {
//         if (!alive.current) return;
//         console.log('[Signaling] peer_joined:', peerRole);
//         if (role !== 'interviewer') return;   // only interviewer initiates
//         try {
//           const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
//           await pc.setLocalDescription(offer);
//           socket.emit('interview_event', { sessionId: session.id, type: 'offer', data: offer });
//         } catch (e) { console.error('offer error', e); }
//       });

//       // Interviewer ended → kick candidate
//       socket.on('interview_ended', () => {
//         if (!alive.current) return;
//         stopAll();
//         setEnded(true);
//       });

//       // WebRTC signalling + chat
//       socket.on('interview_event', async ({ type, data }) => {
//         if (!alive.current) return;

//         if (type === 'offer' && role === 'candidate') {
//           try {
//             await pc.setRemoteDescription(new RTCSessionDescription(data));
//             remoteSet.current = true;
//             await flushIce(pc);
//             const answer = await pc.createAnswer();
//             await pc.setLocalDescription(answer);
//             socket.emit('interview_event', { sessionId: session.id, type: 'answer', data: answer });
//           } catch (e) { console.error('answer error', e); }

//         } else if (type === 'answer' && role === 'interviewer') {
//           try {
//             await pc.setRemoteDescription(new RTCSessionDescription(data));
//             remoteSet.current = true;
//             await flushIce(pc);
//           } catch (e) { console.error('remoteDesc error', e); }

//         } else if (type === 'ice') {
//           if (remoteSet.current) {
//             try { await pc.addIceCandidate(new RTCIceCandidate(data)); } catch {}
//           } else {
//             iceBuf.current.push(data);
//           }

//         } else if (type === 'chat') {
//           setMsgs(m => [...m, data]);
//         }
//       });
//     };

//     run();
//     return () => { alive.current = false; stopAll(); };
//   }, []); // run once

//   // ── Helpers ──────────────────────────────────────────────────────────────────
//   const toggleMic = () => {
//     const t = localStreamRef.current?.getAudioTracks()[0];
//     if (t) { t.enabled = !t.enabled; setMicOn(x => !x); }
//   };
//   const toggleCam = () => {
//     const t = localStreamRef.current?.getVideoTracks()[0];
//     if (t) { t.enabled = !t.enabled; setCamOn(x => !x); }
//   };
//   const send = () => {
//     if (!input.trim()) return;
//     const msg = { from: role, text: input.trim(), time: new Date().toLocaleTimeString() };
//     socketRef.current?.emit('interview_event', { sessionId: session.id, type: 'chat', data: msg });
//     setMsgs(m => [...m, msg]);
//     setInput('');
//   };
//   const leave = () => { stopAll(); onLeave?.(); };

//   const submitScore = async () => {
//     setScoring(true);
//     try {
//       const res = await fetch(`${API_BASE}/interview/sessions/${session.id}/complete`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ score: Number(score), feedback }),
//       });
//       if (res.ok) {
//         setScored(true);
//         socketRef.current?.emit('end_interview', { sessionId: session.id });
//       }
//     } catch {}
//     setScoring(false);
//   };

//   // ── Candidate kicked screen ──────────────────────────────────────────────────
//   if (ended) {
//     return (
//       <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center text-white">
//         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md p-8">
//           <XCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
//           <h2 className="text-2xl font-bold mb-2">Interview Completed</h2>
//           <p className="text-gray-400 mb-4">The interviewer has ended and scored this session.</p>
//           <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-sm text-yellow-300">
//             ⏳ Scores are being evaluated. The company will publish results shortly.
//           </div>
//           <button onClick={() => onLeave?.()} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold">
//             Back to Dashboard
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   // ── Main room ────────────────────────────────────────────────────────────────
//   return (
//     <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col text-white">
//       {/* Top bar */}
//       <div className="h-12 bg-gray-900 flex items-center justify-between px-4 flex-shrink-0">
//         <div className="flex items-center gap-3">
//           <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
//           <span className="text-sm font-semibold">Interview Room</span>
//           <span className="text-xs text-gray-400">
//             {role === 'interviewer' ? `with ${candidateName}` : `with ${interviewerName}`}
//           </span>
//         </div>
//         <div className="flex items-center gap-4">
//           <span className="font-mono text-sm text-gray-300">{fmt(elapsed)}</span>
//           {status === 'connecting' && <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Connecting…</span>}
//           {status === 'waiting'    && <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Waiting for other party…</span>}
//           {status === 'connected'  && <span className="text-xs text-green-400">● Connected</span>}
//           {camErr && <span className="text-xs text-orange-400">⚠ No camera</span>}
//         </div>
//       </div>

//       {/* Video area */}
//       <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
//         {/* Remote video — always in DOM */}
//         <video ref={remoteVideoRef} autoPlay playsInline
//           className="w-full h-full object-cover"
//           style={{ display: status === 'connected' ? 'block' : 'none' }}
//         />
//         {status !== 'connected' && (
//           <div className="text-center pointer-events-none">
//             <Loader2 className="w-12 h-12 animate-spin text-gray-600 mx-auto mb-3" />
//             <p className="text-gray-400 text-sm">
//               Waiting for {role === 'interviewer' ? 'candidate' : 'interviewer'} to join…
//             </p>
//           </div>
//         )}

//         {/* Local PiP */}
//         <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
//           {camErr
//             ? <div className="w-full h-full flex items-center justify-center"><VideoOff className="w-8 h-8 text-gray-600" /></div>
//             : <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
//           }
//           <div className="absolute bottom-1 left-1 text-[10px] text-white/60 bg-black/50 px-1 rounded">You</div>
//         </div>

//         {/* Chat */}
//         {chat && (
//           <div className="absolute top-0 right-0 bottom-0 w-72 bg-gray-900/95 flex flex-col border-l border-gray-800">
//             <div className="p-3 border-b border-gray-800 text-sm font-semibold">Chat</div>
//             <div className="flex-1 overflow-y-auto p-3 space-y-2">
//               {msgs.map((m, i) => (
//                 <div key={i} className={`flex flex-col ${m.from === role ? 'items-end' : 'items-start'}`}>
//                   <div className={`px-3 py-1.5 rounded-xl text-sm max-w-[90%] ${m.from === role ? 'bg-blue-600' : 'bg-gray-700'}`}>{m.text}</div>
//                   <span className="text-[10px] text-gray-500 mt-0.5">{m.time}</span>
//                 </div>
//               ))}
//               <div ref={chatEnd} />
//             </div>
//             <div className="p-3 border-t border-gray-800 flex gap-2">
//               <input value={input} onChange={e => setInput(e.target.value)}
//                 onKeyDown={e => e.key === 'Enter' && send()}
//                 placeholder="Type a message…"
//                 className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none" />
//               <button onClick={send} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500"><Send className="w-4 h-4" /></button>
//             </div>
//           </div>
//         )}

//         {/* Score form (interviewer) */}
//         {scoreForm && role === 'interviewer' && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//             className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
//             {scored ? (
//               <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-sm w-full">
//                 <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
//                 <h3 className="text-xl font-bold mb-2">Score Submitted!</h3>
//                 <p className="text-gray-400 mb-6">Score: <span className="text-green-400 font-bold">{score}/100</span></p>
//                 <button onClick={leave} className="w-full py-3 bg-gray-700 rounded-xl font-bold hover:bg-gray-600">Leave Room</button>
//               </div>
//             ) : (
//               <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full space-y-4">
//                 <h3 className="text-lg font-bold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Submit Score</h3>
//                 <p className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">⚠️ This will end the session for the candidate.</p>
//                 <div>
//                   <label className="text-xs text-gray-400 uppercase tracking-wider">Score: {score}/100</label>
//                   <input type="range" min={0} max={100} value={score}
//                     onChange={e => setScore(Number(e.target.value))} className="w-full mt-2 accent-blue-500" />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Poor</span><span>Excellent</span></div>
//                 </div>
//                 <textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}
//                   placeholder="Feedback about performance…"
//                   className="w-full bg-gray-800 rounded-xl p-3 text-sm outline-none resize-none border border-gray-700 focus:border-blue-500" />
//                 <div className="flex gap-3">
//                   <button onClick={() => setScoreForm(false)} className="flex-1 py-2.5 bg-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-600">Cancel</button>
//                   <button onClick={submitScore} disabled={scoring}
//                     className="flex-1 py-2.5 bg-green-600 rounded-xl text-sm font-bold hover:bg-green-500 disabled:opacity-60 flex items-center justify-center gap-2">
//                     {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
//                     {scoring ? 'Submitting…' : 'Submit & End'}
//                   </button>
//                 </div>
//               </div>
//             )}
//           </motion.div>
//         )}
//       </div>

//       {/* Controls */}
//       <div className="h-20 bg-gray-900 flex items-center justify-center gap-4 flex-shrink-0">
//         <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}>
//           {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
//         </button>
//         <button onClick={toggleCam} className={`w-12 h-12 rounded-full flex items-center justify-center ${camOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}>
//           {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
//         </button>
//         <button onClick={() => setChat(c => !c)} className={`w-12 h-12 rounded-full flex items-center justify-center relative ${chat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
//           <MessageSquare className="w-5 h-5" />
//           {msgs.length > 0 && !chat && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">{msgs.length}</span>}
//         </button>
//         {role === 'interviewer' && (
//           <button onClick={() => setScoreForm(true)}
//             className="px-5 h-12 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm flex items-center gap-2">
//             <Star className="w-4 h-4" /> Score & End
//           </button>
//         )}
//         <button onClick={leave} className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center">
//           <PhoneOff className="w-5 h-5" />
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Send,
  Star, CheckCircle, Loader2, XCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:8006';

export default function InterviewRoom({ session, role, token, candidateName, interviewerName, onLeave }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceBuf = useRef([]);
  const remoteSet = useRef(false);
  const offerCreating = useRef(false); // guard against double offer creation

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [camErr, setCamErr] = useState(false);
  const [status, setStatus] = useState('connecting');
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [scoreForm, setScoreForm] = useState(false);
  const [score, setScore] = useState(75);
  const [feedback, setFeedback] = useState('');
  const [scoring, setScoring] = useState(false);
  const [scored, setScored] = useState(false);
  const [ended, setEnded] = useState(false);

  const chatEnd = useRef(null);
  const alive = useRef(true);
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { alive.current = false; clearInterval(t); };
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const stopAll = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    socketRef.current?.disconnect();
  };

  // ── Flush buffered ICE after remote desc is set ────────────────────────────
  const flushIce = async (pc) => {
    for (const c of iceBuf.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { }
    }
    iceBuf.current = [];
  };

  // ── Create and send offer (interviewer only) ───────────────────────────────
  // Extracted into a reusable function so both peer_joined and peer_present
  // can call it without duplicating logic or creating double offers.
  const createOffer = async (pc, socket) => {
    if (role !== 'interviewer') return;
    if (offerCreating.current) return; // already in progress
    offerCreating.current = true;
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socket.emit('interview_event', { sessionId: session.id, type: 'offer', data: offer });
    } catch (e) {
      console.error('[WebRTC] offer error', e);
    } finally {
      offerCreating.current = false;
    }
  };

  // ── Main setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.id) {
      console.error('[InterviewRoom] no session.id, aborting');
      return;
    }

    let pc;
    alive.current = true; // reset on mount

    const run = async () => {
      console.log('[InterviewRoom] run() started, session=', session, 'role=', role);
      // 1. Camera / mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        setCamErr(true);
      }

      // 2. PeerConnection
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // ── TURN server (required for symmetric NAT / mobile / office networks) ──
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
        ],
      });
      pcRef.current = pc;

      // Add local tracks (or transceivers so we can still receive remote)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t =>
          pc.addTrack(t, localStreamRef.current)
        );
      } else {
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      pc.ontrack = ({ streams, track }) => {
        if (!alive.current) return;
        const el = remoteVideoRef.current;
        if (!el) return;
        if (streams && streams[0]) {
          el.srcObject = streams[0];
        } else {
          if (!el.srcObject) el.srcObject = new MediaStream();
          el.srcObject.addTrack(track);
        }
        el.play().catch(() => { });
        setStatus('connected');
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socketRef.current?.emit('interview_event', {
            sessionId: session.id, type: 'ice', data: candidate,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        console.log('[ICE] state:', s);
        if (s === 'connected' || s === 'completed') setStatus('connected');
        if (s === 'failed') {
          console.warn('[ICE] failed — restarting ICE');
          pc.restartIce?.();
        }
        if (s === 'disconnected') setStatus('waiting');
      };

      // 3. Socket
      // const socket = io('http://localhost:8006', {
      //   transports: ['websocket', 'polling'],
      //   reconnectionAttempts: 5,
      // });
      // socketRef.current = socket;

      // socket.on('connect', () => {
      //   if (!alive.current) return;
      //   console.log('[Socket] connected', socket.id, 'as', role);
      //   socket.emit('join_interview', { sessionId: session.id, role });
      //   setStatus('waiting');
      // });

      // socket.on('connect_error', (e) => console.error('[Socket] connect_error', e.message));

      console.log('[InterviewRoom] setting up socket for session.id=', session?.id);
      const socket = io('http://localhost:8006', {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
      });
      socketRef.current = socket;
      console.log('[InterviewRoom] socket created, connected=', socket.connected, 'id=', socket.id);

      if (socket.connected) {
        console.log('[InterviewRoom] already connected, joining immediately');
        socket.emit('join_interview', { sessionId: session.id, role });
      }

      socket.on('connect', () => {
        console.log('[InterviewRoom] connect fired, socket.id=', socket.id, 'session.id=', session?.id);
        socket.emit('join_interview', { sessionId: session.id, role });
        setStatus('waiting');
      });

      socket.io.on('reconnect', () => {
        console.log('[InterviewRoom] manager reconnect fired');
        socket.emit('join_interview', { sessionId: session.id, role });
      });
      const joinRoom = () => {
        if (!session?.id) {
          console.error('[Socket] session.id missing, cannot join room');
          return;
        }
        console.log('[Socket] emitting join_interview, session=', session.id, 'role=', role, 'socket=', socket.id);
        socket.emit('join_interview', { sessionId: session.id, role });
      };

      // join on every connect AND reconnect
      socket.on('connect', () => {
        if (!alive.current) return;
        console.log('[Socket] connected', socket.id);
        joinRoom();
        setStatus('waiting');
      });

      // v4: reconnect is on the manager
      socket.io.on('reconnect', () => {
        if (!alive.current) return;
        console.log('[Socket] manager reconnected');
        joinRoom();
      });

      // belt-and-suspenders: if already connected at mount time
      if (socket.connected) {
        joinRoom();
      }
      // ── FIX: peer_joined fires when the OTHER party joins AFTER you ──────────
      // Interviewer sees this when candidate joins later.
      socket.on('peer_joined', async ({ role: peerRole }) => {
        if (!alive.current) return;
        console.log('[Signaling] peer_joined:', peerRole);
        await createOffer(pc, socket);
      });

      // ── FIX: peer_present fires when YOU join and the other party is already there ──
      // This is the missing event. Without it, if the candidate joins first and
      // THEN the interviewer joins, nobody creates an offer because peer_joined
      // only fires for existing members, not for the newcomer.
      socket.on('peer_present', async ({ role: peerRole }) => {
        if (!alive.current) return;
        console.log('[Signaling] peer_present (I joined late):', peerRole);
        await createOffer(pc, socket);
      });

      // Interviewer ended session → kick candidate
      socket.on('interview_ended', () => {
        if (!alive.current) return;
        stopAll();
        setEnded(true);
      });

      // WebRTC signalling + chat
      socket.on('interview_event', async ({ type, data }) => {
        if (!alive.current) return;

        if (type === 'offer' && role === 'candidate') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            remoteSet.current = true;
            await flushIce(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('interview_event', { sessionId: session.id, type: 'answer', data: answer });
          } catch (e) { console.error('[WebRTC] answer error', e); }

        } else if (type === 'answer' && role === 'interviewer') {
          try {
            if (pc.signalingState !== 'have-local-offer') {
              console.warn('[WebRTC] unexpected answer in state:', pc.signalingState);
              return;
            }
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            remoteSet.current = true;
            await flushIce(pc);
          } catch (e) { console.error('[WebRTC] remoteDesc error', e); }

        } else if (type === 'ice') {
          if (remoteSet.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(data)); } catch { }
          } else {
            iceBuf.current.push(data);
          }

        } else if (type === 'chat') {
          setMsgs(m => [...m, data]);
        }
      });
    };

    run();
    return () => {
      alive.current = false;
      stopAll();
    };
  }, []);// run once

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleMic = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMicOn(x => !x); }
  };
  const toggleCam = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setCamOn(x => !x); }
  };
  const send = () => {
    if (!input.trim()) return;
    const msg = { from: role, text: input.trim(), time: new Date().toLocaleTimeString() };
    socketRef.current?.emit('interview_event', { sessionId: session.id, type: 'chat', data: msg });
    setMsgs(m => [...m, msg]);
    setInput('');
  };
  const leave = () => { stopAll(); onLeave?.(); };

  const submitScore = async () => {
    setScoring(true);
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: Number(score), feedback }),
      });
      if (res.ok) {
        setScored(true);
        socketRef.current?.emit('end_interview', { sessionId: session.id });
      }
    } catch (e) {
      console.error('[Score] submit error', e);
    }
    setScoring(false);
  };

  // ── Candidate kicked screen ────────────────────────────────────────────────
  if (ended) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center text-white">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md p-8">
          <XCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Interview Completed</h2>
          <p className="text-gray-400 mb-4">The interviewer has ended and scored this session.</p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-sm text-yellow-300">
            ⏳ Scores are being evaluated. The company will publish results shortly.
          </div>
          <button onClick={() => onLeave?.()} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main room ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col text-white">
      {/* Top bar */}
      <div className="h-12 bg-gray-900 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span className="text-sm font-semibold">Interview Room</span>
          <span className="text-xs text-gray-400">
            {role === 'interviewer' ? `with ${candidateName}` : `with ${interviewerName}`}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-gray-300">{fmt(elapsed)}</span>
          {status === 'connecting' && <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Connecting…</span>}
          {status === 'waiting' && <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Waiting for other party…</span>}
          {status === 'connected' && <span className="text-xs text-green-400">● Connected</span>}
          {camErr && <span className="text-xs text-orange-400">⚠ No camera</span>}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* Remote video — always in DOM so srcObject assignment works */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ display: status === 'connected' ? 'block' : 'none' }}
        />
        {status !== 'connected' && (
          <div className="text-center pointer-events-none">
            <Loader2 className="w-12 h-12 animate-spin text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Waiting for {role === 'interviewer' ? 'candidate' : 'interviewer'} to join…
            </p>
          </div>
        )}

        {/* Local PiP */}
        <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
          {camErr
            ? <div className="w-full h-full flex items-center justify-center"><VideoOff className="w-8 h-8 text-gray-600" /></div>
            : <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          }
          <div className="absolute bottom-1 left-1 text-[10px] text-white/60 bg-black/50 px-1 rounded">You</div>
        </div>

        {/* Chat panel */}
        {chat && (
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-gray-900/95 flex flex-col border-l border-gray-800">
            <div className="p-3 border-b border-gray-800 text-sm font-semibold">Chat</div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {msgs.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.from === role ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-1.5 rounded-xl text-sm max-w-[90%] ${m.from === role ? 'bg-blue-600' : 'bg-gray-700'}`}>{m.text}</div>
                  <span className="text-[10px] text-gray-500 mt-0.5">{m.time}</span>
                </div>
              ))}
              <div ref={chatEnd} />
            </div>
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type a message…"
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <button onClick={send} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Score form (interviewer only) */}
        {scoreForm && role === 'interviewer' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
          >
            {scored ? (
              <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-sm w-full">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Score Submitted!</h3>
                <p className="text-gray-400 mb-6">Score: <span className="text-green-400 font-bold">{score}/100</span></p>
                <button onClick={leave} className="w-full py-3 bg-gray-700 rounded-xl font-bold hover:bg-gray-600">
                  Leave Room
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" /> Submit Score
                </h3>
                <p className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
                  ⚠️ This will end the session for the candidate.
                </p>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Score: {score}/100</label>
                  <input
                    type="range" min={0} max={100} value={score}
                    onChange={e => setScore(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span><span>Excellent</span>
                  </div>
                </div>
                <textarea
                  rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}
                  placeholder="Feedback about performance…"
                  className="w-full bg-gray-800 rounded-xl p-3 text-sm outline-none resize-none border border-gray-700 focus:border-blue-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setScoreForm(false)}
                    className="flex-1 py-2.5 bg-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitScore}
                    disabled={scoring}
                    className="flex-1 py-2.5 bg-green-600 rounded-xl text-sm font-bold hover:bg-green-500 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {scoring ? 'Submitting…' : 'Submit & End'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="h-20 bg-gray-900 flex items-center justify-center gap-4 flex-shrink-0">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${camOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setChat(c => !c)}
          className={`w-12 h-12 rounded-full flex items-center justify-center relative ${chat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          <MessageSquare className="w-5 h-5" />
          {msgs.length > 0 && !chat && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
              {msgs.length}
            </span>
          )}
        </button>
        {role === 'interviewer' && (
          <button
            onClick={() => setScoreForm(true)}
            className="px-5 h-12 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm flex items-center gap-2"
          >
            <Star className="w-4 h-4" /> Score & End
          </button>
        )}
        <button onClick={leave} className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}