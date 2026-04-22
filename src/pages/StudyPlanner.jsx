import { useState } from "react";
import "../styles/StudyPlanner.css";

export default function StudyPlan({ onPlanCreated, currentUser  }) {
  const API_BASE = "http://localhost:5000/api";
  const userId = currentUser?.id;

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

    let a = 1, b = 2;
    while (true) {
      const d = new Date(exam);
      d.setDate(d.getDate() - a);
      if (d < today) break;
      dates.push(d);
      [a, b] = [b, a + b];
    }

    if (dates.length === 0) {
      alert("Exam is too soon to generate a study plan.");
      return [];
    }

    return dates;
  };

  const generatePlan = async (event) => {
    if (!examDate || !userId) return;

    let dates = [];

    if (studyMode === "auto") {
      dates = generateStudyDates(examDate);
      if (dates.length === 0) return;
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
          <textarea
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