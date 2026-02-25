import { useState } from "react";

export default function Todo() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  // Add task
  const addTask = () => {
    if (!newTask.trim()) return;
    const taskObject = {
      id: Date.now(),
      name: newTask,
      status: "uncompleted",
    };
    setTasks([...tasks, taskObject]);
    setNewTask("");
  };

  // Remove task
  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Toggle status
  const toggleStatus = (id) => {
    setTasks(
      tasks.map(task =>
        task.id === id
          ? { ...task, status: task.status === "completed" ? "uncompleted" : "completed" }
          : task
      )
    );
  };

  return (
    <div>
      <h3>Todo List</h3>
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Enter task"
      />
      <button onClick={addTask}>Add</button>

      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <span
              onClick={() => toggleStatus(task.id)}
              style={{
                textDecoration: task.status === "completed" ? "line-through" : "none",
                cursor: "pointer"
              }}
            >
              {task.name} ({task.status})
            </span>
            <button onClick={() => removeTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}