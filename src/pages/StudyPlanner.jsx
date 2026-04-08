import { useState } from "react";

export default function StudyPlan({ onPlanCreated }) {
  const API_BASE = "http://localhost:5000/api";
  const userId = 1;

  const [examDate, setExamDate] = useState("");
  const [studyMode, setStudyMode] = useState("auto");
  const [selectedDates, setSelectedDates] = useState([]);

  const generateStudyDates = (examDate) => {
    const today = new Date();
    const exam = new Date(examDate);
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

  const generatePlan = async () => {
    if (!examDate) return;

    let dates = [];

    if (studyMode === "auto") {
      dates = generateStudyDates(examDate);
    } else {
      dates = selectedDates.map((d) => new Date(d));
    }

    try {
      await Promise.all(
        dates.map((date) =>
          fetch(`${API_BASE}/users/${userId}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Study Session",
              deadline: date.toISOString().split("T")[0],
            }),
          })
        )
      );

      await fetch(`${API_BASE}/users/${userId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "📌 Exam Date",
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
    <div style={{ padding: 20 }}>
      <h2>Study Plan Maker</h2>

      <div style={{ marginBottom: 10 }}>
        <label>Exam Date: </label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Mode: </label>
        <select
          value={studyMode}
          onChange={(e) => setStudyMode(e.target.value)}
        >
          <option value="auto">Auto (Fibonacci)</option>
          <option value="manual">Manual</option>
        </select>
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

      <button onClick={generatePlan}>
        Generate Study Plan
      </button>
    </div>
  );
}