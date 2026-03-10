import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PetShop from '../pages/PetShop'

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

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─── Loading & Display ───────────────────────────────────────────────────────

test('loads and displays coin balance and shop items', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  expect(screen.getByText('Pink Bow')).toBeInTheDocument()
  expect(screen.getByText('Necktie')).toBeInTheDocument()
  expect(screen.getByText('Glasses')).toBeInTheDocument()
  expect(screen.getByText('Collar')).toBeInTheDocument()
})

test('renders shop tab by default', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  const shopTab = screen.getByRole('button', { name: /shop/i })
  expect(shopTab).toHaveClass('active')
})

test('shows all item prices in the shop', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  expect(screen.getAllByText('💰 60')).toHaveLength(2) // Pink Bow + Necktie
  expect(screen.getAllByText('💰 80')).toHaveLength(1) // Glasses
  expect(screen.getAllByText('💰 50')).toHaveLength(1) // Collar
})

test('successfully buys an item and updates coin balance', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0]) // Buy Pink Bow (60 coins)

  await screen.findByText('Bought Pink Bow!')
  expect(screen.getByText('💰 140 coins')).toBeInTheDocument()
})

test('marks item as owned after purchase', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  await screen.findByText('Owned ✓')
})

test('disables buy button after item is purchased', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  const ownedButton = await screen.findByText('Owned ✓')
  expect(ownedButton.closest('button')).toBeDisabled()
})

test('shows message when trying to buy already owned item', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 1 }],
      })
    }),
  )

  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  const ownedButton = await screen.findByText('Owned ✓')
  const btn = ownedButton.closest('button')

  btn.onclick && btn.onclick(new MouseEvent('click'))
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  await screen.findByText('You already own this!')
})

test('shows not enough coins message when balance is too low', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({ ...mockUser, coins: 10 })
    }),
  )

  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 10 coins')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  await screen.findByText('Not enough coins!')
})

test('disables buy button when user cannot afford item', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({ ...mockUser, coins: 10 })
    }),
  )

  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 10 coins')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  buyButtons.forEach((btn) => expect(btn).toBeDisabled())
})

test('shows network error message when coin PATCH fails', async () => {
  server.use(
    http.patch(`${BASE_URL}/api/users/:userId/coins`, () => {
      return new HttpResponse(null, { status: 500 })
    }),
  )

  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  await screen.findByText('Network error, try again.')
})

test('shows network error when inventory POST fails', async () => {
  server.use(
    http.post(`${BASE_URL}/api/users/:userId/inventory`, () => {
      return new HttpResponse(null, { status: 500 })
    }),
  )

  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  await screen.findByText('Network error, try again.')
})

test('shows empty inventory message when inventory is empty', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

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

  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  fireEvent.click(screen.getByRole('button', { name: /inventory \(2\)/i }))

  expect(screen.getByText('Pink Bow')).toBeInTheDocument()
  expect(screen.getByText('Glasses')).toBeInTheDocument()
})

test('inventory count updates in tab label after purchase', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  expect(screen.getByRole('button', { name: /inventory \(0\)/i })).toBeInTheDocument()

  const buyButtons = screen.getAllByRole('button', { name: /buy/i })
  fireEvent.click(buyButtons[0])

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /inventory \(1\)/i })).toBeInTheDocument()
  })
})

test('displays item slot label in inventory', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 2 }], // Necktie — slot: neck
      })
    }),
  )

  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  fireEvent.click(screen.getByRole('button', { name: /inventory/i }))

  expect(screen.getByText('[neck]')).toBeInTheDocument()
})

test('switches between shop and inventory tabs', async () => {
  render(<PetShop userId="user-1" />)

  await screen.findByText('💰 200 coins')

  fireEvent.click(screen.getByRole('button', { name: /inventory/i }))
  expect(
    screen.getByText('Your inventory is empty. Buy something from the shop!'),
  ).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /shop/i }))
  expect(screen.getByText('Pink Bow')).toBeInTheDocument()
})
