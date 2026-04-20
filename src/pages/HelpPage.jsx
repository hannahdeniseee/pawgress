import { useState } from "react";
import "../styles/HelpPage.css";

export default function HelpPage() {
  const [tab, setTab] = useState("game");

  return (
    <div className="help-container">

      <div className="help-header">
        <h1 className="help-title">📖 App Guide</h1>
      </div>

      <div className="help-tabs">
        <button onClick={() => setTab("game")} className={tab === "game" ? "active" : ""}>
          Game System
        </button>
        <button onClick={() => setTab("task")} className={tab === "task" ? "active" : ""}>
          Add Task
        </button>
        <button onClick={() => setTab("event")} className={tab === "event" ? "active" : ""}>
          Add Event
        </button>
        <button onClick={() => setTab("study")} className={tab === "study" ? "active" : ""}>
          Study Plan
        </button>
        <button onClick={() => setTab("pomo")} className={tab === "pomo" ? "active" : ""}>
          Pawmodoro
        </button>
      </div>

      <div className="help-content">
        {tab === "game" && (
        <div>
            <h2>🎮 Game System</h2>

            <p>
            Your productivity app is gamified. Every action gives rewards that help you grow your pet and progress.
            </p>

            <div className="game-grid">

            <div className="game-card">
                <h3>🪙 Coins</h3>
                <p>
                Earn coins by completing Focus sessions in Pawmodoro.
                Spend them in the Pet Shop for accessories.
                </p>
            </div>

            <div className="game-card">
                <h3>✨ XP (Experience Points)</h3>
                <p>
                XP increases every time you complete a focus session.
                It tracks your consistency and productivity level.
                </p>
            </div>

            <div className="game-card">
                <h3>🐾 Pets</h3>
                <p>
                Your pet grows with your productivity.
                The more you focus, the happier your pet becomes.
                </p>
            </div>

            <div className="game-card">
                <h3>🍅 Pawmodoro Timer</h3>
                <p>
                Focus sessions give rewards.
                Breaks help you recover.
                Longer focus = more rewards.
                </p>
            </div>

            </div>
        </div>
        )}

        {tab === "task" && (
          <div>
            <h2>📝 Add Task</h2>
            <p>Create tasks to track what you need to finish. You can set deadlines and mark them as complete.</p>
          </div>
        )}

        {tab === "event" && (
          <div>
            <h2>📅 Add Event</h2>
            <p>Schedule important events like exams, meetings, or reminders so you don’t forget them.</p>
          </div>
        )}

        {tab === "study" && (
          <div>
            <h2>📚 Study Plan Maker</h2>
            <p>Enter your exam date and it will automatically generate a study schedule for you.</p>
          </div>
        )}

        {tab === "pomo" && (
          <div>
            <h2>🍅 Pawmodoro Timer</h2>
            <p>Work in focused sessions, take breaks, and stay productive using timed cycles.</p>
          </div>
        )}
      </div>

    </div>
  );
}