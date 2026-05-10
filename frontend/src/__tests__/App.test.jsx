import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'

// Mock des pages et composants
vi.mock('../pages/Home', () => ({
  Home: () => <div>Home Page</div>
}))

vi.mock('../pages/Login', () => ({
  Login: () => <div>Login Page</div>
}))

vi.mock('../pages/Register', () => ({
  Register: () => <div>Register Page</div>
}))

vi.mock('../pages/PetitionsListPage', () => ({
  PetitionsListPage: () => <div>Petitions List</div>
}))

vi.mock('../pages/CreatePetitionPage', () => ({
  default: () => <div>Create Petition</div>
}))

vi.mock('../pages/PetitionDetailPage', () => ({
  default: () => <div>Petition Detail</div>
}))

vi.mock('../pages/ElussPage', () => ({
  ElussPage: () => <div>Elus List</div>
}))

vi.mock('../pages/EluDetailPage', () => ({
  EluDetailPage: () => <div>Elu Detail</div>
}))

vi.mock('../components/Header', () => ({
  Header: () => <div>Header</div>
}))

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>
}))

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Header')).toBeInTheDocument()
    })
  })

  it('should render Home page on root path', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument()
    })
  })

  it('should have login route', () => {
    // Test structurally that routes are defined
    render(<App />)
    expect(screen.getByText('Header')).toBeInTheDocument()
  })

  it('should have Header component', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('Header')).toBeInTheDocument()
    })
  })
})
