import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import Friends from '../pages/Friends'

const currentUser = { id: 1, username: 'testuser' }

function setupFetch({
  friends = [],
  pending = [],
  searchResult = null,
  searchOk = true,
  userProfile = null,
} = {}) {
  vi.stubGlobal('fetch', vi.fn((url) => {
    const u = url.toString()
    if (u.includes('/api/friends/request'))
      return Promise.resolve({ ok: true })
    if (u.includes('/respond'))
      return Promise.resolve({ ok: true })
    if (u.includes('/pending'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(pending) })
    if (u.includes('/api/users/search'))
      return Promise.resolve({ ok: searchOk, json: () => Promise.resolve(searchResult) })
    if (u.includes('/api/users/'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(userProfile ?? {}) })
    if (u.includes('/api/friends/'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(friends) })
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  }))
}

describe('Friends component', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders nothing when currentUser has no id', () => {
    const { container } = render(<Friends currentUser={{}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the Friends card header', () => {
    setupFetch()
    render(<Friends currentUser={currentUser} />)
    expect(screen.getByText('Friends', { selector: '.friends-header' })).toBeInTheDocument()
  })

  it('shows empty state messages on load', async () => {
    setupFetch()
    render(<Friends currentUser={currentUser} />)
    await waitFor(() => {
      expect(screen.getByText('No pending requests.')).toBeInTheDocument()
      expect(screen.getByText('No friends yet.')).toBeInTheDocument()
    })
  })

  it('shows a found user and Send Friend Request button', async () => {
    setupFetch({ searchResult: { id: 2, username: 'alice' } })
    render(<Friends currentUser={currentUser} />)

    fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'alice' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument()
      expect(screen.getByText('Send Friend Request')).toBeInTheDocument()
    })
  })

  it('shows "No users were found" when search returns nothing', async () => {
    setupFetch({ searchOk: false })
    render(<Friends currentUser={currentUser} />)

    fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'nobody' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => expect(screen.getByText('No users were found')).toBeInTheDocument())
  })

  it('shows a self-search message when the user finds themselves', async () => {
    setupFetch({ searchResult: { id: 1, username: 'testuser' } })
    render(<Friends currentUser={currentUser} />)

    fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'testuser' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() =>
      expect(screen.getByText("You're already your own best friend, silly!")).toBeInTheDocument()
    )
  })

  it('shows "Friend request sent!" after sending a request', async () => {
    setupFetch({ searchResult: { id: 2, username: 'alice' } })
    render(<Friends currentUser={currentUser} />)

    fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'alice' } })
    fireEvent.click(screen.getByText('Search'))
    await waitFor(() => screen.getByText('Send Friend Request'))
    fireEvent.click(screen.getByText('Send Friend Request'))

    await waitFor(() => expect(screen.getByText('Friend request sent!')).toBeInTheDocument())
  })

  it('triggers search on Enter key', async () => {
    setupFetch({ searchResult: { id: 2, username: 'dave' } })
    render(<Friends currentUser={currentUser} />)

    const input = screen.getByPlaceholderText('Enter username')
    fireEvent.change(input, { target: { value: 'dave' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(screen.getByText('dave')).toBeInTheDocument())
  })

  it('shows a pending request with Accept and Decline buttons', async () => {
    setupFetch({ pending: [{ id: 10, requester: { username: 'bob' } }] })
    render(<Friends currentUser={currentUser} />)

    await waitFor(() => {
      expect(screen.getByText('bob wants to be your friend')).toBeInTheDocument()
      expect(screen.getByText('Accept')).toBeInTheDocument()
      expect(screen.getByText('Decline')).toBeInTheDocument()
    })
  })

  it('shows a friend in the friends list', async () => {
    setupFetch({
      friends: [{
        id: 5, requesterId: 2, receiverId: 1,
        requester: { username: 'charlie' },
        receiver: { username: 'testuser' },
      }],
    })
    render(<Friends currentUser={currentUser} />)

    await waitFor(() => {
      expect(screen.getByText('charlie')).toBeInTheDocument()
      expect(screen.getByText('View Profile')).toBeInTheDocument()
    })
  })

  it('opens a profile modal with coin count when View Profile is clicked', async () => {
    setupFetch({
      friends: [{
        id: 5, requesterId: 2, receiverId: 1,
        requester: { username: 'charlie' },
        receiver: { username: 'testuser' },
      }],
      userProfile: { username: 'charlie', coins: 150, createdAt: '2024-01-01T00:00:00Z', avatarUrl: null },
    })
    render(<Friends currentUser={currentUser} />)

    await waitFor(() => screen.getByText('View Profile'))
    fireEvent.click(screen.getByText('View Profile'))

    await waitFor(() => expect(screen.getByText(/150 coins/)).toBeInTheDocument())
  })

  it('closes the profile modal when Close is clicked', async () => {
    setupFetch({
      friends: [{
        id: 5, requesterId: 2, receiverId: 1,
        requester: { username: 'charlie' },
        receiver: { username: 'testuser' },
      }],
      userProfile: { username: 'charlie', coins: 150, createdAt: '2024-01-01T00:00:00Z', avatarUrl: null },
    })
    render(<Friends currentUser={currentUser} />)

    await waitFor(() => screen.getByText('View Profile'))
    fireEvent.click(screen.getByText('View Profile'))
    await waitFor(() => screen.getByText('Close'))
    fireEvent.click(screen.getByText('Close'))

    await waitFor(() => expect(screen.queryByText('Close')).not.toBeInTheDocument())
  })
})
