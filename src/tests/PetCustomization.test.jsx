import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PetCustomization from '../pages/PetCustomization'

const BASE_URL = 'http://localhost:5000'

const mockUser = {
  id: 'user-1',
  petImage: '../assets/golden-retriever-dog.svg',
  inventory: [],
  equipped: {},
}

function renderComponent(props = {}) {
  return render(
    <MemoryRouter>
      <PetCustomization userId="user-1" {...props} />
    </MemoryRouter>,
  )
}

const server = setupServer(
  http.get(`${BASE_URL}/api/users/:userId`, () => {
    return HttpResponse.json(mockUser)
  }),
  http.put(`${BASE_URL}/api/users/:userId/equipped`, () => {
    return HttpResponse.json({ success: true })
  }),
  http.delete(`${BASE_URL}/api/users/:userId/equipped`, () => {
    return HttpResponse.json({ success: true })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('renders pet image', async () => {
  renderComponent()
  const petImg = await screen.findByAltText('Your pet')
  expect(petImg).toBeInTheDocument()
})

test('renders back button linking to home', async () => {
  renderComponent()
  await screen.findByAltText('Your pet')
  const backBtn = screen.getByRole('link', { name: /← back/i })
  expect(backBtn).toHaveAttribute('href', '/')
})

test('shows empty inventory message when user owns no accessories', async () => {
  renderComponent()
  await screen.findByAltText('Your pet')
  expect(
    screen.getByText("You don't own any accessories yet. Visit the shop!"),
  ).toBeInTheDocument()
})

test('shows error message when pet image is missing', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({ ...mockUser, petImage: null })
    }),
  )

  renderComponent()

  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  expect(screen.getByText('No pet yet!')).toBeInTheDocument()
})

test('shows error message when user data fails to load', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return new HttpResponse(null, { status: 500 })
    }),
  )

  renderComponent()

  await screen.findByText('Failed to load user data.')
})

test('displays owned accessories in the inventory grid', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 1 }, { accessoryId: 3 }], // Pink Bow + Glasses
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  expect(screen.getByText('Pink Bow')).toBeInTheDocument()
  expect(screen.getByText('Glasses')).toBeInTheDocument()
})

test('shows Equip button for owned but unequipped items', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 2 }], // Necktie
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  expect(screen.getByRole('button', { name: /equip/i })).toBeInTheDocument()
})

test('shows Unequip button for already equipped items', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 1 }], // Pink Bow
        equipped: { head: 1 },
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  expect(screen.getByRole('button', { name: /unequip/i })).toBeInTheDocument()
})

test('renders filter tabs for each accessory slot', async () => {
  renderComponent()
  await screen.findByAltText('Your pet')

  expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^head$/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^neck$/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^face$/i })).toBeInTheDocument()
})

test('filters inventory items by selected slot tab', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 1 }, { accessoryId: 3 }], // Pink Bow (head) + Glasses (face)
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  fireEvent.click(screen.getByRole('button', { name: /^head$/i }))

  expect(screen.getByText('Pink Bow')).toBeInTheDocument()
  expect(screen.queryByText('Glasses')).not.toBeInTheDocument()
})

test('shows empty message when no items match slot filter', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 1 }], // Pink Bow (head only)
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  fireEvent.click(screen.getByRole('button', { name: /^face$/i }))

  expect(screen.getByText('No face items owned yet.')).toBeInTheDocument()
})

test('switching tabs updates active tab class', async () => {
  renderComponent()
  await screen.findByAltText('Your pet')

  const neckTab = screen.getByRole('button', { name: /^neck$/i })
  fireEvent.click(neckTab)

  expect(neckTab).toHaveClass('active')
  expect(screen.getByRole('button', { name: /^all$/i })).not.toHaveClass('active')
})

test('equipping an item shows success message', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 2 }], // Necktie
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  fireEvent.click(screen.getByRole('button', { name: /equip/i }))

  await screen.findByText('Equipped Necktie!')
})

test('equipping an item changes the button to Unequip', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 2 }],
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  fireEvent.click(screen.getByRole('button', { name: /equip/i }))

  await screen.findByRole('button', { name: /unequip/i })
})

test('equipping an item renders its overlay on the pet', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 2 }],
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  fireEvent.click(screen.getByRole('button', { name: /equip/i }))

  await screen.findByAltText('Necktie')
})

test('unequipping an item shows success message', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 4 }], // Collar
        equipped: { neck: 4 },
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  fireEvent.click(screen.getByRole('button', { name: /unequip/i }))

  await screen.findByText('Unequipped Collar.')
})

test('unequipping an item removes the overlay from the pet', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 4 }],
        equipped: { neck: 4 },
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  expect(document.querySelector('.accessory-img[alt="Collar"]')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /unequip/i }))

  await waitFor(() => {
    expect(document.querySelector('.accessory-img[alt="Collar"]')).not.toBeInTheDocument()
  })
})

test('equipping a new item into an occupied slot replaces the previous one', async () => {
  server.use(
    http.get(`${BASE_URL}/api/users/:userId`, () => {
      return HttpResponse.json({
        ...mockUser,
        inventory: [{ accessoryId: 2 }, { accessoryId: 4 }], // Necktie + Collar (both neck)
        equipped: { neck: 2 },
      })
    }),
  )

  renderComponent()
  await screen.findByAltText('Your pet')

  const equipButtons = screen.getAllByRole('button', { name: /^equip$/i })
  fireEvent.click(equipButtons[0])

  await screen.findByText('Equipped Collar!')

  await waitFor(() => {
    expect(document.querySelector('.accessory-img[alt="Necktie"]')).not.toBeInTheDocument()
    expect(document.querySelector('.accessory-img[alt="Collar"]')).toBeInTheDocument()
  })
})
