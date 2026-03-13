import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PomodoroTimer, { calcRewards, formatTime } from '../pages/PomodoroTimer'

// ---------------------------------------------------------------------------
// Helper function unit tests!
// ---------------------------------------------------------------------------

describe('calcRewards', () => {
  it('applies no multiplier (1x) for sessions under 15 minutes', () => {
    expect(calcRewards(10)).toEqual({ coins: 20, xp: 30 })
  })

  it('applies 1.5x multiplier at the 15-minute threshold', () => {
    expect(calcRewards(15)).toEqual({ coins: 45, xp: 67 })
  })

  it('applies 2x multiplier at the standard 25-minute Pomodoro', () => {
    expect(calcRewards(25)).toEqual({ coins: 100, xp: 150 })
  })

  it('applies 2.5x multiplier for deep-work sessions (45+ minutes)', () => {
    expect(calcRewards(45)).toEqual({ coins: 225, xp: 337 })
  })

  it('returns zero rewards for a zero-minute session', () => {
    expect(calcRewards(0)).toEqual({ coins: 0, xp: 0 })
  })
})

describe('formatTime', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('formats 90 seconds as 01:30', () => {
    expect(formatTime(90)).toBe('01:30')
  })

  it('formats a full 25-minute session as 25:00', () => {
    expect(formatTime(25 * 60)).toBe('25:00')
  })
})

// ---------------------------------------------------------------------------
// Component tests!
// ---------------------------------------------------------------------------

describe('PomodoroTimer component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders the default focus time of 25:00', () => {
    render(<PomodoroTimer user={null} />)
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('shows Start Timer button initially', () => {
    render(<PomodoroTimer user={null} />)
    expect(screen.getByText(/Start Timer/i)).toBeInTheDocument()
  })

  it('switches to Pause when the timer is started', () => {
    render(<PomodoroTimer user={null} />)
    fireEvent.click(screen.getByText(/Start Timer/i))
    expect(screen.getByText(/Pause/i)).toBeInTheDocument()
  })

  it('calls the coins API with the correct amount when a focus session completes', async () => {
    const user = { id: 7 }
    render(<PomodoroTimer user={user} />)

    // start timer
    fireEvent.click(screen.getByText(/Start Timer/i))

    // fast forward thru whole 25min session
    await act(async () => {
      vi.advanceTimersByTime(25*60*1000+500)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/users/7/coins',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({amount:100}), // 25min x 2 coins/min x 2.0 multiplier
      })
    )
  })

  it('does NOT call the coins API when the user is not logged in', async () => {
    render(<PomodoroTimer user={null} />)

    fireEvent.click(screen.getByText(/Start Timer/i))

    await act(async () => {
      vi.advanceTimersByTime(25*60*1000+500)
    })

    expect(fetch).not.toHaveBeenCalled()
  })
})
