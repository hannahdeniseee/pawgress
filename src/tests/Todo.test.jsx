import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import TodoCalendarWithEvents from "../pages/Todo";

global.fetch = vi.fn();

const todayStr = new Date().toISOString().split("T")[0];

const mockTasks = [{ id: 1, name: "Task 1", deadline: todayStr, status: "uncompleted" }];
const mockEvents = [{ id: 1, title: "Event 1", date: todayStr, time: "12:00", venue: "Office" }];

// --- Helpers ---
const findTaskById = async (id) => screen.findByTestId(`task-${id}`);
const findEventById = async (id) => screen.findByTestId(`event-${id}`);

describe("TodoCalendarWithEvents", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    fetch.mockImplementation((url) => {
      if (url.includes("/tasks")) return Promise.resolve({ ok: true, json: async () => [...mockTasks] });
      if (url.includes("/events")) return Promise.resolve({ ok: true, json: async () => [...mockEvents] });
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  
  it("renders input fields for tasks and events", () => {
    render(<TodoCalendarWithEvents />);
    expect(screen.getByPlaceholderText(/New task/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Event title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Venue/i)).toBeInTheDocument();
  });

  it("renders Add Task and Add Event buttons", () => {
    render(<TodoCalendarWithEvents />);
    expect(screen.getByText(/Add Task/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Event/i)).toBeInTheDocument();
  });

  it("shows placeholder message if no tasks or events today", async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => [] }));
    fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => [] }));

    render(<TodoCalendarWithEvents />);
    expect(await screen.findByText(/No tasks or events today!/i)).toBeInTheDocument();
  });

  it("renders today's tasks and events", async () => {
    render(<TodoCalendarWithEvents />);
    expect(await findTaskById(1)).toBeInTheDocument();
    expect(await findEventById(1)).toBeInTheDocument();
  });

  it("adds a new task", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: async () => ({ id: 2, name: "New Task", deadline: todayStr, status: "uncompleted" }) })
    );

    render(<TodoCalendarWithEvents />);
    const input = screen.getByPlaceholderText(/New task/i);
    const addButton = screen.getByText(/Add Task/i);

    fireEvent.change(input, { target: { value: "New Task" } });
    fireEvent.click(addButton);

    expect(await findTaskById(2)).toBeInTheDocument();
  });

  it("toggles a task status", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: async () => ({ id: 1, name: "Task 1", deadline: todayStr, status: "completed" }) })
    );

    render(<TodoCalendarWithEvents />);
    const task = await findTaskById(1);
    fireEvent.click(task.querySelector("span"));

    await waitFor(() => {
      expect(task.textContent).toContain("completed");
    });
  });

  it("deletes a task", async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => ({}) }));
    render(<TodoCalendarWithEvents />);
    const task = await findTaskById(1);
    const deleteBtn = task.querySelector("button");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("task-1")).not.toBeInTheDocument();
    });
  });

  it("deletes an event", async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => ({}) }));
    render(<TodoCalendarWithEvents />);
    const event = await findEventById(1);
    const deleteBtn = event.querySelector("button");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("event-1")).not.toBeInTheDocument();
    });
  });
});