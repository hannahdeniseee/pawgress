import { useState, useEffect, useMemo } from "react";

const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export default function TodoCalendarWithEvents() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const API_BASE = "http://localhost:5000/api";

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(todayStr);

  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState(todayStr);

  const userId = 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/users/${userId}/tasks`),
          fetch(`${API_BASE}/users/${userId}/events`)
        ]);
        setTasks(await tasksRes.json());
        setEvents(await eventsRes.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [userId]);

  // --- ADD / UPDATE / DELETE TASKS ---
  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTask, deadline: taskDeadline }),
      });
      const savedTask = await res.json();
      setTasks(prev => [...prev, savedTask]); // Update state immediately
      setNewTask("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (task) => {
    const nextStatus =
      task.status === "uncompleted" ? "in progress" :
      task.status === "in progress" ? "completed" :
      "uncompleted";

    try {
      const res = await fetch(`${API_BASE}/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const updatedTask = await res.json();
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // --- ADD / DELETE EVENTS ---
  const addEvent = async () => {
    if (!eventTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: eventTitle, date: eventDate, time: eventTime, venue: eventVenue }),
      });
      const savedEvent = await res.json();
      setEvents(prev => [...prev, savedEvent]);
      setEventTitle("");
      setEventTime("");
      setEventVenue("");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await fetch(`${API_BASE}/events/${id}`, { method: "DELETE" });
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // --- GROUP TASKS & EVENTS BY DATE ---
  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const dateStr = new Date(task.deadline).toISOString().split("T")[0];
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
      const dateStr = new Date(event.date).toISOString().split("T")[0];
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(event);
      return acc;
    }, {});
  }, [events]);

  const days = getDaysInMonth(today.getFullYear(), today.getMonth());
  const firstDayWeekday = days[0].getDay();

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "#4CAF50";
      case "in progress": return "#FFC107";
      default: return "#f44336";
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Todo Calendar + Events</h2>

      {/* TODAY'S TASKS & EVENTS */}
      <div style={{ marginBottom: 20 }}>
        <h3>Today's Tasks & Events ({todayStr})</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {(tasksByDate[todayStr] || []).map(task => (
            <li key={task.id}>
              <span onClick={() => toggleStatus(task)} style={{ textDecoration: task.status === "completed" ? "line-through" : "none", cursor: "pointer" }}>
                {task.name} ({task.status})
              </span>
              <button onClick={() => deleteTask(task.id)} style={{ marginLeft: 5 }}>x</button>
            </li>
          ))}
          {(eventsByDate[todayStr] || []).map(event => (
            <li key={event.id}>
              {event.title} {event.time && `@${event.time}`} {event.venue && `(${event.venue})`}
              <button onClick={() => deleteEvent(event.id)} style={{ marginLeft: 5 }}>x</button>
            </li>
          ))}
          {!(tasksByDate[todayStr]?.length || eventsByDate[todayStr]?.length) && <li>No tasks or events today!</li>}
        </ul>
      </div>

      {/* Task Input */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="New task" style={{ flex: 1 }} />
        <input type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} />
        <button onClick={addTask}>Add Task</button>
      </div>

      {/* Event Input */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event title" style={{ flex: 1 }} />
        <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
        <input value={eventVenue} onChange={e => setEventVenue(e.target.value)} placeholder="Venue" />
        <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
        <button onClick={addEvent}>Add Event</button>
      </div>

      {/* Calendar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
        {Array(firstDayWeekday).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const dateStr = day.toISOString().split("T")[0];
          const dayTasks = tasksByDate[dateStr] || [];
          const dayEvents = eventsByDate[dateStr] || [];
          return (
            <div key={dateStr} style={{ border: "1px solid #ccc", minHeight: 120, padding: 5 }}>
              <strong>{day.getDate()}</strong>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {dayTasks.map(task => (
                  <div key={task.id} style={{ backgroundColor: getStatusColor(task.status) }}>
                    {task.name}
                    <button onClick={() => deleteTask(task.id)}>x</button>
                  </div>
                ))}
                {dayEvents.map(event => (
                  <div key={event.id} style={{ backgroundColor: "#2196F3" }}>
                    {event.title} {event.time && `@${event.time}`}
                    <button onClick={() => deleteEvent(event.id)}>x</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}