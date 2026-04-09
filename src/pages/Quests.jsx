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
const nxt = (s) => s === "uncompleted" ? "in progress" : s === "in progress" ? "completed" : "uncompleted";

// Reward amounts
const COINS_PER_TASK = 5;
const XP_PER_TASK = 10;

// Milestone rewards
const DAILY_MILESTONE_COINS = 50;
const DAILY_MILESTONE_XP = 75;
const WEEKLY_MILESTONE_COINS = 200;
const WEEKLY_MILESTONE_XP = 300;

let _id = 1;
const uid = () => _id++;

function TodoCalendarWithQuests() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

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
  const [rewardNotification, setRewardNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track claimed milestones to prevent duplicate rewards
  const [claimedDailyMilestone, setClaimedDailyMilestone] = useState(false);
  const [claimedWeeklyMilestone, setClaimedWeeklyMilestone] = useState(false);

  const updateUserRewards = (coinsEarned, xpEarned, message, isMilestone = false) => {
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

  // Helper to get start of week (Sunday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Helper to get end of week (Saturday)
  const getWeekEnd = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day));
    d.setHours(23, 59, 59, 999);
    return d;
  };

  // Check and award milestones
  const checkMilestones = (updatedTasks) => {
    // Daily milestone: 5 completed tasks today
    const todayTasks = updatedTasks.filter(t => t.deadline === todayStr && t.status === "completed");
    const dailyCompleted = todayTasks.length;
    
    if (dailyCompleted >= 5 && !claimedDailyMilestone) {
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
    
    // Weekly milestone: 20 completed tasks this week
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    const weekTasks = updatedTasks.filter(t => {
      const taskDate = new Date(t.deadline + "T00:00:00");
      return t.status === "completed" && taskDate >= weekStart && taskDate <= weekEnd;
    });
    const weeklyCompleted = weekTasks.length;
    
    if (weeklyCompleted >= 20 && !claimedWeeklyMilestone) {
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

  // Reset milestone claims when tasks change (for new day/week)
  useEffect(() => {
    if (!isLoading) {
      // Check if daily milestone should reset (new day)
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
      
      // Check if weekly milestone should reset (new week)
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

  // LOAD DATA - runs only once on mount
  useEffect(() => {
    console.log("Loading data from localStorage...");
    
    const savedTasks = localStorage.getItem("quests_tasks");
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      setTasks(parsedTasks);
      if (parsedTasks.length > 0) {
        const maxId = Math.max(...parsedTasks.map(t => t.id), 0);
        _id = maxId + 1;
      }
      console.log("Loaded tasks:", parsedTasks.length);
    }
    
    const savedEvents = localStorage.getItem("quests_events");
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents);
      setEvents(parsedEvents);
      console.log("Loaded events:", parsedEvents.length);
    }
    
    const savedUser = localStorage.getItem("user_data");
    if (!savedUser) {
      localStorage.setItem("user_data", JSON.stringify({ coins: 0, xp: 0 }));
    }
    
    // Load milestone claim states
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
  }, []);

  // SAVE TASKS - runs only when tasks change AND not during initial load
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("quests_tasks", JSON.stringify(tasks));
      console.log("Tasks saved:", tasks.length);
    }
  }, [tasks, isLoading]);

  // SAVE EVENTS - runs only when events change AND not during initial load
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("quests_events", JSON.stringify(events));
      console.log("Events saved:", events.length);
    }
  }, [events, isLoading]);

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

  const addTask = () => {
    if (!newTask.trim()) return;
    const newTaskObj = { 
      id: uid(), 
      name: newTask, 
      deadline: taskDeadline, 
      status: "uncompleted" 
    };
    setTasks(prev => [...prev, newTaskObj]);
    setNewTask("");
    console.log("Added task:", newTaskObj);
  };

  const toggleStatus = (task) => {
    const next = nxt(task.status);
    
    setTasks(prev => {
      const updatedTasks = prev.map(t => 
        t.id === task.id ? { ...t, status: next } : t
      );
      
      // Only check milestones when marking as completed
      if (next === "completed" && task.status !== "completed") {
        // Give per-task reward first
        updateUserRewards(
          COINS_PER_TASK, 
          XP_PER_TASK, 
          `✅ Task Complete: "${task.name}"\n+${COINS_PER_TASK} coins, +${XP_PER_TASK} XP!`,
          false
        );
        
        // Then check for milestone bonuses
        checkMilestones(updatedTasks);
      }
      
      return updatedTasks;
    });
    
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    window.dispatchEvent(new CustomEvent('tasksUpdated'));
  };

  const addEvent = () => {
    if (!eventTitle.trim()) return;
    const formattedDate = eventDate || todayStr;
    const newEvent = { 
      id: uid(), 
      title: eventTitle, 
      date: formattedDate,
      time: eventTime, 
      venue: eventVenue 
    };
    setEvents(prev => [...prev, newEvent]);
    setEventTitle("");
    setEventTime("");
    setEventVenue("");
  };

  const deleteEvent = (id) => {
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
      const eventDate = e.date ? e.date.split('T')[0] : e.date;
      (acc[eventDate] ??= []).push(e);
      return acc; 
    }, {}),
    [events]
  );

  const quests = useMemo(() => {
    const todayTasks = tasksByDate[todayStr] || [];
    const dailyDone = todayTasks.filter(t => t.status === "completed").length;

    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    const weekTasks = tasks.filter(t => {
      const taskDate = new Date(t.deadline + "T00:00:00");
      return t.status === "completed" && taskDate >= weekStart && taskDate <= weekEnd;
    });
    const weekDone = weekTasks.length;

    return [
      { title: "Complete 5 tasks today", target: 5, progress: dailyDone, color: "#1D9E75" },
      { title: "Complete 20 tasks this week", target: 20, progress: weekDone, color: "#4E56C0" },
    ];
  }, [tasksByDate, tasks, todayStr]);

  const days = getDaysInMonth(currentYear, currentMonth);
  const firstDayWeekday = days[0]?.getDay() || 0;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="quests-root">
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
              <div key={task.id} className="task-item">
                <div className={`task-status-dot status-${task.status === "uncompleted" ? "uncompleted" : task.status === "in progress" ? "in-progress" : "completed"}`} />
                <span onClick={() => toggleStatus(task)} className={`task-name ${task.status === "completed" ? "completed" : ""}`}>
                  {task.name}
                </span>
                <span className={`status-badge ${task.status === "uncompleted" ? "uncompleted" : task.status === "in progress" ? "in-progress" : "completed"}`}>
                  {task.status}
                </span>
                <button className="delete-btn" onClick={() => deleteTask(task.id)}>×</button>
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

          <div className="add-section">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={goToPreviousMonth}>←</button>
              <div className="add-title" style={{ cursor: "pointer" }} onClick={goToCurrentMonth}>
                📆 {monthNames[currentMonth]} {currentYear}
              </div>
              <button className="calendar-nav-btn" onClick={goToNextMonth}>→</button>
            </div>
            <div className="calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}
              {Array(firstDayWeekday).fill(null).map((_, i) => <div key={`empty-${i}`} className="calendar-empty" />)}
              {days.map((day) => {
                const dateStr = day.toISOString().split("T")[0];
                const isToday = dateStr === todayStr;
                return (
                  <div key={dateStr} className={`calendar-cell ${isToday ? "today" : ""}`}>
                    <div className="calendar-date">{day.getDate()}</div>
                    {(tasksByDate[dateStr] || []).slice(0, 2).map((task) => (
                      <div key={task.id} className="calendar-chip chip-task" style={{ background: sBg(task.status), color: sTx(task.status), cursor: "pointer" }} onClick={() => toggleStatus(task)}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px" }}>{task.name}</span>
                        <button className="chip-delete" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>×</button>
                      </div>
                    ))}
                    {(eventsByDate[dateStr] || []).slice(0, 1).map((ev) => (
                      <div key={ev.id} className="calendar-chip chip-event" onClick={() => setSelectedEvent(ev)} style={{ cursor: "pointer" }}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px" }}>{ev.title}</span>
                        <button className="chip-delete" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}>×</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
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
              <p><strong>⏰ Time:</strong> {selectedEvent.time || "Not specified"}</p>
              <p><strong>📍 Venue:</strong> {selectedEvent.venue || "Not specified"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodoCalendarWithQuests;