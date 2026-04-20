import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PetShop from '../pages/PetShop'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../utils/sfx.js', () => ({
  playSaveSfx: vi.fn(),
}))

const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = val }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

const BASE_URL = 'http://localhost:5000'

const mockUser = {
  id: 'user-1',
  coins: 200,
  inventory: [],
}

const server = setupServer(
  http.get(`${BASE_URL}/api/users/:userId`, () => {
    return HttpResponse.json(mockUser)
  }),
  http.patch(`${BASE_URL}/api/users/:userId/coins`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ coins: mockUser.coins + body.amount })
  }),
  http.post(`${BASE_URL}/api/users/:userId/inventory`, () => {
    return HttpResponse.json({ success: true })
  }),
)

function renderComponent(props = {}) {
  return render(
    <MemoryRouter>
      <PetShop userId="user-1" {...props} />
    </MemoryRouter>
  )
}

beforeAll(() => server.listen())
afterEach(() => {
    server.resetHandlers()
    localStorageMock.clear()
    vi.clearAllMocks()
})
afterAll(() => server.close())

test('loads and displays coin balance and shop items', async () => {
  renderComponent()

  await screen.findByText('200')

  expect(screen.getByText('Pink Bow')).toBeInTheDocument()
  expect(screen.getByText('Necktie')).toBeInTheDocument()
  expect(screen.getByText('Glasses')).toBeInTheDocument()
  expect(screen.getByText('Collar')).toBeInTheDocument()
})

test('shows all item prices in the shop', async () => {
  renderComponent()

  await screen.findByText('200')

  expect(screen.getAllByText('60')).toHaveLength(2) // Pink Bow + Necktie
  expect(screen.getAllByText('80')).toHaveLength(1) // Glasses
  expect(screen.getAllByText('50')).toHaveLength(1) // Collar
})

test('successfully buys an item and updates coin balance', async () => {
  renderComponent()

  await screen.findByText('200')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0]) // Buy Pink Bow (60 coins)

  await screen.findByText('Bought Pink Bow!')
  expect(screen.getByText('140')).toBeInTheDocument()
})

test('marks item as owned after purchase', async () => {
  renderComponent()

  await screen.findByText('200')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  await screen.findByText('Owned ✓')
})

test('disables buy button after item is purchased', async () => {
  renderComponent()

  await screen.findByText('200')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  const ownedButton = await screen.findByText('Owned ✓')
  expect(ownedButton.closest('button')).toBeDisabled()
})

test('disables buy button when user cannot afford item', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({ ...mockUser, coins: 10 })
    }),
  )

  renderComponent()

  await screen.findByText('10')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  buyButtons.forEach((btn) => expect(btn).toBeDisabled())
})

test('shows network error message when coin PATCH fails', async () => {
  server.use(
    http.patch(`${BASE_URL}/api/users/:userId/coins`, () => {
      return new HttpResponse(null, { status: 500 })
    }),
  )

  renderComponent()

  await screen.findByText('200')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  await screen.findByText('Network error, try again.')
})

test('shows empty inventory message when inventory is empty', async () => {
  renderComponent()

  await screen.findByText('200')

  fireEvent.click(screen.getByRole('button', { name: /inventory/i }))

  expect(
    screen.getByText('Your inventory is empty. Buy something from the shop!'),
  ).toBeInTheDocument()
})

test('shows owned items in inventory tab', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 1 }, { accessoryId: 3 }], // Pink Bow + Glasses
      })
    }),
  )

  renderComponent()

  await screen.findByText('200')

  fireEvent.click(screen.getByRole('button', { name: /inventory/i }))

  expect(screen.getByText('Pink Bow')).toBeInTheDocument()
  expect(screen.getByText('Glasses')).toBeInTheDocument()
})

test('switches between shop and inventory tabs', async () => {
  renderComponent()

  await screen.findByText('200')

  fireEvent.click(screen.getByRole('button', { name: /inventory/i }))
  expect(
    screen.getByText('Your inventory is empty. Buy something from the shop!'),
  ).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /shop/i }))
  expect(screen.getByText('Pink Bow')).toBeInTheDocument()
})
