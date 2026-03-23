import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TodoCalendarWithEvents from "../pages/Todo";

global.fetch = vi.fn(); 

const todayStr = new Date().toISOString().split("T")[0];

// Initial mock data
const mockTasks = [{ id: 1, name: "Task 1", deadline: todayStr, status: "uncompleted" }];
const mockEvents = [{ id: 1, title: "Event 1", date: todayStr, time: "12:00", venue: "Office" }];

// Helper to find a task by name (ignoring status)
const findTaskByName = (name) =>
  screen.findByText((content) => content.includes(name));

// Helper to find an event by title
const findEventByTitle = (title) =>
  screen.findByText((content) => content.includes(title));

describe("TodoCalendarWithEvents", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    fetch.mockImplementation((url) => {
      if (url.includes("/tasks")) {
        return Promise.resolve({ json: async () => [...mockTasks] });
      }
      if (url.includes("/events")) {
        return Promise.resolve({ json: async () => [...mockEvents] });
      }
      return Promise.resolve({ json: async () => [] });
    });
  });

  it("renders today's tasks and events", async () => {
    render(<TodoCalendarWithEvents />);

    expect(await findTaskByName("Task 1")).toBeInTheDocument();
    expect(await findEventByTitle("Event 1")).toBeInTheDocument();
  });

  it("adds a new task", async () => {
    // Mock POST response for adding a task
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: async () => ({ id: 2, name: "New Task", deadline: todayStr, status: "uncompleted" }),
      })
    );

    render(<TodoCalendarWithEvents />);

    const input = screen.getByPlaceholderText(/New task/i);
    const addButton = screen.getByText(/Add Task/i);

    fireEvent.change(input, { target: { value: "New Task" } });
    fireEvent.click(addButton);

    expect(await findTaskByName("New Task")).toBeInTheDocument();
  });

  it("toggles a task status", async () => {
    // Mock PATCH response for toggling status
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: async () => ({ id: 1, name: "Task 1", deadline: todayStr, status: "completed" }),
      })
    );

    render(<TodoCalendarWithEvents />);

    const task = await findTaskByName("Task 1");
    fireEvent.click(task);
    expect(await screen.findByText((content) => content.includes("Task 1") && content.includes("completed"))).toBeInTheDocument();
  });
});