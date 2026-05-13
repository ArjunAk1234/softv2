import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare,
  Send, Star, CheckCircle, Loader2, ChevronRight
} from 'lucide-react';

const API_BASE = 'http://localhost:8006';

/**
 * InterviewRoom
 * Props:
 *   session     – interview_session object { id, application_id, interviewer_id, slot_id, ... }
 *   role        – 'interviewer' | 'candidate'
 *   token       – JWT string
 *   candidateName – string
 *   interviewerName – string
 *   onLeave     – callback when leaving
 */
const InterviewRoom = ({ session, role, token, candidateName, interviewerName, onLeave }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [score, setScore] = useState(75);
  const [feedback, setFeedback] = useState('');
  const [scoring, setScoring] = useState(false);
  const [scoreDone, setScoreDone] = useState(false);
  const chatEndRef = useRef(null);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // WebRTC setup via Socket.IO signaling
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        console.warn('Camera/mic not available');
      }

      // Load socket.io dynamically
      if (!window.io) {
        await new Promise((res) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
          s.onload = res;
          document.body.appendChild(s);
        });
      }

      const socket = window.io('http://localhost:8006', { auth: { token } });
      socketRef.current = socket;

      const roomId = `interview_${session.id}`;

      socket.on('connect', () => {
        if (!mounted) return;
        socket.emit('join_interview', { sessionId: session.id, role });
        setConnecting(false);
      });

      // WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
      }

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        setConnected(true);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('interview_event', { sessionId: session.id, type: 'ice', data: e.candidate });
        }
      };

      socket.on('peer_joined', async ({ role: peerRole }) => {
        if (peerRole !== role) {
          // Initiator creates offer
          if (role === 'interviewer') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('interview_event', { sessionId: session.id, type: 'offer', data: offer });
          }
        }
      });

      socket.on('interview_event', async ({ type, data }) => {
        if (!mounted) return;
        if (type === 'offer' && role === 'candidate') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('interview_event', { sessionId: session.id, type: 'answer', data: answer });
        } else if (type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        } else if (type === 'ice') {
          await pc.addIceCandidate(new RTCIceCandidate(data)).catch(() => {});
        } else if (type === 'chat') {
          setMessages(m => [...m, data]);
        }
      });
    };

    start();

    return () => {
      mounted = false;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      peerRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [session.id, role, token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMic = () => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) { audio.enabled = !audio.enabled; setMicOn(m => !m); }
  };

  const toggleCam = () => {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) { video.enabled = !video.enabled; setCamOn(c => !c); }
  };

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    const msg = { from: role, text: msgInput.trim(), time: new Date().toLocaleTimeString() };
    socketRef.current?.emit('interview_event', { sessionId: session.id, type: 'chat', data: msg });
    setMessages(m => [...m, msg]);
    setMsgInput('');
  };

  const handleLeave = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    socketRef.current?.disconnect();
    if (onLeave) onLeave();
  };

  const submitScore = async () => {
    setScoring(true);
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: Number(score), feedback }),
      });
      if (res.ok) { setScoreDone(true); }
    } catch {}
    setScoring(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col text-white">
      {/* Top bar */}
      <div className="h-12 bg-gray-900 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-semibold">Interview Room</span>
          <span className="text-xs text-gray-400">
            {role === 'interviewer' ? `with ${candidateName}` : `with ${interviewerName}`}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-gray-300">{formatTime(elapsed)}</span>
          {connecting && <span className="text-xs text-yellow-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Connecting…</span>}
          {connected && <span className="text-xs text-green-400">● Connected</span>}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* Remote (main) */}
        <video ref={remoteVideoRef} autoPlay playsInline
          className="w-full h-full object-cover"
          style={{ display: connected ? 'block' : 'none' }} />
        {!connected && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Waiting for {role === 'interviewer' ? 'candidate' : 'interviewer'} to join…</p>
          </div>
        )}

        {/* Local (pip) */}
        <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-1 left-1 text-[10px] text-white/60 bg-black/50 px-1 rounded">You</div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-gray-900/95 flex flex-col border-l border-gray-800">
            <div className="p-3 border-b border-gray-800 text-sm font-semibold">Chat</div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.from === role ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-1.5 rounded-xl text-sm max-w-[90%] ${m.from === role ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    {m.text}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-0.5">{m.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message…"
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none" />
              <button onClick={sendMessage} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Score form (interviewer only) */}
        {showScoreForm && role === 'interviewer' && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
            {scoreDone ? (
              <div className="bg-gray-900 rounded-2xl p-8 text-center max-w-sm w-full">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Score Submitted!</h3>
                <p className="text-gray-400 mb-6">Interview score: <span className="text-green-400 font-bold">{score}/100</span></p>
                <button onClick={handleLeave} className="w-full py-3 bg-gray-700 rounded-xl font-bold hover:bg-gray-600 transition-colors">
                  Leave Room
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Submit Interview Score</h3>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Score: {score}/100</label>
                  <input type="range" min={0} max={100} value={score} onChange={e => setScore(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-500" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span><span>Excellent</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Feedback</label>
                  <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
                    placeholder="Notes about the candidate's performance…"
                    className="w-full mt-1 bg-gray-800 rounded-xl p-3 text-sm outline-none resize-none border border-gray-700 focus:border-blue-500" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowScoreForm(false)} className="flex-1 py-2.5 bg-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-600">Cancel</button>
                  <button onClick={submitScore} disabled={scoring} className="flex-1 py-2.5 bg-green-600 rounded-xl text-sm font-bold hover:bg-green-500 disabled:opacity-60 flex items-center justify-center gap-2">
                    {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {scoring ? 'Submitting…' : 'Submit Score'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="h-20 bg-gray-900 flex items-center justify-center gap-4 flex-shrink-0">
        <button onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}>
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-500'}`}>
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button onClick={() => setShowChat(c => !c)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors relative ${showChat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
          <MessageSquare className="w-5 h-5" />
          {messages.length > 0 && !showChat && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">{messages.length}</span>
          )}
        </button>
        {role === 'interviewer' && (
          <button onClick={() => setShowScoreForm(true)}
            className="px-5 h-12 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm flex items-center gap-2 transition-colors">
            <Star className="w-4 h-4" /> Score
          </button>
        )}
        <button onClick={handleLeave}
          className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors">
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;
