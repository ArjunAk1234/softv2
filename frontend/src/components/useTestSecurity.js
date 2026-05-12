import { useEffect, useRef, useState, useCallback } from 'react';

const API_BASE = 'http://localhost:8006';

/**
 * useTestSecurity — enforces fullscreen, detects tab switches, face detection
 * @param {Object} options
 * @param {string} options.applicationId — for posting proctor events
 * @param {string} options.token — auth token
 * @param {boolean} options.enabled — whether to activate (false during results)
 * @param {function} options.onViolation — called with (type, count) on each event
 * @param {function} options.onAutoSubmit — called when violations exceed threshold
 */
export function useTestSecurity({
  applicationId,
  token,
  enabled = true,
  onViolation,
  onAutoSubmit,
  maxViolations = 5,
}) {
  const [violations, setViolations] = useState({
    tab_switch: 0,
    window_switch: 0,
    face_away: 0,
    multiple_faces: 0,
    fullscreen_exit: 0,
  });
  const [warnings, setWarnings] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const totalViolationsRef = useRef(0);

  const postProctoringEvent = useCallback(async (eventType, detail = {}) => {
    try {
      await fetch(`${API_BASE}/test/${applicationId}/proctor/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventType, detail }),
      });
    } catch (e) {
      console.warn('Failed to post proctor event', e);
    }
  }, [applicationId, token]);

  const recordViolation = useCallback((type, detail = {}) => {
    setViolations(prev => {
      const next = { ...prev, [type]: prev[type] + 1 };
      return next;
    });
    totalViolationsRef.current += 1;
    const warning = {
      id: Date.now(),
      type,
      message: getViolationMessage(type),
      timestamp: new Date().toLocaleTimeString(),
    };
    setWarnings(prev => [warning, ...prev].slice(0, 10));
    postProctoringEvent(type, detail);
    if (onViolation) onViolation(type, totalViolationsRef.current);
    if (totalViolationsRef.current >= maxViolations && onAutoSubmit) {
      onAutoSubmit();
    }
  }, [postProctoringEvent, onViolation, onAutoSubmit, maxViolations]);

  // ── Fullscreen management ────────────────────────────────────────────────
  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Request fullscreen immediately
    requestFullscreen();
  }, [enabled, requestFullscreen]);

  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen) {
        recordViolation('fullscreen_exit', { timestamp: new Date().toISOString() });
        // Re-request after short delay
        setTimeout(() => requestFullscreen(), 500);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, recordViolation, requestFullscreen]);

  // ── Tab / Visibility switch ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('tab_switch', { timestamp: new Date().toISOString() });
      }
    };

    const handleBlur = () => {
      // Only count window blur if not just switching to fullscreen dialog
      setTimeout(() => {
        if (!document.hidden && document.visibilityState === 'visible') {
          recordViolation('window_switch', { timestamp: new Date().toISOString() });
        }
      }, 100);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, recordViolation]);

  // ── Camera / Face detection ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraActive(true);
        startFaceMonitoring();
      } catch (e) {
        console.warn('Camera not available:', e.message);
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, [enabled]);

  const startFaceMonitoring = useCallback(() => {
    // Simple heuristic-based face check using canvas brightness
    // In production you'd use MediaPipe or face-api.js
    let consecutiveMisses = 0;
    faceIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !streamRef.current) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 64, 48);
        const data = ctx.getImageData(0, 0, 64, 48).data;

        // Check average brightness (very dark = no face / covered camera)
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = totalBrightness / (data.length / 4);

        if (avgBrightness < 20) {
          // Camera likely covered or very dark
          consecutiveMisses++;
          if (consecutiveMisses >= 3) {
            recordViolation('face_away', { reason: 'camera_obscured', brightness: avgBrightness });
            consecutiveMisses = 0;
          }
        } else {
          consecutiveMisses = 0;
        }
      } catch (e) {
        // Canvas taint or other errors
      }
    }, 5000); // Check every 5 seconds
  }, [recordViolation]);

  // ── Right-click + copy paste prevention ─────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const prevent = (e) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);
    // Allow paste for coding questions
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
    };
  }, [enabled]);

  const clearWarning = useCallback((id) => {
    setWarnings(prev => prev.filter(w => w.id !== id));
  }, []);

  return {
    violations,
    warnings,
    clearWarning,
    isFullscreen,
    cameraActive,
    videoRef,
    requestFullscreen,
    totalViolations: totalViolationsRef.current,
  };
}

function getViolationMessage(type) {
  const messages = {
    tab_switch: '⚠️ Tab switch detected! Stay on this page.',
    window_switch: '⚠️ Window focus lost! Return to the test.',
    face_away: '⚠️ Look at the screen! Face away detected.',
    multiple_faces: '⚠️ Multiple faces detected! Only you should be visible.',
    fullscreen_exit: '⚠️ Fullscreen exited! Please re-enter fullscreen.',
  };
  return messages[type] || '⚠️ Security violation detected!';
}

export default useTestSecurity;
