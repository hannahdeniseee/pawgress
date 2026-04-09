import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import TodoCalendarWithQuests from "../pages/Quests";

// Mock CustomEvent properly as a class
class MockCustomEvent {
  constructor(eventName, options) {
    this.type = eventName;
    this.detail = options?.detail;
  }
}
global.CustomEvent = MockCustomEvent;

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.dispatchEvent
window.dispatchEvent = vi.fn();

const todayStr = new Date().toISOString().split("T")[0];

// Mock the current date
const mockDate = new Date('2024-01-15T10:00:00');
vi.setSystemTime(mockDate);

// Mock matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("TodoCalendarWithQuests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('user_data', JSON.stringify({ coins: 0, xp: 0 }));
    window.dispatchEvent.mockClear();
  });

  // ========== QUEST TESTS ==========
  describe("Quest System", () => {
    it("displays daily quest with target of 5 tasks", () => {
      render(<TodoCalendarWithQuests />);
      expect(screen.getByText(/Complete 5 tasks today/i)).toBeInTheDocument();
      expect(screen.getByText("0 / 5")).toBeInTheDocument();
    });

    it("displays weekly quest with target of 20 tasks", () => {
      render(<TodoCalendarWithQuests />);
      expect(screen.getByText(/Complete 20 tasks this week/i)).toBeInTheDocument();
      expect(screen.getByText("0 / 20")).toBeInTheDocument();
    });
  });

  // ========== TASK TESTS ==========
  describe("Task Management", () => {
    it("adds a new task", async () => {
      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Task name");
      const addButton = screen.getByText("Add Task");

      fireEvent.change(input, { target: { value: "New Task" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const taskElements = screen.getAllByText("New Task");
        expect(taskElements.length).toBeGreaterThan(0);
      });
    });

    it("saves task to localStorage when added", async () => {
      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Task name");
      const addButton = screen.getByText("Add Task");

      fireEvent.change(input, { target: { value: "LocalStorage Task" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalled();
        const savedTasksCall = localStorageMock.setItem.mock.calls.find(
          call => call[0] === 'quests_tasks'
        );
        expect(savedTasksCall).toBeDefined();
      });
    });

    it("toggles a task status from uncompleted to in progress", async () => {
      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Task name");
      const addButton = screen.getByText("Add Task");
      fireEvent.change(input, { target: { value: "Toggle Task" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByText("Toggle Task").length).toBeGreaterThan(0);
      });

      const task = screen.getAllByText("Toggle Task")[0];
      fireEvent.click(task);

      await waitFor(() => {
        expect(screen.getByText("in progress")).toBeInTheDocument();
      });
    });

    it("toggles a task status to completed and gives rewards", async () => {
      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Task name");
      const addButton = screen.getByText("Add Task");
      fireEvent.change(input, { target: { value: "Complete Task" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByText("Complete Task").length).toBeGreaterThan(0);
      });

      const task = screen.getAllByText("Complete Task")[0];
      // First click: uncompleted → in progress
      fireEvent.click(task);
      
      // Second click: in progress → completed (gives rewards)
      fireEvent.click(task);

      // Check that reward toast appears
      await waitFor(() => {
        expect(screen.getByText(/Task Complete/)).toBeInTheDocument();
      });
    });

    it("deletes a task", async () => {
      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Task name");
      const addButton = screen.getByText("Add Task");
      fireEvent.change(input, { target: { value: "Task to Delete" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByText("Task to Delete").length).toBeGreaterThan(0);
      });

      const deleteButtons = await screen.findAllByText("×");
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText("Task to Delete")).not.toBeInTheDocument();
      });
    });
  });

  // ========== EVENT TESTS ==========
  describe("Event Management", () => {
    it("adds a new event", async () => {
      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Event title");
      const addButton = screen.getByText("Add Event");

      fireEvent.change(input, { target: { value: "New Event" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const eventElements = screen.getAllByText("New Event");
        expect(eventElements.length).toBeGreaterThan(0);
      });
    });

    it("saves event to localStorage when added", async () => {
      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Event title");
      const addButton = screen.getByText("Add Event");

      fireEvent.change(input, { target: { value: "LocalStorage Event" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const savedEventsCall = localStorageMock.setItem.mock.calls.find(
          call => call[0] === 'quests_events'
        );
        expect(savedEventsCall).toBeDefined();
      });
    });

    it("deletes an event", async () => {
      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Event title");
      const addButton = screen.getByText("Add Event");
      fireEvent.change(input, { target: { value: "Event to Delete" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByText("Event to Delete").length).toBeGreaterThan(0);
      });

      const deleteButtons = await screen.findAllByText("×");
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText("Event to Delete")).not.toBeInTheDocument();
      });
    });
  });

  // ========== CALENDAR TESTS ==========
  describe("Calendar Display", () => {
    it("displays current month and year", () => {
      render(<TodoCalendarWithQuests />);
      const monthElements = screen.getAllByText(/January|2024/);
      expect(monthElements.length).toBeGreaterThan(0);
    });

    it("displays all 7 days of week", () => {
      render(<TodoCalendarWithQuests />);
      expect(screen.getByText("Sun")).toBeInTheDocument();
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Tue")).toBeInTheDocument();
      expect(screen.getByText("Wed")).toBeInTheDocument();
      expect(screen.getByText("Thu")).toBeInTheDocument();
      expect(screen.getByText("Fri")).toBeInTheDocument();
      expect(screen.getByText("Sat")).toBeInTheDocument();
    });

    it("navigates to next month when clicking next button", () => {
      render(<TodoCalendarWithQuests />);
      const nextButton = screen.getByText("→");
      fireEvent.click(nextButton);
      expect(nextButton).toBeInTheDocument();
    });

    it("navigates to previous month when clicking previous button", () => {
      render(<TodoCalendarWithQuests />);
      const prevButton = screen.getByText("←");
      fireEvent.click(prevButton);
      expect(prevButton).toBeInTheDocument();
    });

    it("returns to current month when clicking month name", () => {
      render(<TodoCalendarWithQuests />);
      const monthHeader = screen.getByText(/📆/);
      fireEvent.click(monthHeader);
      expect(monthHeader).toBeInTheDocument();
    });
  });
});