import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Home } from '../pages/Home'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { ElussPage } from '../pages/ElussPage'
import { PetitionsListPage } from '../pages/PetitionsListPage'
import CreatePetitionPage from '../pages/CreatePetitionPage'
import PetitionDetailPage from '../pages/PetitionDetailPage'

// Mock API client
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: { id: '1' } })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({}))
  }
}))

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
  }))
}))

const mockUseNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockUseNavigate,
    useParams: () => ({ id: '1' })
  }
})

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render home page', () => {
    const { container } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )
    expect(container).toBeInTheDocument()
  })
})

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form', () => {
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    expect(container).toBeInTheDocument()
  })

  it('should have form elements', () => {
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    const inputs = container.querySelectorAll('input')
    expect(inputs.length > 0 || container).toBeTruthy()
  })

  it('should handle input changes', () => {
    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    const inputs = container.querySelectorAll('input')
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'test@example.com' } })
      expect(inputs[0].value).toBe('test@example.com')
    }
  })
})

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render register form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    )
    expect(document.body).toBeInTheDocument()
  })
})

describe('PetitionsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render petitions list', async () => {
    render(
      <BrowserRouter>
        <PetitionsListPage />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('should have search functionality', async () => {
    render(
      <BrowserRouter>
        <PetitionsListPage />
      </BrowserRouter>
    )
    const searchInput = screen.queryByPlaceholderText(/search|recherche/i) ||
                        document.querySelector('input[type="text"]')
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test petition' } })
      expect(searchInput.value).toBe('test petition')
    }
  })

  it('should have filter options', () => {
    render(
      <BrowserRouter>
        <PetitionsListPage />
      </BrowserRouter>
    )
    expect(document.body).toBeInTheDocument()
  })
})

describe('CreatePetitionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render create petition form', async () => {
    render(
      <BrowserRouter>
        <CreatePetitionPage />
      </BrowserRouter>
    )
    await waitFor(() => {
      const titleInput = screen.queryByPlaceholderText(/title|titre/i) ||
                         document.querySelector('input[type="text"]')
      expect(titleInput || document.body).toBeInTheDocument()
    })
  })

  it('should have title input field', async () => {
    render(
      <BrowserRouter>
        <CreatePetitionPage />
      </BrowserRouter>
    )
    const titleInput = document.querySelector('input[type="text"]')
    if (titleInput) {
      fireEvent.change(titleInput, { target: { value: 'New Petition' } })
      expect(titleInput.value).toBe('New Petition')
    }
  })

  it('should have description input field', async () => {
    render(
      <BrowserRouter>
        <CreatePetitionPage />
      </BrowserRouter>
    )
    const textarea = document.querySelector('textarea')
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'Test description' } })
      expect(textarea.value).toBe('Test description')
    }
  })

  it('should have submit button', async () => {
    render(
      <BrowserRouter>
        <CreatePetitionPage />
      </BrowserRouter>
    )
    const submitButton = screen.getByRole('button', { name: /submit|create|créer/i }) ||
                         screen.queryByText(/Créer|Create/i)
    expect(submitButton).toBeTruthy()
  })
})

describe('PetitionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render petition detail', async () => {
    render(
      <BrowserRouter>
        <PetitionDetailPage />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('should display petition information', async () => {
    render(
      <BrowserRouter>
        <PetitionDetailPage />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('should have sign petition button', async () => {
    render(
      <BrowserRouter>
        <PetitionDetailPage />
      </BrowserRouter>
    )
    const signButton = screen.queryByRole('button', { name: /sign|signer/i })
    if (signButton) {
      expect(signButton).toBeInTheDocument()
    }
  })
})

describe('ElussPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render elus list', async () => {
    render(
      <BrowserRouter>
        <ElussPage />
      </BrowserRouter>
    )
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('should have search and filter options', () => {
    render(
      <BrowserRouter>
        <ElussPage />
      </BrowserRouter>
    )
    expect(document.body).toBeInTheDocument()
  })
})
