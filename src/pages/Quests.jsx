import { useState, useMemo } from "react";

// --- HELPERS ---
const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const sBg = (s) => s === "completed" ? "#EAF3DE" : s === "in progress" ? "#FAEEDA" : "#FCEBEB";
const sTx = (s) => s === "completed" ? "#3B6D11" : s === "in progress" ? "#854F0B" : "#A32D2D";
const sDt = (s) => s === "completed" ? "#1D9E75" : s === "in progress" ? "#EF9F27" : "#E24B4A";
const nxt = (s) => s === "uncompleted" ? "in progress" : s === "in progress" ? "completed" : "uncompleted";

const API_BASE = "http://localhost:5000/api";
const userId = 1;

const USE_API = false;

// --- STYLES ---
const S = {
  wrap: { padding: "1.5rem", fontFamily: "system-ui, sans-serif", color: "#1a1a1a", maxWidth: 960, margin: "0 auto" },
  sl: { fontSize: 12, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" },
  sec: { marginBottom: "2rem" },
  qc: { background: "#f5f5f3", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "0.5rem" },
  qh: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  pb: { height: 6, background: "#e8e8e6", borderRadius: 3, overflow: "hidden" },
  ts: { background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 12, padding: "1rem 1.25rem" },
  er: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "0.5px solid #f0f0f0" },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  en: { flex: 1, fontSize: 14, cursor: "pointer" },
  em: { fontSize: 12, color: "#888" },
  db: { background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" },
  ar: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  inp: { flex: 1, fontSize: 13, padding: "6px 10px", border: "0.5px solid #ccc", borderRadius: 8, minWidth: 120 },
  inpSm: { fontSize: 13, padding: "6px 10px", border: "0.5px solid #ccc", borderRadius: 8 },
  btn: { whiteSpace: "nowrap", fontSize: 13, padding: "6px 14px", border: "0.5px solid #ccc", borderRadius: 8, background: "#f5f5f3", cursor: "pointer" },
  cg: { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 },
  cdh: { fontSize: 11, fontWeight: 500, color: "#888", textAlign: "center", padding: "4px 0" },
  cc: { border: "0.5px solid #e0e0e0", borderRadius: 8, minHeight: 90, padding: 6, background: "#fff" },
  ccT: { border: "1.5px solid #378ADD", borderRadius: 8, minHeight: 90, padding: 6, background: "#fff" },
  cd: { fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 4 },
  cdT: { fontSize: 12, fontWeight: 500, color: "#185FA5", marginBottom: 4 },
  chip: { fontSize: 11, padding: "2px 5px", borderRadius: 4, marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 },
  chipTxt: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 },
  chipDel: { background: "none", border: "none", cursor: "pointer", fontSize: 11, opacity: 0.6, padding: 0, lineHeight: 1, color: "inherit" },
  bdg: { display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 8, fontWeight: 500 },
  msg: { fontSize: 13, color: "#888" },
};

let _id = 1;
const uid = () => _id++;

export default function TodoCalendarWithQuests() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(todayStr);

  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState(todayStr);

  // --- TASK HANDLERS ---
  const addTask = async () => {
    if (!newTask.trim()) return;
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
      setTasks((prev) => [...prev, { id: uid(), name: newTask, deadline: taskDeadline, status: "uncompleted" }]);
    }
    setNewTask("");
  };

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

  const deleteTask = async (id) => {
    if (USE_API) {
      try { await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" }); } catch (err) { console.error(err); }
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // --- EVENT HANDLERS ---
  const addEvent = async () => {
    if (!eventTitle.trim()) return;
    if (USE_API) {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: eventTitle, date: eventDate, time: eventTime, venue: eventVenue }),
        });
        const saved = await res.json();
        setEvents((prev) => [...prev, saved]);
      } catch (err) { console.error(err); }
    } else {
      setEvents((prev) => [...prev, { id: uid(), title: eventTitle, date: eventDate, time: eventTime, venue: eventVenue }]);
    }
    setEventTitle(""); setEventTime(""); setEventVenue("");
  };

  const deleteEvent = async (id) => {
    if (USE_API) {
      try { await fetch(`${API_BASE}/events/${id}`, { method: "DELETE" }); } catch (err) { console.error(err); }
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // --- DERIVED DATA ---
  const tasksByDate = useMemo(() =>
    tasks.reduce((acc, t) => { (acc[t.deadline] ??= []).push(t); return acc; }, {}),
    [tasks]
  );

  const eventsByDate = useMemo(() =>
    events.reduce((acc, e) => { (acc[e.date] ??= []).push(e); return acc; }, {}),
    [events]
  );

  const quests = useMemo(() => {
    const todayTasks = tasksByDate[todayStr] || [];
    const dailyDone = todayTasks.filter((t) => t.status === "completed").length;

    const dow = today.getDay();
    const ws = new Date(today); ws.setDate(today.getDate() - dow); ws.setHours(0, 0, 0, 0);
    const we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23, 59, 59, 999);
    const weekDone = tasks.filter((t) => {
      const d = new Date(t.deadline + "T00:00:00");
      return t.status === "completed" && d >= ws && d <= we;
    }).length;

    return [
      { title: "Complete 5 tasks today", target: 5, progress: dailyDone, color: "#1D9E75" },
      { title: "Complete 20 tasks this week", target: 20, progress: weekDone, color: "#378ADD" },
    ];
  }, [tasksByDate, tasks, todayStr]);

  const days = getDaysInMonth(today.getFullYear(), today.getMonth());
  const firstDayWeekday = days[0].getDay();

  return (
    <div style={S.wrap}>

      {/* QUESTS */}
      <div style={S.sec}>
        <div style={S.sl}>Quests</div>
        {quests.map((q) => (
          <div key={q.title} style={{ ...S.qc, opacity: q.progress >= q.target ? 0.7 : 1 }}>
            <div style={S.qh}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{q.title}{q.progress >= q.target ? " ✓" : ""}</span>
              <span style={{ fontSize: 13, color: "#888" }}>{q.progress} / {q.target}</span>
            </div>
            <div style={S.pb}>
              <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(100, (q.progress / q.target) * 100)}%`, background: q.color, transition: "width 0.3s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* TODAY */}
      <div style={S.sec}>
        <div style={S.sl}>Today — {todayStr}</div>
        <div style={S.ts}>
          {!(tasksByDate[todayStr]?.length || eventsByDate[todayStr]?.length) && (
            <div style={S.msg}>No tasks or events today</div>
          )}
          {(tasksByDate[todayStr] || []).map((task) => (
            <div key={task.id} style={S.er}>
              <div style={{ ...S.dot, background: sDt(task.status) }} />
              <span
                onClick={() => toggleStatus(task)}
                style={{ ...S.en, textDecoration: task.status === "completed" ? "line-through" : "none", color: task.status === "completed" ? "#aaa" : "#1a1a1a" }}
              >
                {task.name}
              </span>
              <span style={{ ...S.bdg, background: sBg(task.status), color: sTx(task.status) }}>{task.status}</span>
              <button style={S.db} onClick={() => deleteTask(task.id)}>×</button>
            </div>
          ))}
          {(eventsByDate[todayStr] || []).map((ev) => (
            <div key={ev.id} style={S.er}>
              <div style={{ ...S.dot, background: "#378ADD" }} />
              <span style={S.en}>{ev.title}</span>
              <span style={S.em}>{ev.time && `${ev.time} `}{ev.venue && `@ ${ev.venue}`}</span>
              <button style={S.db} onClick={() => deleteEvent(ev.id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* ADD TASK */}
      <div style={S.sec}>
        <div style={S.sl}>Add task</div>
        <div style={S.ar}>
          <input
            style={S.inp}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Task name"
          />
          <input style={S.inpSm} type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} />
          <button style={S.btn} onClick={addTask}>+ Add task</button>
        </div>
      </div>

      {/* ADD EVENT */}
      <div style={S.sec}>
        <div style={S.sl}>Add event</div>
        <div style={S.ar}>
          <input style={S.inp} value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEvent()} placeholder="Event title" />
          <input style={S.inpSm} type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
          <input style={{ ...S.inpSm, maxWidth: 120 }} value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} placeholder="Venue" />
          <input style={S.inpSm} type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <button style={S.btn} onClick={addEvent}>+ Add event</button>
        </div>
      </div>

      {/* CALENDAR */}
      <div style={S.sec}>
        <div style={S.sl}>{today.toLocaleString("default", { month: "long", year: "numeric" })}</div>
        <div style={S.cg}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} style={S.cdh}>{d}</div>
          ))}
          {Array(firstDayWeekday).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {days.map((day) => {
            const dateStr = day.toISOString().split("T")[0];
            const isToday = dateStr === todayStr;
            return (
              <div key={dateStr} style={isToday ? S.ccT : S.cc}>
                <div style={isToday ? S.cdT : S.cd}>{day.getDate()}</div>
                {(tasksByDate[dateStr] || []).map((task) => (
                  <div key={task.id} style={{ ...S.chip, background: sBg(task.status), color: sTx(task.status) }}>
                    <span style={S.chipTxt} title={task.name}>{task.name}</span>
                    <button style={S.chipDel} onClick={() => deleteTask(task.id)}>×</button>
                  </div>
                ))}
                {(eventsByDate[dateStr] || []).map((ev) => (
                  <div key={ev.id} style={{ ...S.chip, background: "#E6F1FB", color: "#185FA5" }}>
                    <span style={S.chipTxt} title={ev.title}>{ev.title}</span>
                    <button style={{ ...S.chipDel, color: "#185FA5" }} onClick={() => deleteEvent(ev.id)}>×</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
