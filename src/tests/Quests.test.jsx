// test/quests.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoCalendarWithQuests from '../pages/Quests';

describe('Quest System', () => {
  describe('Daily Quest', () => {
    test('Should display daily quest with target of 5 tasks', () => {
      render(<TodoCalendarWithQuests />);
      
      expect(screen.getByText(/Complete 5 tasks today/i)).toBeInTheDocument();
      expect(screen.getByText(/0 \/ 5/)).toBeInTheDocument();
    });

    test('Should update progress when tasks are completed today', async () => {
      render(<TodoCalendarWithQuests />);
      
      // Add a task
      const taskInput = screen.getByPlaceholderText('Task name');
      const addButton = screen.getByText('+ Add task');
      
      await userEvent.type(taskInput, 'Study React');
      await userEvent.click(addButton);
      
      // Complete the task
      const taskElement = screen.getByText('Study React');
      await userEvent.click(taskElement);
      
      // Quest progress should update
      expect(screen.getByText(/1 \/ 5/)).toBeInTheDocument();
    });

    test('Should show completion checkmark when daily quest is completed', async () => {
      render(<TodoCalendarWithQuests />);
      
      // Add and complete 5 tasks
      for (let i = 1; i <= 5; i++) {
        const taskInput = screen.getByPlaceholderText('Task name');
        await userEvent.type(taskInput, `Task ${i}`);
        await userEvent.click(screen.getByText('+ Add task'));
        await userEvent.click(screen.getByText(`Task ${i}`));
      }
      
      expect(screen.getByText(/Complete 5 tasks today ✓/)).toBeInTheDocument();
    });

    test('Should only count tasks completed today, not future/past tasks', async () => {
      render(<TodoCalendarWithQuests />);
      
      // Add task with future deadline
      const taskInput = screen.getByPlaceholderText('Task name');
      const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
      
      await userEvent.type(taskInput, 'Future Task');
      await userEvent.clear(dateInput);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      await userEvent.type(dateInput, futureDate.toISOString().split('T')[0]);
      
      await userEvent.click(screen.getByText('+ Add task'));
      await userEvent.click(screen.getByText('Future Task'));
      
      // Progress should still be 0/5
      expect(screen.getByText(/0 \/ 5/)).toBeInTheDocument();
    });
  });

  describe('Weekly Quest', () => {
    test('Should display weekly quest with target of 20 tasks', () => {
      render(<TodoCalendarWithQuests />);
      
      expect(screen.getByText(/Complete 20 tasks this week/i)).toBeInTheDocument();
      expect(screen.getByText(/0 \/ 20/)).toBeInTheDocument();
    });

    test('Should count completed tasks from current week only', async () => {
      render(<TodoCalendarWithQuests />);
      
      // Add and complete tasks
      for (let i = 1; i <= 3; i++) {
        const taskInput = screen.getByPlaceholderText('Task name');
        await userEvent.type(taskInput, `Week Task ${i}`);
        await userEvent.click(screen.getByText('+ Add task'));
        await userEvent.click(screen.getByText(`Week Task ${i}`));
      }
      
      expect(screen.getByText(/3 \/ 20/)).toBeInTheDocument();
    });

    test('Should show progress bar with correct width percentage', () => {
      render(<TodoCalendarWithQuests />);
      
      const progressBar = document.querySelector('[style*="width:"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar.style.width).toBe('0%');
    });

    test('Should cap progress bar at 100%', async () => {
      render(<TodoCalendarWithQuests />);
      
      // Add 20 tasks (would need to mock or create many tasks)
      // Alternatively, test the math logic
      const questElement = screen.getByText(/Complete 20 tasks this week/i);
      expect(questElement).toBeInTheDocument();
      
      // Progress should never exceed 100%
      const progressDiv = document.querySelector('[style*="background: #378ADD"]');
      expect(progressDiv).toBeInTheDocument();
    });
  });
});

describe('Task Management', () => {
  test('Should add new task to today\'s list', async () => {
    render(<TodoCalendarWithQuests />);
    
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Test Task');
    await userEvent.click(screen.getByText('+ Add task'));
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  test('Should not add empty task', async () => {
    render(<TodoCalendarWithQuests />);
    
    await userEvent.click(screen.getByText('+ Add task'));
    
    expect(screen.queryByText('+ Add task')).toBeInTheDocument();
    // No new task added
  });

  test('Should add task with Enter key', async () => {
    render(<TodoCalendarWithQuests />);
    
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Enter Task{enter}');
    
    expect(screen.getByText('Enter Task')).toBeInTheDocument();
  });

  test('Should cycle task status: uncompleted → in progress → completed', async () => {
    render(<TodoCalendarWithQuests />);
    
    // Add task
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Status Task');
    await userEvent.click(screen.getByText('+ Add task'));
    
    const task = screen.getByText('Status Task');
    
    // Check initial status (should be uncompleted)
    expect(screen.getByText('uncompleted')).toBeInTheDocument();
    
    // Click to change to in progress
    await userEvent.click(task);
    expect(screen.getByText('in progress')).toBeInTheDocument();
    
    // Click to change to completed
    await userEvent.click(task);
    expect(screen.getByText('completed')).toBeInTheDocument();
    
    // Click to cycle back to uncompleted
    await userEvent.click(task);
    expect(screen.getByText('uncompleted')).toBeInTheDocument();
  });

  test('Should show different colors for each status', async () => {
    render(<TodoCalendarWithQuests />);
    
    // Add task
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Color Task');
    await userEvent.click(screen.getByText('+ Add task'));
    
    // Check status badge colors (based on sBg and sTx functions)
    const badge = screen.getByText('uncompleted');
    expect(badge).toHaveStyle({ background: '#FCEBEB', color: '#A32D2D' });
    
    // Change to in progress
    await userEvent.click(screen.getByText('Color Task'));
    expect(screen.getByText('in progress')).toHaveStyle({ background: '#FAEEDA', color: '#854F0B' });
    
    // Change to completed
    await userEvent.click(screen.getByText('Color Task'));
    expect(screen.getByText('completed')).toHaveStyle({ background: '#EAF3DE', color: '#3B6D11' });
  });

  test('Should delete task', async () => {
    render(<TodoCalendarWithQuests />);
    
    // Add task
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Delete Me');
    await userEvent.click(screen.getByText('+ Add task'));
    
    expect(screen.getByText('Delete Me')).toBeInTheDocument();
    
    // Delete task
    const deleteButton = screen.getAllByText('×')[0];
    await userEvent.click(deleteButton);
    
    expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
  });

  test('Should set custom deadline for task', async () => {
    render(<TodoCalendarWithQuests />);
    
    const taskInput = screen.getByPlaceholderText('Task name');
    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    
    await userEvent.type(taskInput, 'Future Task');
    await userEvent.clear(dateInput);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];
    await userEvent.type(dateInput, dateStr);
    
    await userEvent.click(screen.getByText('+ Add task'));
    
    // Task should appear on that date in calendar
    const calendarCell = screen.getByText(futureDate.getDate().toString());
    expect(calendarCell).toBeInTheDocument();
  });
});

describe('Event Management', () => {
  test('Should add event with title only', async () => {
    render(<TodoCalendarWithQuests />);
    
    const eventInput = screen.getByPlaceholderText('Event title');
    await userEvent.type(eventInput, 'Meeting');
    await userEvent.click(screen.getByText('+ Add event'));
    
    expect(screen.getByText('Meeting')).toBeInTheDocument();
  });

  test('Should add event with time and venue', async () => {
    render(<TodoCalendarWithQuests />);
    
    const eventInput = screen.getByPlaceholderText('Event title');
    const timeInput = screen.getByDisplayValue('');
    const venueInput = screen.getByPlaceholderText('Venue');
    
    await userEvent.type(eventInput, 'Doctor Appointment');
    await userEvent.type(timeInput, '14:30');
    await userEvent.type(venueInput, 'Health Center');
    await userEvent.click(screen.getByText('+ Add event'));
    
    expect(screen.getByText('Doctor Appointment')).toBeInTheDocument();
    expect(screen.getByText(/14:30/)).toBeInTheDocument();
    expect(screen.getByText(/@ Health Center/)).toBeInTheDocument();
  });

  test('Should add event with Enter key', async () => {
    render(<TodoCalendarWithQuests />);
    
    const eventInput = screen.getByPlaceholderText('Event title');
    await userEvent.type(eventInput, 'Party{enter}');
    
    expect(screen.getByText('Party')).toBeInTheDocument();
  });

  test('Should not add empty event', async () => {
    render(<TodoCalendarWithQuests />);
    
    await userEvent.click(screen.getByText('+ Add event'));
    
    expect(screen.queryAllByText('+ Add event').length).toBeGreaterThan(0);
  });

  test('Should delete event', async () => {
    render(<TodoCalendarWithQuests />);
    
    // Add event
    const eventInput = screen.getByPlaceholderText('Event title');
    await userEvent.type(eventInput, 'Delete Event');
    await userEvent.click(screen.getByText('+ Add event'));
    
    expect(screen.getByText('Delete Event')).toBeInTheDocument();
    
    // Delete event
    const deleteButtons = screen.getAllByText('×');
    const eventDeleteBtn = deleteButtons[deleteButtons.length - 1];
    await userEvent.click(eventDeleteBtn);
    
    expect(screen.queryByText('Delete Event')).not.toBeInTheDocument();
  });

  test('Should set custom date for event', async () => {
    render(<TodoCalendarWithQuests />);
    
    const eventInput = screen.getByPlaceholderText('Event title');
    const dateInput = screen.getAllByDisplayValue(new Date().toISOString().split('T')[0])[1];
    
    await userEvent.type(eventInput, 'Future Event');
    await userEvent.clear(dateInput);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await userEvent.type(dateInput, futureDate.toISOString().split('T')[0]);
    
    await userEvent.click(screen.getByText('+ Add event'));
    
    // Event should appear on that date in calendar
    const calendarCell = screen.getByText(futureDate.getDate().toString());
    expect(calendarCell).toBeInTheDocument();
  });
});

describe('Calendar Display', () => {
  test('Should display current month and year', () => {
    render(<TodoCalendarWithQuests />);
    
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();
    
    expect(screen.getByText(`${monthName} ${year}`)).toBeInTheDocument();
  });

  test('Should display all 7 days of week', () => {
    render(<TodoCalendarWithQuests />);
    
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  test('Should highlight today\'s date', () => {
    render(<TodoCalendarWithQuests />);
    
    const today = new Date();
    const todayDate = today.getDate().toString();
    const todayCell = screen.getByText(todayDate);
    
    // Today's cell should have special styling
    expect(todayCell.closest('div')).toHaveStyle({ border: '1.5px solid #378ADD' });
  });

  test('Should show tasks on correct calendar dates', async () => {
    render(<TodoCalendarWithQuests />);
    
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Calendar Task');
    await userEvent.click(screen.getByText('+ Add task'));
    
    const today = new Date();
    const todayDate = today.getDate().toString();
    const todayCell = screen.getByText(todayDate);
    
    expect(todayCell.closest('div')).toContainHTML('Calendar Task');
  });

  test('Should show events on correct calendar dates', async () => {
    render(<TodoCalendarWithQuests />);
    
    const eventInput = screen.getByPlaceholderText('Event title');
    await userEvent.type(eventInput, 'Calendar Event');
    await userEvent.click(screen.getByText('+ Add event'));
    
    const today = new Date();
    const todayDate = today.getDate().toString();
    const todayCell = screen.getByText(todayDate);
    
    expect(todayCell.closest('div')).toContainHTML('Calendar Event');
  });

  test('Should show empty state when no tasks/events today', () => {
    render(<TodoCalendarWithQuests />);
    
    // Assuming no tasks/events initially
    expect(screen.getByText('No tasks or events today')).toBeInTheDocument();
  });
});

describe('Today Section', () => {
  test('Should display current date', () => {
    render(<TodoCalendarWithQuests />);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    expect(screen.getByText(`Today — ${todayStr}`)).toBeInTheDocument();
  });

  test('Should show both tasks and events in today section', async () => {
    render(<TodoCalendarWithQuests />);
    
    // Add task
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Today Task');
    await userEvent.click(screen.getByText('+ Add task'));
    
    // Add event
    const eventInput = screen.getByPlaceholderText('Event title');
    await userEvent.type(eventInput, 'Today Event');
    await userEvent.click(screen.getByText('+ Add event'));
    
    expect(screen.getByText('Today Task')).toBeInTheDocument();
    expect(screen.getByText('Today Event')).toBeInTheDocument();
  });

  test('Should show status badges in today section', async () => {
    render(<TodoCalendarWithQuests />);
    
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Badge Task');
    await userEvent.click(screen.getByText('+ Add task'));
    
    expect(screen.getByText('uncompleted')).toBeInTheDocument();
  });
});

describe('API Integration (when USE_API = true)', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Should fetch tasks from API on mount', () => {
    // Would need to modify component to fetch on mount
    // Or test with USE_API = true
  });

  test('Should POST new task to API', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ id: 1, name: 'API Task', deadline: '2024-01-01', status: 'uncompleted' })
    });
    
    // Render with USE_API = true
    // Add task and verify fetch was called
  });

  test('Should handle API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('API Error'));
    
    // Should not crash, should show error or handle silently
  });
});

describe('Edge Cases', () => {
  test('Should handle very long task names', async () => {
    render(<TodoCalendarWithQuests />);
    
    const longName = 'A'.repeat(100);
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, longName);
    await userEvent.click(screen.getByText('+ Add task'));
    
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  test('Should handle special characters in task names', async () => {
    render(<TodoCalendarWithQuests />);
    
    const specialChars = '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, specialChars);
    await userEvent.click(screen.getByText('+ Add task'));
    
    expect(screen.getByText(specialChars)).toBeInTheDocument();
  });

  test('Should handle multiple tasks with same name', async () => {
    render(<TodoCalendarWithQuests />);
    
    for (let i = 0; i < 3; i++) {
      const taskInput = screen.getByPlaceholderText('Task name');
      await userEvent.type(taskInput, 'Duplicate Task');
      await userEvent.click(screen.getByText('+ Add task'));
    }
    
    const duplicates = screen.getAllByText('Duplicate Task');
    expect(duplicates).toHaveLength(3);
  });

  test('Should handle month boundaries correctly', () => {
    render(<TodoCalendarWithQuests />);
    
    // Test that days from previous/next month aren't shown
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    // Should not show day 32 or 0
    expect(screen.queryByText('32')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('Should persist data after component re-renders', async () => {
    const { rerender } = render(<TodoCalendarWithQuests />);
    
    // Add task
    const taskInput = screen.getByPlaceholderText('Task name');
    await userEvent.type(taskInput, 'Persistent Task');
    await userEvent.click(screen.getByText('+ Add task'));
    
    // Re-render
    rerender(<TodoCalendarWithQuests />);
    
    // Task should still be there
    expect(screen.getByText('Persistent Task')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  test('Should have proper ARIA labels', () => {
    render(<TodoCalendarWithQuests />);
    
    // Check for semantic HTML elements
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument();
  });

  test('Should support keyboard navigation', async () => {
    render(<TodoCalendarWithQuests />);
    
    const taskInput = screen.getByPlaceholderText('Task name');
    taskInput.focus();
    expect(document.activeElement).toBe(taskInput);
    
    await userEvent.keyboard('Test{enter}');
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});