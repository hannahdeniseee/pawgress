import { useState, useMemo, useEffect } from "react";
import "../styles/Quests.css";


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

const DAILY_MILESTONE_COINS = 50;
const DAILY_MILESTONE_XP = 75;
const WEEKLY_MILESTONE_COINS = 200;
const WEEKLY_MILESTONE_XP = 300;
const TASK_MIN_DURATION_MS = 300000;
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
  const [savingTasks, setSavingTasks] = useState(new Set()); // NEW: track tasks being saved
  const [showTutorial, setShowTutorial] = useState(false);
  const [claimedDailyMilestone, setClaimedDailyMilestone] = useState(false);
  const [claimedWeeklyMilestone, setClaimedWeeklyMilestone] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const getTaskStartKey = (taskId) => `task_start_${taskId}`;

  const recordTaskStart = (taskId) => {
    localStorage.setItem(getTaskStartKey(taskId), Date.now().toString());
  };

  const clearTaskStart = (taskId) => {
    localStorage.removeItem(getTaskStartKey(taskId));
  };

  const checkTaskTimer = (taskId) => {
    if (TASK_MIN_DURATION_MS === 0) return { allowed: true, remainingSeconds: 0 };
    
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

  // ============ TUTORIAL & INITIALIZATION ============
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

  // ============ REWARD SYSTEM WITH LEVEL UP ============
  const updateUserRewards = async (coinsEarned, xpEarned, message, isMilestone = false) => {
    console.log(`📊 GIVING REWARDS: +${coinsEarned} coins, +${xpEarned} XP`);
    
    // Update localStorage IMMEDIATELY
    const savedUser = localStorage.getItem("user_data");
    let user = { coins: 0, xp: 0, level: 1 };
    
    if (savedUser) {
      user = JSON.parse(savedUser);
    }
    
    const oldLevel = user.level;
    user.coins = (user.coins || 0) + coinsEarned;
    user.xp = (user.xp || 0) + xpEarned;
    
    // Calculate new level based on XP
    const calculateLevelFromXp = (xp) => {
      if (xp < 100) return 1;
      if (xp < 300) return 2;
      if (xp < 600) return 3;
      if (xp < 1000) return 4;
      if (xp < 1500) return 5;
      if (xp < 2100) return 6;
      if (xp < 2800) return 7;
      if (xp < 3600) return 8;
      if (xp < 4500) return 9;
      return 10;
    };
    
    const newLevel = calculateLevelFromXp(user.xp);
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      user.level = newLevel;
    }
    
    localStorage.setItem("user_data", JSON.stringify(user));
    
    // Show notification
    if (leveledUp) {
      setRewardNotification({ 
        coins: coinsEarned, 
        xp: xpEarned, 
        message: `🎉 LEVEL UP! 🎉\nYou reached Level ${newLevel}!\n+${xpEarned} XP!`,
        isMilestone: true,
        totalCoins: user.coins,
        totalXp: user.xp,
        isLevelUp: true
      });
      setLevelUpInfo({ oldLevel, newLevel });
      setTimeout(() => setLevelUpInfo(null), 5000);
    } else {
      setRewardNotification({ 
        coins: coinsEarned, 
        xp: xpEarned, 
        message, 
        isMilestone,
        totalCoins: user.coins,
        totalXp: user.xp,
        isLevelUp: false
      });
    }
    
    setTimeout(() => setRewardNotification(null), 4000);
    window.dispatchEvent(new CustomEvent('userRewardsUpdated', { detail: user }));
    
    // Sync to backend in background
    if (currentUser?.id) {
      if (coinsEarned > 0) {
        fetch(`${API_BASE}/users/${currentUser.id}/coins`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: coinsEarned })
        }).catch(err => console.error("Failed to sync coins:", err));
      }
      
      if (xpEarned > 0) {
        fetch(`${API_BASE}/users/${currentUser.id}/xp`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ xpGained: xpEarned })
        }).catch(err => console.error("Failed to sync XP:", err));
      }
    }
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

  // ============ QUESTS & MILESTONES ============
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


  // ============ BACKEND API CALLS ============
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

  // ============ MILESTONE RESET ON NEW DAY/WEEK ============
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
        localStorage.setItem("user_data", JSON.stringify({ coins: 0, xp: 0, level: 1 }));
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

  // ============ CALENDAR NAVIGATION ============
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

  // ============ TASK MANAGEMENT (OPTION 1 - DISABLE DURING SAVE) ============
  const addTask = async () => {
    if (!newTask.trim()) return;
    
    const tempId = Date.now();
    const newTaskObj = { 
      id: tempId,
      name: newTask, 
      deadline: taskDeadline, 
      status: "uncompleted" 
    };
    
    // Mark as saving
    setSavingTasks(prev => new Set([...prev, tempId]));
    
    // Update UI immediately
    setTasks(prev => [...prev, newTaskObj]);
    setNewTask("");
    
    // Save to backend
    const savedTask = await saveTaskToBackend(newTaskObj);
    if (savedTask) {
      // Replace temp task with real task from backend
      setTasks(prev => prev.map(t => t.id === tempId ? savedTask : t));
    } else {
      // Remove failed task
      setTasks(prev => prev.filter(t => t.id !== tempId));
      alert("Failed to save task. Make sure backend is running.");
    }
    
    // Remove from saving set
    setSavingTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(tempId);
      return newSet;
    });
  };

  const toggleStatus = async (task) => {
    // Check if task is still being saved
    if (savingTasks.has(task.id)) {
      alert("Task is still saving, please wait...");
      return;
    }
    
    // Prevent double clicks
    if (processingTasks.has(task.id)) {
      return;
    }
    
    // Determine next status
    let newStatus;
    if (task.status === "uncompleted") {
      newStatus = "in progress";
    } else if (task.status === "in progress") {
      newStatus = "completed";
    } else {
      return; // Already completed - do nothing
    }
    
    // Timer check for completing tasks
    if (task.status === "in progress" && newStatus === "completed") {
      if (TASK_MIN_DURATION_MS > 0) {
        const { allowed, remainingSeconds } = checkTaskTimer(task.id);
        if (!allowed) {
          const minutes = Math.floor(remainingSeconds / 60);
          const seconds = remainingSeconds % 60;
          alert(`Please wait ${minutes}m ${seconds}s before marking as complete.`);
          return;
        }
        clearTaskStart(task.id);
      }
    }
    
    // Record start time
    if (task.status === "uncompleted" && newStatus === "in progress") {
      recordTaskStart(task.id);
    }
    
    // Mark as processing
    setProcessingTasks(prev => new Set([...prev, task.id]));
    
    // UPDATE UI IMMEDIATELY
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);
    
    // Check milestones if completed
    if (newStatus === "completed") {
      checkAndAwardMilestones(updatedTasks);
    }
    
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
    
    // Sync to backend (don't wait)
    updateTaskStatusInBackend(task.id, newStatus).catch(err => {
      console.error("Failed to sync task status:", err);
    });
    
    // Remove processing flag after delay
    setTimeout(() => {
      setProcessingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }, 500);
  };

  const deleteTask = async (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete?.status === "completed") {
      alert("Completed tasks cannot be deleted!");
      return;
    }
    
    // Check if task is still being saved
    if (savingTasks.has(id)) {
      alert("Task is still saving, please wait...");
      return;
    }
    
    // Update UI immediately
    setTasks(prev => prev.filter(t => t.id !== id));
    clearTaskStart(id);
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
    
    // Delete from backend
    await deleteTaskFromBackend(id);
  };

  // ============ EVENT MANAGEMENT ============
  const addEvent = async () => {
    if (!eventTitle.trim()) return;
    const formattedDate = eventDate || todayStr;
    
    const tempId = Date.now();
    const newEvent = { 
      id: tempId,
      title: eventTitle, 
      date: formattedDate,
      time: eventTime, 
      venue: eventVenue 
    };
    
    // Update UI immediately
    setEvents(prev => [...prev, newEvent]);
    setEventTitle("");
    setEventTime("");
    setEventVenue("");
    
    // Save to backend
    const savedEvent = await saveEventToBackend(newEvent);
    if (savedEvent) {
      setEvents(prev => prev.map(e => e.id === tempId ? savedEvent : e));
    } else {
      setEvents(prev => prev.filter(e => e.id !== tempId));
      alert("Failed to save event. Make sure backend is running.");
    }
  };

  const deleteEvent = async (id) => {
    // Update UI immediately
    setEvents(prev => prev.filter(e => e.id !== id));
    
    // Delete from backend
    await deleteEventFromBackend(id);
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="quests-root">
      {levelUpInfo && (
        <div className="level-up-animation">
          <div className="level-up-content">
            <span className="level-up-icon">🎉</span>
            <span className="level-up-text">LEVEL {levelUpInfo.newLevel}!</span>
            <span className="level-up-icon">🎉</span>
          </div>
        </div>
      )}

      {showTutorial && (
        <div className="help-tip">
          💡 <strong>How to use tasks:</strong> Click "Start Task" to begin, then "Mark Complete" when finished! 🎉
        </div>
      )}

      {rewardNotification && (
        <div className={`reward-toast ${rewardNotification.isMilestone ? 'milestone' : ''} ${rewardNotification.isLevelUp ? 'level-up' : ''}`}>
          <div className="reward-toast-icon">
            {rewardNotification.isLevelUp ? '🎮' : rewardNotification.isMilestone ? '🏆' : '✅'}
          </div>
          <div className="reward-toast-content">
            <div className="reward-toast-message">{rewardNotification.message}</div>
            <div className="reward-toast-total">
              Total: {rewardNotification.totalCoins} 🐾 coins | {rewardNotification.totalXp} ⭐ XP
            </div>
          </div>
        </div>
      )}
      
      <div className="instructions-permanent">
        <div className="instructions-permanent-header">
          <span>📋 How to use tasks</span>
        </div>
        <div className="instructions-permanent-content">
          <span>① Add a task → ② Click <strong>Start Task</strong> → ③ Click <strong>Mark Complete</strong> → 🎉 Get rewards!</span>
        </div>
      </div>
      
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
            
            {(tasksByDate[todayStr] || []).map((task) => (
              <div key={task.id} className="task-item-enhanced">
                <div className="task-info">
                  <div className="task-name">{task.name}</div>
                  <div className="task-deadline">📅 Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</div>
                </div>
                
                <div className="task-status-control">
                  {task.status === "uncompleted" && (
                    <div className="status-section">
                      <span className="status-label status-uncompleted-label">📋 Not Started</span>
                      <button 
                        className="action-btn start-btn"
                        onClick={() => toggleStatus(task)}
                        disabled={savingTasks.has(task.id)}
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
                        disabled={savingTasks.has(task.id)}
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
                  disabled={task.status === "completed" || savingTasks.has(task.id)}
                  style={{ opacity: (task.status === "completed" || savingTasks.has(task.id)) ? 0.5 : 1 }}
                >
                  🗑️
                </button>
              </div>
            ))}
            
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
                          disabled={task.status === "completed" || savingTasks.has(task.id)}
                          style={{ opacity: (task.status === "completed" || savingTasks.has(task.id)) ? 0.5 : 1 }}
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
                <p><strong>📝 Topics:</strong> {selectedEvent.topics || "Not specified"}</p>
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
                        disabled={task.status === "completed" || savingTasks.has(task.id)}
                        style={{ opacity: (task.status === "completed" || savingTasks.has(task.id)) ? 0.5 : 1 }}
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