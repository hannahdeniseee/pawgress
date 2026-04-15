import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../pages/Navbar'

const mockLogout = vi.fn()

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { picture: 'https://example.com/avatar.jpg', nickname: 'testuser' },
    logout: mockLogout,
  }),
}))

function renderNavbar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => mockLogout.mockClear())

  it('renders all four navigation tabs', () => {
    renderNavbar()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Pet Shop')).toBeInTheDocument()
    expect(screen.getByText('Customize Pet')).toBeInTheDocument()
    expect(screen.getByText('My Profile')).toBeInTheDocument()
  })

  it('displays the logged-in username', () => {
    renderNavbar()
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('renders the user avatar', () => {
    const { container } = renderNavbar()
    const avatar = container.querySelector('.navbar-avatar')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('marks the Home tab as active on /', () => {
    renderNavbar('/')
    expect(screen.getByText('Home').closest('a')).toHaveClass('active')
  })

  it('marks the Pet Shop tab as active on /shop', () => {
    renderNavbar('/shop')
    expect(screen.getByText('Pet Shop').closest('a')).toHaveClass('active')
  })

  it('marks the Customize Pet tab as active on /customization', () => {
    renderNavbar('/customization')
    expect(screen.getByText('Customize Pet').closest('a')).toHaveClass('active')
  })

  it('marks the My Profile tab as active on /profile', () => {
    renderNavbar('/profile')
    expect(screen.getByText('My Profile').closest('a')).toHaveClass('active')
  })

  it('does not mark inactive tabs as active', () => {
    renderNavbar('/')
    expect(screen.getByText('Pet Shop').closest('a')).not.toHaveClass('active')
    expect(screen.getByText('My Profile').closest('a')).not.toHaveClass('active')
  })

  it('renders the Logout button', () => {
    renderNavbar()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls logout when the Logout button is clicked', () => {
    renderNavbar()
    fireEvent.click(screen.getByText('Logout'))
    expect(mockLogout).toHaveBeenCalledOnce()
  })
})
