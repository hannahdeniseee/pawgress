import { useState } from "react";

// Gets all days of the month
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
  const todayStr = today.toLocaleDateString("en-CA");

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(todayStr);

  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState(todayStr);

  // Add task
  const addTask = () => {
    if (!newTask.trim()) return;

    setTasks([...tasks, { id: Date.now(), name: newTask, status: "uncompleted", deadline: taskDeadline }]);
    setNewTask("");
  };

  // Toggle task status
  const toggleStatus = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const nextStatus = task.status === "uncompleted"
          ? "in progress"
          : task.status === "in progress"
          ? "completed"
          : "uncompleted";
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  // Delete task
  const deleteTask = (id) => setTasks(tasks.filter(task => task.id !== id));

  // Add event
  const addEvent = () => {
    if (!eventTitle.trim()) return;
    setEvents([...events, { 
      id: Date.now(), 
      title: eventTitle, 
      time: eventTime, 
      venue: eventVenue, 
      date: eventDate 
    }]);
    setEventTitle("");
    setEventTime("");
    setEventVenue("");
  };

  // Delete event
  const deleteEvent = (id) => setEvents(events.filter(event => event.id !== id));

  // Group tasks and events by date
  const tasksByDate = tasks.reduce((acc, task) => {
    acc[task.deadline] = acc[task.deadline] || [];
    acc[task.deadline].push(task);
    return acc;
  }, {});

  const eventsByDate = events.reduce((acc, event) => {
    acc[event.date] = acc[event.date] || [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const days = getDaysInMonth(today.getFullYear(), today.getMonth());
  const firstDayWeekday = days[0].getDay(); // 0 = Sunday

  // Status Color
  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "#4CAF50";
      case "in progress": return "#FFC107";
      default: return "#f44336";
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Todo Calendar + Events</h2>

      {/* Task Input */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="New task"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <input
          type="date"
          value={taskDeadline}
          onChange={e => setTaskDeadline(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button
          onClick={addTask}
          style={{ padding: "10px 20px", borderRadius: "5px", border: "none", backgroundColor: "#4CAF50", color: "#fff", cursor: "pointer" }}
        >
          Add Task
        </button>
      </div>

      {/* Event Input */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Event title"
          value={eventTitle}
          onChange={e => setEventTitle(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <input
          type="time"
          value={eventTime}
          onChange={e => setEventTime(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", width: "120px" }}
        />
        <input
          type="text"
          placeholder="Venue"
          value={eventVenue}
          onChange={e => setEventVenue(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", flex: 1 }}
        />
        <input
          type="date"
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button
          onClick={addEvent}
          style={{ padding: "10px 20px", borderRadius: "5px", border: "none", backgroundColor: "#2196F3", color: "#fff", cursor: "pointer" }}
        >
          Add Event
        </button>
      </div>

      {/* Today's Tasks + Events */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Today's Tasks & Events ({todayStr})</h3>
         <p>So sorry I am sick (w/ flu-like symptoms) will update this later on - Hannah :(</p>

        {/* Tasks */}
        {tasksByDate[todayStr]?.length ? (
          <ul style={{ padding: 0, listStyle: "none" }}>
            {tasksByDate[todayStr].map(task => (
              <li key={task.id} style={{ marginBottom: "5px" }}>
                <span
                  onClick={() => toggleStatus(task.id)}
                  style={{
                    textDecoration: task.status === "completed" ? "line-through" : "none",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  {task.name}
                </span>
                <span
                  style={{
                    padding: "2px 6px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    backgroundColor: getStatusColor(task.status),
                    color: "#fff",
                    marginRight: "5px"
                  }}
                >
                  {task.status}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    padding: "2px 6px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#e53935",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : <p>No tasks for today!</p>}

        {/* Events */}
        {eventsByDate[todayStr]?.length ? (
          <ul style={{ padding: 0, listStyle: "none" }}>
            {eventsByDate[todayStr].map(event => (
              <li key={event.id} style={{ marginBottom: "5px" }}>
                <strong>{event.title}</strong> - {event.time} @ {event.venue}
                <button
                  onClick={() => deleteEvent(event.id)}
                  style={{
                    padding: "2px 6px",
                    fontSize: "12px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#e53935",
                    color: "#fff",
                    cursor: "pointer",
                    marginLeft: "10px"
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : <p>No events for today!</p>}
      </div>

      {/* Calendar Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: "5px"
      }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day}>{day}</div>)}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
        {Array(firstDayWeekday).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {getDaysInMonth(today.getFullYear(), today.getMonth()).map(day => {
          const dateStr = day.toLocaleDateString("en-CA");
          return (
            <div key={dateStr} style={{
              minHeight: "120px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "5px",
              boxSizing: "border-box",
              backgroundColor: "#f9f9f9",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{day.getDate()}</div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {/* Tasks */}
                {(tasksByDate[dateStr] || []).map(task => (
                  <div key={task.id} style={{
                    padding: "2px 5px",
                    borderRadius: "5px",
                    backgroundColor: getStatusColor(task.status),
                    color: "#fff",
                    fontSize: "12px",
                    marginBottom: "3px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span onClick={() => toggleStatus(task.id)}>{task.name}</span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{
                        backgroundColor: "#e53935",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "1px 4px",
                        cursor: "pointer",
                        fontSize: "10px"
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}

                {/* Events */}
                {(eventsByDate[dateStr] || []).map(event => (
                  <div key={event.id} style={{
                    padding: "2px 5px",
                    borderRadius: "5px",
                    backgroundColor: "#2196F3",
                    color: "#fff",
                    fontSize: "12px",
                    marginBottom: "3px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span>{event.title} {event.time && `@ ${event.time}`}</span>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      style={{
                        backgroundColor: "#e53935",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "1px 4px",
                        cursor: "pointer",
                        fontSize: "10px"
                      }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
