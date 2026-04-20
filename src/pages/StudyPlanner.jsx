import { useState } from "react";
import "../styles/StudyPlanner.css";

export default function StudyPlan({ onPlanCreated }) {
  const API_BASE = "http://localhost:5000/api";
  const userId = 1;

  const [examDate, setExamDate] = useState("");
  const [studyMode, setStudyMode] = useState("auto");
  const [selectedDates, setSelectedDates] = useState([]);
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");

  const generateStudyDates = (examDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = examDate.split('-').map(Number);
    const exam = new Date(year, month - 1, day);
    const dates = [];

    let fib = [1, 2];

    fib.forEach((daysBefore) => {
      const d = new Date(exam);
      d.setDate(d.getDate() - daysBefore);
      if (d >= today) dates.push(d);
    });

    while (true) {
      const next = fib[fib.length - 1] + fib[fib.length - 2];
      fib.push(next);

      const d = new Date(exam);
      d.setDate(d.getDate() - next);

      if (d < today) break;

      dates.push(d);
    }

    return dates;
  };

  const generatePlan = async (event) => {
    if (!examDate) return;

    let dates = [];

    if (studyMode === "auto") {
      dates = generateStudyDates(examDate);
    } else {
      dates = selectedDates.map((d) => new Date(d));
    }

    const topicsArray = topics
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await Promise.all(
        dates.map((date) =>
          fetch(`${API_BASE}/users/${userId}/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `${subject} Study Session`,
              date: date.toLocaleDateString('en-CA'),
              time: "",
              venue: "",
              topics: topicsArray.join(", "),
            }),
          })
        )
      );

      await fetch(`${API_BASE}/users/${userId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `📌 ${subject} Exam Date`,
          deadline: examDate,
        }),
      });

      alert("Study plan created!");

      onPlanCreated?.();

    } catch (err) {
      console.error("Error creating study plan:", err);
    }
  };

  return (
    <div className="study-container">
      <div className="study-header">
        <p className="study-title">📖 Study Plan Maker</p>
      </div>

      <div className="study-content">
        <div className="input-group">
          <label>Exam Date: </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Mode: </label>
          <select
            value={studyMode}
            onChange={(e) => setStudyMode(e.target.value)}
          >
            <option value="auto">Auto (Fibonacci)</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div className="input-group">
          <label>Subject: </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Topics: </label>
          <textArea
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
          />
        </div>

        {studyMode === "manual" && (
          <div style={{ marginBottom: 10 }}>
            <label>Add Study Date: </label>
            <input
              type="date"
              onChange={(e) =>
                setSelectedDates((prev) => [...prev, e.target.value])
              }
            />
          </div>
      )}
      </div>

      <button onClick={generatePlan} className="submit-btn">
        Generate Study Plan
      </button>
    </div>
  );
}