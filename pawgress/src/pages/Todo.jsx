import { useState } from "react";

export default function Todo() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), name: newTask, status: "uncompleted" }]);
    setNewTask("");
  };

  const removeTask = (id) => setTasks(tasks.filter(task => task.id !== id));

  const toggleStatus = (id) => {
    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, status: task.status === "completed" ? "uncompleted" : "completed" }
        : task
    ));
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "40px" }}>
      <h2 style={{ marginBottom: "20px", color: "#222" }}>My Todo List</h2>

      {/* Input */}
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Enter a new task"
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "16px",
          border: "1px solid #ccc",
          borderRadius: "12px",
          marginBottom: "10px",
          boxSizing: "border-box",
          height: "50px"
        }}
      />

      {/* Add Button */}
      <button
        onClick={addTask}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "16px",
          border: "1px solid #4CAF50",
          borderRadius: "12px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
          height: "50px",
          marginBottom: "20px",
          transition: "background 0.2s"
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = "#45a049"}
        onMouseOut={e => e.currentTarget.style.backgroundColor = "#4CAF50"}
      >
        Add
      </button>

      {/* Tasks */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {tasks.map(task => (
          <li key={task.id} style={{
            display: "block",
            padding: "12px 15px",
            marginBottom: "10px",
            borderRadius: "12px",
            backgroundColor: "#f5f5f5",
            boxShadow: "0 3px 6px rgba(0,0,0,0.05)"
          }}>
            <span
              onClick={() => toggleStatus(task.id)}
              style={{
                cursor: "pointer",
                fontSize: "16px",
                textDecoration: task.status === "completed" ? "line-through" : "none",
                color: task.status === "completed" ? "#888" : "#222",
                marginRight: "10px"
              }}
            >
              {task.name}
            </span>

            <span style={{
              fontSize: "13px",
              fontWeight: "bold",
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: task.status === "completed" ? "#4CAF50" : "#f44336",
              color: "#fff",
              marginRight: "10px"
            }}>
              {task.status}
            </span>

            <button
              onClick={() => removeTask(task.id)}
              style={{
                backgroundColor: "#e53935",
                color: "#fff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "background 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#d32f2f"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#e53935"}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}