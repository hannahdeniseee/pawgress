import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuth0 } from '@auth0/auth0-react'
import Social from '../pages/Social'

// Mock Auth0 so we control authentication state
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(),
}))

// Stub Friends to isolate Social from its own fetch calls
vi.mock('../pages/Friends', () => ({
  default: () => <div>Friends Card</div>,
}))

// Stub recharts to avoid ResizeObserver issues in jsdom
vi.mock('recharts', () => ({
  BarChart:         ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar:              () => null,
  XAxis:            () => null,
  YAxis:            () => null,
  CartesianGrid:    () => null,
  Tooltip:          () => null,
  Legend:           () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}))

const mockAuthUser = {
  sub: 'auth0|123',
  nickname: 'testuser',
  picture: 'https://example.com/avatar.jpg',
}

const baseProfile = {
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  pet: [],
}

const baseStats = { accountAgeDays: 30, petOwnershipDays: 15 }

function setupFetch({ profile = baseProfile, stats = baseStats, profileOk = true } = {}) {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (url.includes('/api/profile/'))
      return Promise.resolve({ ok: profileOk, json: () => Promise.resolve(profile) })
    if (url.includes('/api/stats'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(stats) })
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  }))
}

describe('Social page', () => {
  beforeEach(() => {
    useAuth0.mockReturnValue({ user: mockAuthUser, isAuthenticated: true })
    setupFetch()
  })

  afterEach(() => vi.restoreAllMocks())

  it('shows a loading state before data arrives', () => {
    render(<Social currentUser={{ id: 1 }} />)
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0)
  })

  it('renders the Profile and Journey Statistics card headers', async () => {
    render(<Social currentUser={{ id: 1 }} />)
    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument()
      expect(screen.getByText('Journey Statistics')).toBeInTheDocument()
    })
  })

  it('shows the username after loading', async () => {
    render(<Social currentUser={{ id: 1 }} />)
    await waitFor(() => expect(screen.getByText('testuser')).toBeInTheDocument())
  })

  it('shows join date after loading', async () => {
    render(<Social currentUser={{ id: 1 }} />)
    await waitFor(() => expect(screen.getByText(/Joined/)).toBeInTheDocument())
  })

  it('shows "No pet adopted yet!" when the user has no pet', async () => {
    render(<Social currentUser={{ id: 1 }} />)
    await waitFor(() => expect(screen.getByText('No pet adopted yet!')).toBeInTheDocument())
  })

  it('shows pet breed when the user has a pet', async () => {
    setupFetch({
      profile: {
        ...baseProfile,
        pet: [{ type: 'Dog', breed: 'Beagle', image: 'beagle.svg', createdAt: '2024-02-01T00:00:00Z' }],
      },
    })
    render(<Social currentUser={{ id: 1 }} />)
    await waitFor(() => expect(screen.getByText(/Beagle/)).toBeInTheDocument())
  })

  it('shows "No profile data found." when the profile fetch fails', async () => {
    setupFetch({ profileOk: false })
    render(<Social currentUser={{ id: 1 }} />)
    await waitFor(() => expect(screen.getByText('No profile data found.')).toBeInTheDocument())
  })

  it('renders the bar chart after data loads', async () => {
    render(<Social currentUser={{ id: 1 }} />)
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument())
  })

  it('renders the Friends card', () => {
    render(<Social currentUser={{ id: 1 }} />)
    expect(screen.getByText('Friends Card')).toBeInTheDocument()
  })

  it('does not fetch when user is not authenticated', () => {
    useAuth0.mockReturnValue({ user: null, isAuthenticated: false })
    render(<Social currentUser={{ id: 1 }} />)
    expect(fetch).not.toHaveBeenCalled()
  })
})
