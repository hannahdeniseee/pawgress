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

// Note frequencies (Hz)
const NOTE = {
  G4: 392.00,
  A4: 440.00, B4: 493.88,
  "C#5": 554.37, D5: 587.33, E5: 659.25, "F#5": 739.99,
  C5: 523.25,
};

function chime(type = "focus") {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();

  // D F# D E D B D C# A C# B G... 8-bit session completion jingle
  const focusMelody = [
    NOTE.D5, null, NOTE["F#5"], NOTE.D5, NOTE.E5,
    NOTE.D5, NOTE.B4,    NOTE.D5, null, NOTE["C#5"],
    NOTE.A4, NOTE["C#5"], null, NOTE.B4, NOTE.G4,
  ];
  const breakMelody = [NOTE.C5, NOTE.B4, NOTE.A4];
  const melody = type === "focus" ? focusMelody : breakMelody;

  // 8-bit feel: square wave, short punchy notes with a hard cut-off
  const noteDuration = 0.08;  // how long each note sounds
  const noteSpacing  = 0.08;  // gap between note starts

  melody.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";           // ← 8-bit square wave
    osc.frequency.value = freq;

    if (freq === null) return;

    const t = ctx.currentTime + i * noteSpacing;
    gain.gain.setValueAtTime(0.18, t);                        // instant on
    gain.gain.setValueAtTime(0.18, t + noteDuration * 0.75); // hold
    gain.gain.linearRampToValueAtTime(0, t + noteDuration);  // quick fade

    osc.start(t);
    osc.stop(t + noteDuration + 0.01);
  });
}

// Retro OS window title bar
function TitleBar({ title, onSettings }) {
  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <span className="title-bar-icon">🍅</span>
        <span className="title-bar-text">{title}</span>
      </div>
      <div className="title-bar-buttons">
        <button className="tb-btn tb-minimize" >_</button>
        <button className="tb-btn tb-maximize" >□</button>
        <button className="tb-btn tb-close" title="Settings" onClick={onSettings}>⚙</button>
      </div>
    </div>
  );
}

// Pixel star decoration
function Stars() {
  return (
    <div className="bg-stars" aria-hidden="true">
      {[...Array(12)].map((_, i) => (
        <span key={i} className={`star star-${i}`}>✦</span>
      ))}
    </div>
  );
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

  const intervalRef = useRef(null);
  const totalSecondsRef = useRef(DEFAULT_FOCUS * 60);

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
  }

  function handleStartPause() {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
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

  function handleComplete() {
    chime(mode);
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
    focus:  { accent: "#b388ff", bg: "#ede7ff", tab: "#d4baff" },
    short:  { accent: "#81d4fa", bg: "#e1f5fe", tab: "#b3e5fc" },
    long:   { accent: "#f48fb1", bg: "#fce4ec", tab: "#f8bbd0" },
  };
  const col = modeColors[mode];

  const modeLabel = mode === "focus" ? "Focus Session" : mode === "short" ? "Take a breather!" : "Some you time.";

  return (
    <div className="pomo-root" style={{ "--accent": col.accent, "--bg-tint": col.bg, "--tab-active": col.tab }}>
      {/* Main Window */}
      <div className="os-window">
        <TitleBar
          title="Pawmodoro Timer v1.0"
          onSettings={() => { setShowSettings(true); setPendingFocus(focusMins); setPendingShort(shortMins); setPendingLong(longMins); }}
        />

        {/* Window body */}
        <div className="window-body">

          {/* Mode tabs... styled like OS tab bar */}
          <div className="tab-bar">
            {["focus", "short", "long"].map((m) => (
              <button
                key={m}
                className={`os-tab ${mode === m ? "active" : ""}`}
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
                <div className="timer-digits">{formatTime(secondsLeft)}</div>
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
              <button className="os-btn primary" onClick={handleStartPause}>
                {running ? "⏸ Pause" : secondsLeft < total ? "▶ Resume Timer" : "▶ Start Timer"}
              </button>
              <button className="os-btn ghost" onClick={handleCancel}>
                ✕ Cancel
              </button>
            </div>

          </div>{/* /timer-panel */}

          {/* Status bar */}
          <div className="status-bar">
            <span>★ Pawgress App</span>
            <span>focus: {focusMins}m · short: {shortMins}m · long: {longMins}m</span>
          </div>
        </div>{/* /window-body */}
      </div>{/* /os-window */}

      {/* Completion notification... floats above window */}
      {notification && (
        <div className="notif-overlay">
          <div className={`notif-window ${notification.type}`}>
            <TitleBar title={notification.type === "focus" ? "GOATED" : "It's time to lock in!"} onSettings={() => setNotification(null)} />
            <div className="notif-body">
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
                  <p className="notif-sub">Go take a break!</p>
                  <div className="notif-actions">
                    <button className="os-btn primary" onClick={() => { setNotification(null); switchMode("short"); }}>Short Break</button>
                    <button className="os-btn primary" onClick={() => { setNotification(null); switchMode("long"); }}>Long Break</button>
                    <button className="os-btn ghost" onClick={() => { setNotification(null); handleCancel(); }}>Skip</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="notif-msg">Ready to focus again?</p>
                  <div className="notif-actions">
                    <button className="os-btn primary" onClick={() => { setNotification(null); switchMode("focus"); }}>Start Focus</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="notif-overlay" onClick={() => setShowSettings(false)}>
          <div className="notif-window settings" onClick={e => e.stopPropagation()}>
            <TitleBar title="Settings ⚙" onSettings={() => setShowSettings(false)} />
            <div className="notif-body">
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
                <button className="os-btn primary" onClick={saveSettings}>💾 Save</button>
                <button className="os-btn ghost" onClick={() => setShowSettings(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
