import { useState, useMemo, useEffect } from "react";
import "../styles/Quests.css";

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
const nxt = (s) => {
  if (s === "completed") return "completed";
  if (s === "uncompleted") return "in progress";
  if (s === "in progress") return "completed";
  return s;
};

// Milestone rewards
const DAILY_MILESTONE_COINS = 50;
const DAILY_MILESTONE_XP = 75;
const WEEKLY_MILESTONE_COINS = 200;
const WEEKLY_MILESTONE_XP = 300;

const TASK_MIN_DURATION_MS = 5 * 60 * 1000;

const API_BASE = "http://localhost:5000/api";

function TodoCalendarWithQuests({ currentUser }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toLocaleDateString('en-CA');

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(todayStr);
  const [events, setEvents] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState(todayStr);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [rewardNotification, setRewardNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTasks, setProcessingTasks] = useState(new Set());
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Track claimed milestones
  const [claimedDailyMilestone, setClaimedDailyMilestone] = useState(false);
  const [claimedWeeklyMilestone, setClaimedWeeklyMilestone] = useState(false);

  // Helpers for timer before task completion
  const getTaskStartKey = (taskId) => `task_start_${taskId}`;

  const recordTaskStart = (taskId) => {
    localStorage.setItem(getTaskStartKey(taskId), Date.now().toString());
  };

  const clearTaskStart = (taskId) => {
    localStorage.removeItem(getTaskStartKey(taskId));
  };

  const checkTaskTimer = (taskId) => {
    const startTime = localStorage.getItem(getTaskStartKey(taskId));
    if (!startTime) {
      return { allowed: false, remainingSeconds: Math.ceil(TASK_MIN_DURATION_MS / 1000) };
    }
    const elapsed = Date.now() - parseInt(startTime, 10);
    const remaining = TASK_MIN_DURATION_MS - elapsed;
    if (remaining <= 0) {
      return { allowed: true, remainingSeconds: 0 };
    }
    return { allowed: false, remainingSeconds: Math.ceil(remaining / 1000) };
  };

  const formatRemainingTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Show tutorial on first visit
  useEffect(() => {
    const tutorialShown = localStorage.getItem("task_tutorial_shown");
    if (!tutorialShown) {
      setShowTutorial(true);
      setTimeout(() => {
        setShowTutorial(false);
        localStorage.setItem("task_tutorial_shown", "true");
      }, 5000);
    }
  }, []);

  const updateUserRewards = async (coinsEarned, xpEarned, message, isMilestone = false) => {
    console.log(`📊 GIVING REWARDS: +${coinsEarned} coins, +${xpEarned} XP`);
    
    if (currentUser?.id && coinsEarned > 0) {
      try {
        await fetch(`${API_BASE}/users/${currentUser.id}/coins`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: coinsEarned })
        });
        console.log(`✅ Synced +${coinsEarned} coins to backend`);
      } catch (err) {
        console.error("Failed to sync coins:", err);
      }
    }
    
    const savedUser = localStorage.getItem("user_data");
    let user = { coins: 0, xp: 0 };
    
    if (savedUser) {
      user = JSON.parse(savedUser);
    }
    
    user.coins = (user.coins || 0) + coinsEarned;
    user.xp = (user.xp || 0) + xpEarned;
    localStorage.setItem("user_data", JSON.stringify(user));
    
    setRewardNotification({ 
      coins: coinsEarned, 
      xp: xpEarned, 
      message, 
      isMilestone,
      totalCoins: user.coins,
      totalXp: user.xp
    });
    setTimeout(() => setRewardNotification(null), 4000);
    window.dispatchEvent(new CustomEvent('userRewardsUpdated', { detail: user }));
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getWeekEnd = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day));
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const checkAndAwardMilestones = (updatedTasks) => {
    console.log("🔍 Checking milestones...");
    
    const todayTasks = updatedTasks.filter(t => {
      const taskDate = t.deadline ? t.deadline.split('T')[0] : t.deadline;
      return taskDate === todayStr && t.status === "completed";
    });
    const dailyCompleted = todayTasks.length;
    
    if (dailyCompleted >= 5 && !claimedDailyMilestone) {
      console.log("🎯 DAILY MILESTONE REACHED!");
      setClaimedDailyMilestone(true);
      localStorage.setItem("claimed_daily_milestone", "true");
      updateUserRewards(
        DAILY_MILESTONE_COINS, 
        DAILY_MILESTONE_XP, 
        `🌟 DAILY QUEST COMPLETE! 🌟\nCompleted 5 tasks today!\n+${DAILY_MILESTONE_COINS} coins, +${DAILY_MILESTONE_XP} XP!`,
        true
      );
      return true;
    }
    
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    const weekTasks = updatedTasks.filter(t => {
      if (t.status !== "completed") return false;
      const taskDate = new Date(t.deadline);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
    const weeklyCompleted = weekTasks.length;
    
    if (weeklyCompleted >= 20 && !claimedWeeklyMilestone) {
      console.log("🏆 WEEKLY MILESTONE REACHED!");
      setClaimedWeeklyMilestone(true);
      localStorage.setItem("claimed_weekly_milestone", "true");
      updateUserRewards(
        WEEKLY_MILESTONE_COINS, 
        WEEKLY_MILESTONE_XP, 
        `🏆 WEEKLY QUEST COMPLETE! 🏆\nCompleted 20 tasks this week!\n+${WEEKLY_MILESTONE_COINS} coins, +${WEEKLY_MILESTONE_XP} XP!`,
        true
      );
      return true;
    }
    
    return false;
  };

  // Load tasks from backend
  const loadTasksFromBackend = async () => {
    if (!currentUser?.id) return [];
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        console.log("✅ Loaded tasks from backend:", data.length);
        return data;
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
    return [];
  };

  const loadEventsFromBackend = async () => {
    if (!currentUser?.id) return [];
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        console.log("✅ Loaded events from backend:", data.length);
        return data;
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    }
    return [];
  };

  const saveTaskToBackend = async (task) => {
    if (!currentUser?.id) return null;
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: task.name, deadline: task.deadline })
      });
      if (res.ok) {
        const saved = await res.json();
        console.log("✅ Task saved to backend:", saved);
        return saved;
      }
    } catch (err) {
      console.error("Failed to save task:", err);
    }
    return null;
  };

  const updateTaskStatusInBackend = async (taskId, status) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to update task status:", err);
      return false;
    }
  };

  const deleteTaskFromBackend = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "DELETE"
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to delete task:", err);
      return false;
    }
  };

  const saveEventToBackend = async (event) => {
    if (!currentUser?.id) return null;
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: event.title, 
          date: event.date,
          time: event.time,
          venue: event.venue
        })
      });
      if (res.ok) {
        const saved = await res.json();
        console.log("✅ Event saved to backend:", saved);
        return saved;
      }
    } catch (err) {
      console.error("Failed to save event:", err);
    }
    return null;
  };

  const deleteEventFromBackend = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}`, {
        method: "DELETE"
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to delete event:", err);
      return false;
    }
  };

  // Reset milestone claims
  useEffect(() => {
    if (!isLoading) {
      const savedDailyDate = localStorage.getItem("claimed_daily_date");
      const todayDate = new Date().toDateString();
      
      if (savedDailyDate !== todayDate) {
        setClaimedDailyMilestone(false);
        localStorage.setItem("claimed_daily_date", todayDate);
        localStorage.setItem("claimed_daily_milestone", "false");
      } else {
        const savedDailyClaim = localStorage.getItem("claimed_daily_milestone");
        setClaimedDailyMilestone(savedDailyClaim === "true");
      }
      
      const savedWeeklyWeek = localStorage.getItem("claimed_weekly_week");
      const currentWeek = `${getWeekStart(today).toDateString()}`;
      
      if (savedWeeklyWeek !== currentWeek) {
        setClaimedWeeklyMilestone(false);
        localStorage.setItem("claimed_weekly_week", currentWeek);
        localStorage.setItem("claimed_weekly_milestone", "false");
      } else {
        const savedWeeklyClaim = localStorage.getItem("claimed_weekly_milestone");
        setClaimedWeeklyMilestone(savedWeeklyClaim === "true");
      }
    }
  }, [isLoading, today]);

  // LOAD DATA - from backend on mount
  useEffect(() => {
    const loadData = async () => {
      console.log("Loading data from backend...");
      
      if (currentUser?.id) {
        await loadTasksFromBackend();
        await loadEventsFromBackend();
      }
      
      const savedUser = localStorage.getItem("user_data");
      if (!savedUser) {
        localStorage.setItem("user_data", JSON.stringify({ coins: 0, xp: 0 }));
      }
      
      const savedDailyDate = localStorage.getItem("claimed_daily_date");
      const todayDate = new Date().toDateString();
      
      if (savedDailyDate !== todayDate) {
        localStorage.setItem("claimed_daily_date", todayDate);
        localStorage.setItem("claimed_daily_milestone", "false");
        setClaimedDailyMilestone(false);
      } else {
        const savedDailyClaim = localStorage.getItem("claimed_daily_milestone");
        setClaimedDailyMilestone(savedDailyClaim === "true");
      }
      
      const savedWeeklyWeek = localStorage.getItem("claimed_weekly_week");
      const currentWeek = `${getWeekStart(today).toDateString()}`;
      
      if (savedWeeklyWeek !== currentWeek) {
        localStorage.setItem("claimed_weekly_week", currentWeek);
        localStorage.setItem("claimed_weekly_milestone", "false");
        setClaimedWeeklyMilestone(false);
      } else {
        const savedWeeklyClaim = localStorage.getItem("claimed_weekly_milestone");
        setClaimedWeeklyMilestone(savedWeeklyClaim === "true");
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [currentUser]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    const newTaskObj = { 
      name: newTask, 
      deadline: taskDeadline, 
      status: "uncompleted" 
    };
    
    const savedTask = await saveTaskToBackend(newTaskObj);
    if (savedTask) {
      setTasks(prev => [...prev, savedTask]);
      console.log("✅ Task added to backend:", savedTask);
    } else {
      console.error("Failed to save task to backend");
      alert("Failed to save task. Make sure backend is running.");
    }
    setNewTask("");
  };

  const toggleStatus = async (task) => {
    if (processingTasks.has(task.id)) {
      console.log(`⚠️ Task ${task.id} already processing, skipping`);
      return;
    }
    
    const next = nxt(task.status);
    if (next === task.status) return;

    if (task.status === "uncompleted" && next === "in progress") {
      recordTaskStart(task.id);
    }

    if (task.status === "in progress" && next === "completed") {
      const { allowed, remainingSeconds } = checkTaskTimer(task.id);
      if (!allowed) {
        alert(
          `Sorry, you cannot immediately mark this task as complete.\n\n` +
          `Please try again later.\n\n`
        );
        return;
      }
      clearTaskStart(task.id);
    }

    setProcessingTasks(prev => new Set([...prev, task.id]));
    
    try {    
      const success = await updateTaskStatusInBackend(task.id, next);
      
      if (success) {
        setTasks(prev => {
          const updatedTasks = prev.map(t => 
            t.id === task.id ? { ...t, status: next } : t
          );
          
          if (next === "completed" && task.status !== "completed") {
            console.log(`🎯 TASK COMPLETED! Checking milestones...`);
            checkAndAwardMilestones(updatedTasks);
          }
          
          return updatedTasks;
        });
      }
      
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
    } finally {
      setTimeout(() => {
        setProcessingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(task.id);
          return newSet;
        });
      }, 500);
    }
  };

  const deleteTask = async (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete && taskToDelete.status === "completed") {
      alert("Completed tasks cannot be deleted!");
      return;
    }
    
    await deleteTaskFromBackend(id);
    clearTaskStart(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  };

  const addEvent = async () => {
    if (!eventTitle.trim()) return;
    const formattedDate = eventDate || todayStr;
    const newEvent = { 
      title: eventTitle, 
      date: formattedDate,
      time: eventTime, 
      venue: eventVenue 
    };
    
    const savedEvent = await saveEventToBackend(newEvent);
    if (savedEvent) {
      setEvents(prev => [...prev, savedEvent]);
      console.log("✅ Event added to backend:", savedEvent);
    } else {
      console.error("Failed to save event to backend");
      alert("Failed to save event. Make sure backend is running.");
    }
    setEventTitle("");
    setEventTime("");
    setEventVenue("");
  };

  const deleteEvent = async (id) => {
    await deleteEventFromBackend(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const tasksByDate = useMemo(() =>
    tasks.reduce((acc, t) => { 
      const taskDate = t.deadline ? t.deadline.split('T')[0] : t.deadline;
      (acc[taskDate] ??= []).push(t);
      return acc; 
    }, {}),
    [tasks]
  );

  const eventsByDate = useMemo(() =>
    events.reduce((acc, e) => { 
      const eventDate = e.date.split('T')[0];
      (acc[eventDate] ??= []).push(e);
      return acc; 
    }, {}),
    [events]
  );

  const quests = useMemo(() => {
    const todayTasks = tasks.filter(t => {
      const taskDate = t.deadline ? t.deadline.split('T')[0] : t.deadline;
      return taskDate === todayStr && t.status === "completed";
    });
    const dailyDone = todayTasks.length;

    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    const weekTasks = tasks.filter(t => {
      if (t.status !== "completed") return false;
      const taskDate = new Date(t.deadline);
      return taskDate >= weekStart && taskDate <= weekEnd;
    });
    const weekDone = weekTasks.length;

    return [
      { title: "Complete 5 tasks today", target: 5, progress: dailyDone, color: "#1D9E75" },
      { title: "Complete 20 tasks this week", target: 20, progress: weekDone, color: "#4E56C0" },
    ];
  }, [tasks, todayStr]);

  const days = getDaysInMonth(currentYear, currentMonth);
  const firstDayWeekday = days[0]?.getDay() || 0;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Helper to get progress percentage for task
  const getTaskProgress = (status) => {
    if (status === "completed") return 100;
    if (status === "in progress") return 50;
    return 0;
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="quests-root">
      {/* Tutorial Help Tip */}
      {showTutorial && (
        <div className="help-tip">
          💡 <strong>How to use tasks:</strong> Click the "Start Task" or "Mark Complete" buttons to change task status. 
          Complete tasks to earn coins and XP! 🎉
        </div>
      )}

      {rewardNotification && (
        <div className={`reward-toast ${rewardNotification.isMilestone ? 'milestone' : ''}`}>
          <div className="reward-toast-icon">
            {rewardNotification.isMilestone ? '🏆' : '✅'}
          </div>
          <div className="reward-toast-content">
            <div className="reward-toast-message">{rewardNotification.message}</div>
            <div className="reward-toast-total">
              Total: {rewardNotification.totalCoins} 🐾 coins | {rewardNotification.totalXp} ⭐ XP
            </div>
          </div>
        </div>
        
      )}
      {/* Permanent Instructions Box */}
      <div className="instructions-permanent">
        <div className="instructions-permanent-header">
          <span>📋 How to use tasks</span>
        </div>
        <div className="instructions-permanent-content">
          <span>① Add a task → ② Click <strong>Start Task</strong> → ③ Click <strong>Mark Complete</strong> → 🎉 Get rewards!</span>
        </div>
      </div>
      
      {/* Main Quests Card */}
      <div className="quests-card">
        <div className="quests-header">
          <span className="quests-title">🍅 Quests & Tasks</span>
        </div>

        <div className="quests-panel">
          <div>
            <div className="quests-section-header">Quests</div>
            {quests.map((q) => (
              <div key={q.title} className="quest-card">
                <div className="quest-header">
                  <span className="quest-title">{q.title}{q.progress >= q.target ? " ✓" : ""}</span>
                  <span className="quest-progress-text">{q.progress} / {q.target}</span>
                </div>
                <div className="quest-progress-bar">
                  <div className="quest-progress-fill" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%`, background: q.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="today-section">
            <div className="today-header">Today — {todayStr}</div>
            {!(tasksByDate[todayStr]?.length || eventsByDate[todayStr]?.length) && (
              <div className="empty-state">✨ No tasks or events today</div>
            )}
            
            {/* Enhanced Task Items with Buttons */}
            {(tasksByDate[todayStr] || []).map((task) => (
              <div key={task.id} className="task-item-enhanced">
                <div className="task-info">
                  <div className="task-name">{task.name}</div>
                  <div className="task-deadline">📅 Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</div>
                  
                  {/* Progress Bar */}
                  <div className="task-progress">
                    <div className="step-labels">
                      <span>Not Started</span>
                      <span>In Progress</span>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
                
                <div className="task-status-control">
                  {task.status === "uncompleted" && (
                    <div className="status-section">
                      <span className="status-label status-uncompleted-label">📋 Not Started</span>
                      <button 
                        className="action-btn start-btn"
                        onClick={() => toggleStatus(task)}
                      >
                        Start Task →
                      </button>
                    </div>
                  )}
                  
                  {task.status === "in progress" && (
                    <div className="status-section">
                      <span className="status-label status-progress-label">⚡ In Progress</span>
                      <button 
                        className="action-btn complete-btn"
                        onClick={() => toggleStatus(task)}
                      >
                        ✓ Mark Complete
                      </button>
                    </div>
                  )}
                  
                  {task.status === "completed" && (
                    <div className="status-section">
                      <span className="status-label status-completed-label">✅ Completed!</span>
                    </div>
                  )}
                </div>
                
                <button 
                  className="delete-task-btn" 
                  onClick={() => deleteTask(task.id)}
                  disabled={task.status === "completed"}
                  style={{ opacity: task.status === "completed" ? 0.5 : 1 }}
                >
                  🗑️
                </button>
              </div>
            ))}
            
            {/* Events remain the same */}
            {(eventsByDate[todayStr] || []).map((ev) => (
              <div key={ev.id} className="event-item">
                <div className="task-status-dot" style={{ background: "#4E56C0" }} />
                <span className="task-name">{ev.title}</span>
                <span style={{ fontSize: 14, color: "#8890d8" }}>{ev.time && `${ev.time} `}{ev.venue && `@ ${ev.venue}`}</span>
                <button className="delete-btn" onClick={() => deleteEvent(ev.id)}>×</button>
              </div>
            ))}
          </div>

          <div className="add-section">
            <div className="add-title">➕ Add Task</div>
            <div className="form-row">
              <input className="quest-input" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Task name" />
              <input className="quest-input" type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} style={{ maxWidth: 140 }} />
              <button className="quest-btn" onClick={addTask}>Add Task</button>
            </div>
          </div>

          <div className="add-section">
            <div className="add-title">📅 Add Event</div>
            <div className="form-row">
              <input className="quest-input" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEvent()} placeholder="Event title" />
              <input className="quest-input" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} style={{ maxWidth: 100 }} />
              <input className="quest-input" value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} placeholder="Venue" style={{ maxWidth: 120 }} />
              <input className="quest-input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={{ maxWidth: 130 }} />
              <button className="quest-btn" onClick={addEvent}>Add Event</button>
            </div>
          </div>
        </div>
      </div>

      {/* Separate Wider Calendar Box */}
      <div className="calendar-wrapper">
        <div className="calendar-header">
          <div className="calendar-title">
            <span>📅</span>
            <span>Calendar</span>
          </div>
          <div className="calendar-nav-group">
            <button className="calendar-nav-btn" onClick={goToPreviousMonth}>←</button>
            <span className="calendar-month-year" onClick={goToCurrentMonth}>
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button className="calendar-nav-btn" onClick={goToNextMonth}>→</button>
          </div>
        </div>
        <div className="calendar-container">
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="calendar-day-header">{d}</div>
            ))}
            {Array(firstDayWeekday).fill(null).map((_, i) => <div key={`empty-${i}`} className="calendar-empty" />)}
            {days.map((day) => {
              const dateStr = day.toLocaleDateString('en-CA');
              const isToday = dateStr === todayStr;
              const dayTasks = tasksByDate[dateStr] || [];
              const dayEvents = eventsByDate[dateStr] || [];
              const totalItems = dayTasks.length + dayEvents.length;
              const hasMore = totalItems > 2;
              
              return (
                <div key={dateStr} className={`calendar-cell ${isToday ? "today" : ""}`}>
                  <div className="calendar-date">{day.getDate()}</div>
                  <div className="calendar-tasks-list">
                    {dayTasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="calendar-chip chip-task" style={{ background: sBg(task.status), color: sTx(task.status), cursor: "pointer" }} onClick={() => toggleStatus(task)}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px" }}>{task.name}</span>
                        <button 
                          className="chip-delete" 
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          disabled={task.status === "completed"}
                          style={{ opacity: task.status === "completed" ? 0.5 : 1 }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {dayEvents.slice(0, 1).map((ev) => (
                      <div key={ev.id} className="calendar-chip chip-event" onClick={() => setSelectedEvent(ev)} style={{ cursor: "pointer" }}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px" }}>{ev.title}</span>
                        <button className="chip-delete" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}>×</button>
                      </div>
                    ))}
                    {hasMore && (
                      <button 
                        className="view-all-btn"
                        onClick={() => setSelectedDayDetails({ date: dateStr, tasks: dayTasks, events: dayEvents })}
                      >
                        📋 View all ({totalItems})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📌 {selectedEvent.title}</h3>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body">
            <p><strong>📅 Date:</strong> {selectedEvent.date}</p>

            {selectedEvent.title.includes("Study Session") ? (
              <p>
                <strong>📝 Topics:</strong>{" "}
                {selectedEvent.topics || "Not specified"}
              </p>
            ) : (
            <>
              <p><strong>⏰ Time:</strong> {selectedEvent.time || "Not specified"}</p>
              <p><strong>📍 Venue:</strong> {selectedEvent.venue || "Not specified"}</p>
            </>
            )}
            </div>
          </div>
        </div>
      )}

      {selectedDayDetails && (
        <div className="modal-overlay" onClick={() => setSelectedDayDetails(null)}>
          <div className="modal-content day-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 {selectedDayDetails.date}</h3>
              <button className="modal-close" onClick={() => setSelectedDayDetails(null)}>×</button>
            </div>
            <div className="modal-body">
              {selectedDayDetails.tasks.length > 0 && (
                <>
                  <h4 style={{ color: "#4E56C0", marginBottom: "10px" }}>✅ Tasks ({selectedDayDetails.tasks.length})</h4>
                  {selectedDayDetails.tasks.map((task) => (
                    <div key={task.id} className="day-modal-item">
                      <div className={`task-status-dot status-${task.status === "uncompleted" ? "uncompleted" : task.status === "in progress" ? "in-progress" : "completed"}`} />
                      <span onClick={() => { toggleStatus(task); setSelectedDayDetails(null); }} style={{ flex: 1, cursor: "pointer", textDecoration: task.status === "completed" ? "line-through" : "none" }}>
                        {task.name}
                      </span>
                      <span className={`status-badge ${task.status === "uncompleted" ? "uncompleted" : task.status === "in progress" ? "in-progress" : "completed"}`}>
                        {task.status}
                      </span>
                      <button 
                        className="delete-btn" 
                        onClick={() => { deleteTask(task.id); setSelectedDayDetails(null); }}
                        disabled={task.status === "completed"}
                        style={{ opacity: task.status === "completed" ? 0.5 : 1 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </>
              )}

              {selectedDayDetails.events.length > 0 && (
                <>
                  <h4 style={{ color: "#4E56C0", marginBottom: "10px", marginTop: "15px" }}>📌 Events ({selectedDayDetails.events.length})</h4>
                  {selectedDayDetails.events.map((ev) => (
                    <div key={ev.id} className="day-modal-item">
                      <div className="task-status-dot" style={{ background: "#4E56C0" }} />
                      <span style={{ flex: 1 }}>{ev.title}</span>
                      <span style={{ fontSize: 12, color: "#8890d8" }}>{ev.time && `${ev.time} `}{ev.venue && `@ ${ev.venue}`}</span>
                      <button className="delete-btn" onClick={() => { deleteEvent(ev.id); setSelectedDayDetails(null); }}>×</button>
                    </div>
                  ))}
                </>
              )}

              {selectedDayDetails.tasks.length === 0 && selectedDayDetails.events.length === 0 && (
                <p style={{ textAlign: "center", color: "#999" }}>✨ No tasks or events for this day ✨</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodoCalendarWithQuests;