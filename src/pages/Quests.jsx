import { useState, useMemo } from "react";
import "../styles/Quests.css";

// --- HELPERS ---
// Get all days in a month for calendar display
const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// Status color helpers
const sBg = (s) => s === "completed" ? "#EAF3DE" : s === "in progress" ? "#FAEEDA" : "#FCEBEB";
const sTx = (s) => s === "completed" ? "#3B6D11" : s === "in progress" ? "#854F0B" : "#A32D2D";
const sDt = (s) => s === "completed" ? "#1D9E75" : s === "in progress" ? "#EF9F27" : "#E24B4A";
// Cycle task status: uncompleted → in progress → completed → uncompleted
const nxt = (s) => s === "uncompleted" ? "in progress" : s === "in progress" ? "completed" : "uncompleted";

// API configuration
const API_BASE = "http://localhost:5000/api";
const userId = 1;
const USE_API = false; // Use local state instead of backend for now

// Simple unique ID generator for local state
let _id = 1;
const uid = () => _id++;

export default function TodoCalendarWithQuests() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD

  // State for tasks
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(todayStr);

  // State for events
  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState(todayStr);

  // --- TASK HANDLERS ---
  
  // Add a new task
  const addTask = async () => {
    if (!newTask.trim()) return; // Don't add empty tasks
    if (USE_API) {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newTask, deadline: taskDeadline }),
        });
        const saved = await res.json();
        setTasks((prev) => [...prev, { ...saved, deadline: saved.deadline.split("T")[0] }]);
      } catch (err) { console.error(err); }
    } else {
      // Local state version
      setTasks((prev) => [...prev, { id: uid(), name: newTask, deadline: taskDeadline, status: "uncompleted" }]);
    }
    setNewTask(""); // Clear input
  };

  // Toggle task status (uncompleted → in progress → completed)
  const toggleStatus = async (task) => {
    const next = nxt(task.status);
    if (USE_API) {
      try {
        const res = await fetch(`${API_BASE}/tasks/${task.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...updated, deadline: updated.deadline.split("T")[0] } : t));
      } catch (err) { console.error(err); }
    } else {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    if (USE_API) {
      try { await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" }); } catch (err) { console.error(err); }
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // --- EVENT HANDLERS ---
  
  // Add a new event
  const addEvent = async () => {
    if (!eventTitle.trim()) return; // Don't add empty events
    
    // Use the selected date or today if not set
    const formattedDate = eventDate || todayStr;
    
    if (USE_API) {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: eventTitle, 
            date: formattedDate, 
            time: eventTime, 
            venue: eventVenue 
          }),
        });
        const saved = await res.json();
        setEvents((prev) => [...prev, saved]);
      } catch (err) { console.error(err); }
    } else {
      // Local state version
      setEvents((prev) => [...prev, { 
        id: uid(), 
        title: eventTitle, 
        date: formattedDate,
        time: eventTime, 
        venue: eventVenue 
      }]);
    }
    // Clear all event inputs
    setEventTitle(""); 
    setEventTime(""); 
    setEventVenue("");
  };

  // Delete an event
  const deleteEvent = async (id) => {
    if (USE_API) {
      try { await fetch(`${API_BASE}/events/${id}`, { method: "DELETE" }); } catch (err) { console.error(err); }
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // --- DERIVED DATA ---
  
  // Group tasks by their deadline date
  const tasksByDate = useMemo(() =>
    tasks.reduce((acc, t) => { 
      const taskDate = t.deadline ? t.deadline.split('T')[0] : t.deadline; // Ensure YYYY-MM-DD format
      (acc[taskDate] ??= []).push(t); // Create array if doesn't exist, then add task
      return acc; 
    }, {}),
    [tasks]
  );

  // Group events by their date
  const eventsByDate = useMemo(() =>
    events.reduce((acc, e) => { 
      const eventDate = e.date ? e.date.split('T')[0] : e.date; // Ensure YYYY-MM-DD format
      (acc[eventDate] ??= []).push(e); // Create array if doesn't exist, then add event
      return acc; 
    }, {}),
    [events]
  );

  // Calculate quest progress (daily and weekly)
  const quests = useMemo(() => {
    // Daily quest: Count completed tasks for today
    const todayTasks = tasksByDate[todayStr] || [];
    const dailyDone = todayTasks.filter((t) => t.status === "completed").length;

    // Weekly quest: Count completed tasks in current week (Sunday to Saturday)
    const dow = today.getDay();
    const ws = new Date(today); 
    ws.setDate(today.getDate() - dow); // Start of week (Sunday)
    ws.setHours(0, 0, 0, 0);
    const we = new Date(ws); 
    we.setDate(ws.getDate() + 6); // End of week (Saturday)
    we.setHours(23, 59, 59, 999);
    const weekDone = tasks.filter((t) => {
      const d = new Date(t.deadline + "T00:00:00");
      return t.status === "completed" && d >= ws && d <= we;
    }).length;

    return [
      { title: "Complete 5 tasks today", target: 5, progress: dailyDone, color: "#1D9E75" },
      { title: "Complete 20 tasks this week", target: 20, progress: weekDone, color: "#4E56C0" },
    ];
  }, [tasksByDate, tasks, todayStr]);

  // Get all days in current month for calendar grid
  const days = getDaysInMonth(today.getFullYear(), today.getMonth());
  const firstDayWeekday = days[0].getDay(); // Day of week for first day (0 = Sunday)

  return (
    <div className="quests-root">
      <div className="quests-card">
        {/* Header */}
        <div className="quests-header">
          <span className="quests-title">🍅 Quests & Tasks</span>
        </div>

        <div className="quests-panel">
          {/* ===== QUESTS SECTION ===== */}
          <div>
            <div className="quests-section-header">Quests</div>
            {quests.map((q) => (
              <div key={q.title} className="quest-card">
                <div className="quest-header">
                  <span className="quest-title">{q.title}{q.progress >= q.target ? " ✓" : ""}</span>
                  <span className="quest-progress-text">{q.progress} / {q.target}</span>
                </div>
                <div className="quest-progress-bar">
                  <div 
                    className="quest-progress-fill" 
                    style={{ 
                      width: `${Math.min(100, (q.progress / q.target) * 100)}%`, 
                      background: q.color 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ===== TODAY SECTION ===== */}
          <div className="today-section">
            <div className="today-header">Today — {todayStr}</div>
            {/* Empty state message */}
            {!(tasksByDate[todayStr]?.length || eventsByDate[todayStr]?.length) && (
              <div className="empty-state">✨ No tasks or events today</div>
            )}
            {/* Display today's tasks */}
            {(tasksByDate[todayStr] || []).map((task) => (
              <div key={task.id} className="task-item">
                <div className={`task-status-dot status-${task.status === "uncompleted" ? "uncompleted" : task.status === "in progress" ? "in-progress" : "completed"}`} />
                <span
                  onClick={() => toggleStatus(task)}
                  className={`task-name ${task.status === "completed" ? "completed" : ""}`}
                >
                  {task.name}
                </span>
                <span className={`status-badge ${task.status === "uncompleted" ? "uncompleted" : task.status === "in progress" ? "in-progress" : "completed"}`}>
                  {task.status}
                </span>
                <button className="delete-btn" onClick={() => deleteTask(task.id)}>×</button>
              </div>
            ))}
            {/* Display today's events */}
            {(eventsByDate[todayStr] || []).map((ev) => (
              <div key={ev.id} className="event-item">
                <div className="task-status-dot" style={{ background: "#4E56C0" }} />
                <span className="task-name">{ev.title}</span>
                <span style={{ fontSize: 14, color: "#8890d8" }}>{ev.time && `${ev.time} `}{ev.venue && `@ ${ev.venue}`}</span>
                <button className="delete-btn" onClick={() => deleteEvent(ev.id)}>×</button>
              </div>
            ))}
          </div>

          {/* ===== ADD TASK FORM ===== */}
          <div className="add-section">
            <div className="add-title">➕ Add Task</div>
            <div className="form-row">
              <input
                className="quest-input"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Task name"
              />
              <input 
                className="quest-input" 
                type="date" 
                value={taskDeadline} 
                onChange={(e) => setTaskDeadline(e.target.value)} 
                style={{ maxWidth: 140 }} 
              />
              <button className="quest-btn" onClick={addTask}>Add Task</button>
            </div>
          </div>

          {/* ===== ADD EVENT FORM ===== */}
          <div className="add-section">
            <div className="add-title">📅 Add Event</div>
            <div className="form-row">
              <input 
                className="quest-input" 
                value={eventTitle} 
                onChange={(e) => setEventTitle(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && addEvent()} 
                placeholder="Event title" 
              />
              <input 
                className="quest-input" 
                type="time" 
                value={eventTime} 
                onChange={(e) => setEventTime(e.target.value)} 
                style={{ maxWidth: 100 }} 
              />
              <input 
                className="quest-input" 
                value={eventVenue} 
                onChange={(e) => setEventVenue(e.target.value)} 
                placeholder="Venue" 
                style={{ maxWidth: 120 }} 
              />
              <input 
                className="quest-input" 
                type="date" 
                value={eventDate} 
                onChange={(e) => setEventDate(e.target.value)} 
                style={{ maxWidth: 130 }} 
              />
              <button className="quest-btn" onClick={addEvent}>Add Event</button>
            </div>
          </div>

          {/* ===== CALENDAR SECTION ===== */}
          <div className="add-section">
            <div className="add-title">📆 {today.toLocaleString("default", { month: "long", year: "numeric" })}</div>
            <div className="calendar-grid">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}
              {/* Empty cells for days before month starts */}
              {Array(firstDayWeekday).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {/* Calendar days */}
              {days.map((day) => {
                const dateStr = day.toISOString().split("T")[0]; // YYYY-MM-DD
                const isToday = dateStr === todayStr;
                return (
                  <div key={dateStr} className={`calendar-cell ${isToday ? "today" : ""}`}>
                    <div className="calendar-date">{day.getDate()}</div>
                    {/* Tasks for this date */}
                    {(tasksByDate[dateStr] || []).map((task) => (
                      <div 
                        key={task.id} 
                        className="calendar-chip chip-task"
                        style={{ 
                          background: sBg(task.status), 
                          color: sTx(task.status),
                          cursor: "pointer"
                        }}
                        onClick={() => toggleStatus(task)}
                      >
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {task.name}
                        </span>
                        <button 
                          className="chip-delete" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering parent onClick
                            deleteTask(task.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {/* Events for this date */}
                    {(eventsByDate[dateStr] || []).map((ev) => (
                      <div key={ev.id} className="calendar-chip chip-event">
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.title}
                        </span>
                        <button 
                          className="chip-delete" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering parent onClick
                            deleteEvent(ev.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}