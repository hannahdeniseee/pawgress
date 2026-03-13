import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Friends from '../pages/Friends'

const currentUser = { id: 1, username: 'testuser' }

// ---------------------------------------------------------------------------
// Component tests!
// ---------------------------------------------------------------------------

describe('Friends component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- rendering ---

  it('renders nothing when currentUser has no id', () => {
    const { container } = render(<Friends currentUser={{}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when currentUser is null', () => {
    const { container } = render(<Friends currentUser={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the Friends section headings', () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    render(<Friends currentUser={currentUser} />)
    expect(screen.getByRole('heading', { name: 'Friends', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Search for a User')).toBeInTheDocument()
    expect(screen.getByText('Pending Friend Requests')).toBeInTheDocument()
  })

  it('shows empty-state messages when there are no friends or pending requests', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    await act(async () => render(<Friends currentUser={currentUser} />))
    expect(screen.getByText('No friends yet.')).toBeInTheDocument()
    expect(screen.getByText('No pending requests.')).toBeInTheDocument()
  })

  // Searching!

  it('shows "No users were found" when search returns a non-ok response', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchFriends
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchPendingRequests
    fetch.mockResolvedValueOnce({ ok: false })                                 // search

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'ghost' } })
      fireEvent.click(screen.getByText('Search'))
    })

    expect(screen.getByText('No users were found')).toBeInTheDocument()
  })

  it('shows the found username after a successful search', async () => {
    const foundUser = { id: 2, username: 'frienduser' }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchFriends
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchPendingRequests
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(foundUser) }) // search

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'frienduser' } })
      fireEvent.click(screen.getByText('Search'))
    })

    expect(screen.getByText('frienduser')).toBeInTheDocument()
    expect(screen.getByText('Send Friend Request')).toBeInTheDocument()
  })

  it('shows a self-search message when the found user is the current user', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchFriends
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchPendingRequests
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(currentUser) }) // search

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'testuser' } })
      fireEvent.click(screen.getByText('Search'))
    })

    expect(screen.getByText("You're already your own best friend, silly!")).toBeInTheDocument()
  })

  it('does not search when the input is blank', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    await act(async () => render(<Friends currentUser={currentUser} />))
    const callsBefore = fetch.mock.calls.length

    fireEvent.click(screen.getByText('Search'))

    expect(fetch.mock.calls.length).toBe(callsBefore) // no new fetch call
  })

  it('triggers search on Enter key press', async () => {
    const foundUser = { id: 2, username: 'frienduser' }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchFriends
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchPendingRequests
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(foundUser) }) // search

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'frienduser' } })
      fireEvent.keyDown(screen.getByPlaceholderText('Enter username'), { key: 'Enter' })
    })

    expect(screen.getByText('frienduser')).toBeInTheDocument()
  })

  // Sending Friend Reqs!

  it('shows "Friend request sent!" after clicking Send Friend Request', async () => {
    const foundUser = { id: 2, username: 'frienduser' }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchFriends
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }) // fetchPendingRequests
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(foundUser) }) // search
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })         // sendRequest

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'frienduser' } })
      fireEvent.click(screen.getByText('Search'))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Send Friend Request'))
    })

    expect(screen.getByText('Friend request sent!')).toBeInTheDocument()
  })

  it('POSTs to the correct endpoint when sending a friend request', async () => {
    const foundUser = { id: 2, username: 'frienduser' }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(foundUser) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Enter username'), { target: { value: 'frienduser' } })
      fireEvent.click(screen.getByText('Search'))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Send Friend Request'))
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/friends/request',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ requesterId: currentUser.id, receiverId: foundUser.id }),
      })
    )
  })

  // Pending Requests!

  it('renders pending requests with Accept and Decline buttons', async () => {
    const pending = [{ id: 10, requester: { username: 'juandelacruz' } }]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })    // fetchFriends
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(pending) }) // fetchPendingRequests

    await act(async () => render(<Friends currentUser={currentUser} />))

    expect(screen.getByText('juandelacruz wants to be your friend')).toBeInTheDocument()
    expect(screen.getByText('Accept')).toBeInTheDocument()
    expect(screen.getByText('Decline')).toBeInTheDocument()
  })

  it('calls the respond endpoint with ACCEPTED when Accept is clicked', async () => {
    const pending = [{ id: 10, requester: { username: 'juandelacruz' } }]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(pending) })
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }) // respond + refetches

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.click(screen.getByText('Accept'))
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/friends/10/respond',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACCEPTED' }),
      })
    )
  })

  it('calls the respond endpoint with DECLINED when Decline is clicked', async () => {
    const pending = [{ id: 10, requester: { username: 'juandelacruz' } }]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(pending) })
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.click(screen.getByText('Decline'))
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/friends/10/respond',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'DECLINED' }),
      })
    )
  })

  // Friends List!

  it('renders a friend where the current user is the requester', async () => {
    const friendsList = [
      { id: 20, requesterId: currentUser.id, receiverId: 3, receiver: { id: 3, username: 'bob' }, requester: currentUser },
    ]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(friendsList) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })

    await act(async () => render(<Friends currentUser={currentUser} />))

    expect(screen.getByText('bob')).toBeInTheDocument()
    expect(screen.getByText('View Profile')).toBeInTheDocument()
  })

  it('renders a friend where the current user is the receiver', async () => {
    const friendsList = [
      { id: 21, requesterId: 4, receiverId: currentUser.id, requester: { id: 4, username: 'carol' }, receiver: currentUser },
    ]
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(friendsList) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })

    await act(async () => render(<Friends currentUser={currentUser} />))

    expect(screen.getByText('carol')).toBeInTheDocument()
  })

  // Profile Viewing!

  it('shows the friend profile panel after clicking View Profile', async () => {
    const friendsList = [
      { id: 20, requesterId: currentUser.id, receiverId: 3, receiver: { id: 3, username: 'bob' }, requester: currentUser },
    ]
    const profile = { id: 3, username: 'bob', coins: 150, createdAt: '2025-01-01T00:00:00.000Z', avatarUrl: null }

    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(friendsList) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(profile) })

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.click(screen.getByText('View Profile'))
    })

    expect(screen.getByText("bob's Profile")).toBeInTheDocument()
    expect(screen.getByText('Coins: 150')).toBeInTheDocument()
  })

  it('closes the profile panel when Close is clicked', async () => {
    const friendsList = [
      { id: 20, requesterId: currentUser.id, receiverId: 3, receiver: { id: 3, username: 'bob' }, requester: currentUser },
    ]
    const profile = { id: 3, username: 'bob', coins: 150, createdAt: '2025-01-01T00:00:00.000Z', avatarUrl: null }

    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(friendsList) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(profile) })

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.click(screen.getByText('View Profile'))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Close'))
    })

    expect(screen.queryByText("bob's Profile")).not.toBeInTheDocument()
  })

  it('renders the friend avatar when avatarUrl is provided', async () => {
    const friendsList = [
      { id: 20, requesterId: currentUser.id, receiverId: 3, receiver: { id: 3, username: 'bob' }, requester: currentUser },
    ]
    const profile = { id: 3, username: 'bob', coins: 50, createdAt: '2025-01-01T00:00:00.000Z', avatarUrl: 'http://example.com/avatar.png' }

    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(friendsList) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(profile) })

    await act(async () => render(<Friends currentUser={currentUser} />))

    await act(async () => {
      fireEvent.click(screen.getByText('View Profile'))
    })

    const avatar = screen.getByAltText('bob')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'http://example.com/avatar.png')
  })
})
