import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/PomodoroTimer.css";

const DEFAULT_FOCUS = 25;
const DEFAULT_SHORT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;

// Tiered multiplier: longer sessions earn disproportionately more,
// creating clear milestones that align with Pomodoro best practices.
//   < 15 min → 1.0×  (warm-up / quick session)
//   15–24 min → 1.5×  (solid effort)
//   25–44 min → 2.0×  (standard Pomodoro — the sweet spot)
//   45+  min → 2.5×  (deep work)
export function calcRewards(focusMinutes) {
  const base_coins = focusMinutes * 2;
  const base_xp    = focusMinutes * 3;

  let multiplier;
  if      (focusMinutes >= 45) multiplier = 2.5;
  else if (focusMinutes >= 25) multiplier = 2.0;
  else if (focusMinutes >= 15) multiplier = 1.5;
  else                         multiplier = 1.0;

  return {
    coins: Math.floor(base_coins * multiplier),
    xp:    Math.floor(base_xp    * multiplier),
  };
}

export function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}


export default function PomodoroTimer({ user }) {
  const [mode, setMode] = useState("focus");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS * 60);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMins, setFocusMins] = useState(DEFAULT_FOCUS);
  const [shortMins, setShortMins] = useState(DEFAULT_SHORT_BREAK);
  const [longMins, setLongMins] = useState(DEFAULT_LONG_BREAK);
  const [pendingFocus, setPendingFocus] = useState(DEFAULT_FOCUS);
  const [pendingShort, setPendingShort] = useState(DEFAULT_SHORT_BREAK);
  const [pendingLong, setPendingLong] = useState(DEFAULT_LONG_BREAK);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [notification, setNotification] = useState(null);
  const [tomatoBounce, setTomatoBounce] = useState(false);
  const [warningActive, setWarningActive] = useState(false);

  const intervalRef    = useRef(null);
  const totalSecondsRef = useRef(DEFAULT_FOCUS * 60);
  const jingleRef      = useRef(null);   // the Audio element
  const jinglePlayedRef = useRef(false); // guard: only play once per session

  // Lazily create the Audio object once so the browser can preload it
  if (!jingleRef.current) {
    jingleRef.current = new Audio("/timer-jingle.wav");
    jingleRef.current.preload = "auto";
    jingleRef.current.volume = 0.4;
  }

  const getDuration = useCallback((m) => {
    if (m === "focus") return focusMins * 60;
    if (m === "short") return shortMins * 60;
    return longMins * 60;
  }, [focusMins, shortMins, longMins]);

  function switchMode(newMode) {
    clearInterval(intervalRef.current);
    setRunning(false);
    setMode(newMode);
    const dur = getDuration(newMode);
    totalSecondsRef.current = dur;
    setSecondsLeft(dur);
    setNotification(null);
    jinglePlayedRef.current = false;
    setWarningActive(false);
  }

  function handleStartPause() {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      if (secondsLeft === 0) {
        // Restart: reset to the full chosen duration before starting
        const dur = getDuration(mode);
        totalSecondsRef.current = dur;
        setSecondsLeft(dur);
      }
      setTomatoBounce(true);
      setTimeout(() => setTomatoBounce(false), 600);
      setRunning(true);
    }
  }

  function handleCancel() {
    clearInterval(intervalRef.current);
    setRunning(false);
    const dur = getDuration(mode);
    totalSecondsRef.current = dur;
    setSecondsLeft(dur);
    setNotification(null);
    jinglePlayedRef.current = false;
    setWarningActive(false);
  }

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode, focusMins]);

  // Sync warning state to body class so Navbar.css can react to it
  useEffect(() => {
    if (warningActive) {
      document.body.classList.add('pomo-warning');
    } else {
      document.body.classList.remove('pomo-warning');
    }
    return () => document.body.classList.remove('pomo-warning');
  }, [warningActive]);

  // Dedicated effect for audio + warning triggers — watches secondsLeft directly
  useEffect(() => {
    if (!running || mode !== "focus") return;

    // 🎵 Audio at 15 s (useEffect fires after render, equivalent to updater at prev===16)
    if (secondsLeft === 15 && !jinglePlayedRef.current) {
      jinglePlayedRef.current = true;
      jingleRef.current.currentTime = 0;
      jingleRef.current.play().catch(() => {});
    }

    // 🟠 Warning aesthetic at 15 s
    if (secondsLeft === 15) {
      setWarningActive(true);
    }
  }, [secondsLeft, running, mode]);

  function handleComplete() {
    setWarningActive(false);
    setTomatoBounce(true);
    setTimeout(() => setTomatoBounce(false), 600);
    if (mode === "focus") {
      const { coins, xp } = calcRewards(focusMins);
      setNotification({ type: "focus", coins, xp });
      setSessionsToday((s) => s + 1);

      // Award coins to the backend when a focus session is completed
      if (user?.id) {
        fetch(`http://localhost:5000/api/users/${user.id}/coins`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: coins }),
        }).catch((err) => console.error("Failed to award coins:", err));
      }
    } else {
      setNotification({ type: "break" });
    }
  }

  function saveSettings() {
    setFocusMins(pendingFocus);
    setShortMins(pendingShort);
    setLongMins(pendingLong);
    setShowSettings(false);
    clearInterval(intervalRef.current);
    setRunning(false);
    setMode("focus");
    const dur = pendingFocus * 60;
    totalSecondsRef.current = dur;
    setSecondsLeft(dur);
    setNotification(null);
  }

  useEffect(() => {
    if (!running) {
      const dur = getDuration(mode);
      totalSecondsRef.current = dur;
      setSecondsLeft(dur);
    }
  }, [focusMins, shortMins, longMins]);

  const total = getDuration(mode);
  const progress = secondsLeft / total;
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const modeColors = {
    focus:  { accent: "#4E56C0", bg: "#f0f2fc", tab: "#8890d8" },
    short:  { accent: "#56A0C0", bg: "#EDF6FC", tab: "#88B8D8" },
    long:   { accent: "#8B56C0", bg: "#F2EEFC", tab: "#B088D8" },
  };
  const warningColors = { accent: "#C05A1A", bg: "#fff4ec", tab: "#e07a3a" };
  const col = (warningActive && mode === "focus") ? warningColors : modeColors[mode];

  const modeLabel = mode === "focus" ? "Focus Session" : mode === "short" ? "Take a breather!" : "Some you time.";

  return (
    <div className={`pomo-root${warningActive ? " warning" : ""}`} style={{ "--accent": col.accent, "--bg-tint": col.bg, "--tab-active": col.tab }}>
      {/* Main Card */}
      <div className="pomo-card">
        {/* Header */}
        <div className="pomo-header">
          <span className="pomo-title">🍅 Pawmodoro Timer</span>
          <button
            className="pomo-settings-btn"
            onClick={() => { setShowSettings(true); setPendingFocus(focusMins); setPendingShort(shortMins); setPendingLong(longMins); }}
          >
            ⚙ Settings
          </button>
        </div>

        {/* Mode tabs */}
        <div className="pomo-tabs">
          {["focus", "short", "long"].map((m) => (
            <button
              key={m}
              className={`pomo-tab ${mode === m ? "active" : ""}`}
              onClick={() => switchMode(m)}
            >
              {m === "focus" ? "Lock In" : m === "short" ? "Short Break" : "Long Break"}
            </button>
          ))}
        </div>

        {/* Timer panel */}
        <div className="timer-panel" style={{ background: col.bg }}>

          {/* Sessions badge */}
          <div className="sessions-badge">
            <span>🔥</span>
            <span>{sessionsToday} sessions today</span>
          </div>

          {/* Big tomato + ring */}
          <div className="ring-wrap">
            <svg className="ring-svg" viewBox="0 0 260 260">
              {/* Dotted track */}
              <circle cx="130" cy="130" r={radius} className="ring-track" />
              {/* Progress arc */}
              <circle
                cx="130" cy="130" r={radius}
                className="ring-progress"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: dashOffset,
                  stroke: col.accent,
                }}
              />
            </svg>

            <div className="ring-center">
              <div className={`tomato-emoji ${tomatoBounce ? "bounce" : ""} ${running ? "wiggle" : ""}`}>
                🍅
              </div>
              <div className={`timer-digits${warningActive ? " warning" : ""}`}>{formatTime(secondsLeft)}</div>
              <div className="mode-label">{modeLabel}</div>
            </div>
          </div>

          {/* Reward preview */}
          {mode === "focus" && (
            <div className="reward-preview">
              You recieve: <span className="rp-pill">+{calcRewards(focusMins).coins} 🪙</span> <span className="rp-pill">+{calcRewards(focusMins).xp} ✨</span>
            </div>
          )}

          {/* Controls */}
          <div className="controls">
            <button className="pomo-btn primary" onClick={handleStartPause}>
              {running ? "⏸ Pause" : secondsLeft === 0 ? "▶ Restart Timer" : secondsLeft < total ? "▶ Resume Timer" : "▶ Start Timer"}
            </button>
            <button className="pomo-btn ghost" onClick={handleCancel}>
              ✕ Cancel
            </button>
          </div>

        </div>{/* /timer-panel */}
      </div>{/* /pomo-card */}

      {/* Completion notification */}
      {notification && (
        <div className="pomo-overlay">
          <div className={`pomo-modal ${notification.type}`}>
            <div className="pomo-modal-header">
              <span>{notification.type === "focus" ? "Congrats!" : "It's time to lock in!"}</span>
              <button className="pomo-modal-close" onClick={() => setNotification(null)}>✕</button>
            </div>
            <div className="pomo-modal-body">
              <div className="notif-emoji">
                {notification.type === "focus" ? "🎉" : "🐾"}
              </div>
              {notification.type === "focus" ? (
                <>
                  <p className="notif-msg">Amazing work! You earned:</p>
                  <div className="notif-pills">
                    <span className="n-pill coin">+{notification.coins} 🪙 coins</span>
                    <span className="n-pill xp">+{notification.xp} ✨ XP</span>
                  </div>
                  <p className="notif-sub">Time to take a break!</p>
                  <div className="notif-actions">
                    <button className="pomo-btn primary" onClick={() => { setNotification(null); switchMode("short"); }}>Short Break</button>
                    <button className="pomo-btn primary" onClick={() => { setNotification(null); switchMode("long"); }}>Long Break</button>
                    <button className="pomo-btn ghost" onClick={() => { setNotification(null); handleCancel(); }}>Skip</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="notif-msg">Ready to focus again?</p>
                  <div className="notif-actions">
                    <button className="pomo-btn primary" onClick={() => { setNotification(null); switchMode("focus"); }}>Start Focus</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="pomo-overlay" onClick={() => setShowSettings(false)}>
          <div className="pomo-modal settings" onClick={e => e.stopPropagation()}>
            <div className="pomo-modal-header">
              <span>⚙ Settings</span>
              <button className="pomo-modal-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="pomo-modal-body">
              {[
                { label: "Focus Duration", value: pendingFocus, set: setPendingFocus, min: 1, max: 90 },
                { label: "Short Break", value: pendingShort, set: setPendingShort, min: 1, max: 30 },
                { label: "Long Break", value: pendingLong, set: setPendingLong, min: 1, max: 60 },
              ].map(({ label, value, set, min, max }) => (
                <div className="setting-row" key={label}>
                  <label className="setting-label">{label}</label>
                  <div className="setting-input-wrap">
                    <button className="stepper-btn" onClick={() => set(Math.max(min, value - 1))}>−</button>
                    <input
                      type="number"
                      className="setting-input"
                      value={value}
                      min={min} max={max}
                      onChange={e => set(Math.min(max, Math.max(min, Number(e.target.value))))}
                    />
                    <span className="setting-unit">min</span>
                    <button className="stepper-btn" onClick={() => set(Math.min(max, value + 1))}>+</button>
                  </div>
                </div>
              ))}
              <div className="notif-actions" style={{ marginTop: "16px" }}>
                <button className="pomo-btn primary" onClick={saveSettings}>💾 Save</button>
                <button className="pomo-btn ghost" onClick={() => setShowSettings(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
