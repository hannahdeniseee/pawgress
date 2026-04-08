import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import userEvent from '@testing-library/user-event';
import TodoCalendarWithQuests from "../pages/Quests";

global.fetch = vi.fn();

const todayStr = new Date().toISOString().split("T")[0];

// Mock data
const task1 = [{ id: 1, name: "Task 1", deadline: todayStr, status: "uncompleted" }];
const event1 = [{ id: 1, title: "Event 1", date: todayStr, time: "12:00", venue: "Office" }];

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
    vi.resetAllMocks();

    fetch.mockImplementation((url) => {
      if (url.includes("/tasks")) {
        return Promise.resolve({ json: async () => [...task1] });
      }
      if (url.includes("/events")) {
        return Promise.resolve({ json: async () => [...event1] });
      }
      return Promise.resolve({ json: async () => [] });
    });
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
    it("renders today's tasks", async () => {
      render(<TodoCalendarWithQuests />);
      expect(await screen.findByText("Task 1")).toBeInTheDocument();
    });

    it("adds a new task", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          json: async () => ({ id: 2, name: "New Task", deadline: todayStr, status: "uncompleted" }),
        })
      );

      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Task name");
      const addButton = screen.getByText("Add Task");

      fireEvent.change(input, { target: { value: "New Task" } });
      fireEvent.click(addButton);

      expect(await screen.findByText("New Task")).toBeInTheDocument();
    });

    it("toggles a task status", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          json: async () => ({ id: 1, name: "Task 1", deadline: todayStr, status: "completed" }),
        })
      );

      render(<TodoCalendarWithQuests />);

      const task = await screen.findByText("Task 1");
      fireEvent.click(task);
      expect(await screen.findByText("completed")).toBeInTheDocument();
    });

    it("deletes a task", async () => {
      fetch.mockImplementationOnce(() => Promise.resolve({ json: async () => ({}) }));

      render(<TodoCalendarWithQuests />);

      const deleteButton = await screen.findByText("×");
      fireEvent.click(deleteButton);
      
      expect(screen.queryByText("Task 1")).not.toBeInTheDocument();
    });
  });

  // ========== EVENT TESTS ==========
  describe("Event Management", () => {
    it("renders today's events", async () => {
      render(<TodoCalendarWithQuests />);
      expect(await screen.findByText("Event 1")).toBeInTheDocument();
      expect(await screen.findByText("12:00")).toBeInTheDocument();
      expect(await screen.findByText("@ Office")).toBeInTheDocument();
    });

    it("adds a new event", async () => {
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          json: async () => ({ id: 2, title: "New Event", date: todayStr, time: "14:00", venue: "Home" }),
        })
      );

      render(<TodoCalendarWithQuests />);

      const input = screen.getByPlaceholderText("Event title");
      const addButton = screen.getByText("Add Event");

      fireEvent.change(input, { target: { value: "New Event" } });
      fireEvent.click(addButton);

      expect(await screen.findByText("New Event")).toBeInTheDocument();
    });

    it("deletes an event", async () => {
      fetch.mockImplementationOnce(() => Promise.resolve({ json: async () => ({}) }));

      render(<TodoCalendarWithQuests />);

      const deleteButtons = await screen.findAllByText("×");
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.queryByText("Event 1")).not.toBeInTheDocument();
    });
  });

  // ========== CALENDAR TESTS ==========
  describe("Calendar Display", () => {
    it("displays current month and year", () => {
      render(<TodoCalendarWithQuests />);
      const monthName = mockDate.toLocaleString("default", { month: "long" });
      const year = mockDate.getFullYear();
      expect(screen.getByText(`${monthName} ${year}`)).toBeInTheDocument();
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
  });
});