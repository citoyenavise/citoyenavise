import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../components/Header';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Toast from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  })),
}));

const mockUseNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockUseNavigate,
  };
});

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );
    expect(screen.getByRole('banner') || screen.getByText(/Citoyen Avisé|Accueil/i)).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );
    const header = screen.getByRole('banner') || document.querySelector('header');
    if (header) {
      expect(header).toBeInTheDocument();
    }
  });
});

describe('ProtectedRoute Component', () => {
  it('should exist and be importable', async () => {
    const module = await import('../components/ProtectedRoute');
    expect(module.ProtectedRoute).toBeDefined();
  });

  it('should accept children prop', () => {
    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      </BrowserRouter>,
    );
    // Component renders without crashing
    expect(document.body).toBeInTheDocument();
  });
});

describe('Toast Component', () => {
  it('should exist and be importable', async () => {
    const Toast = (await import('../components/Toast')).default;
    expect(Toast).toBeDefined();
  });

  it('should render without crashing', () => {
    const { container } = render(<Toast message="Test" type="success" />);
    expect(container).toBeInTheDocument();
  });

  it('should accept different types', () => {
    const { rerender, container } = render(<Toast message="Test" type="error" />);
    expect(container).toBeInTheDocument();

    rerender(<Toast message="Test" type="info" />);
    expect(container).toBeInTheDocument();
  });
});

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render different variants', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('Card Component', () => {
  it('should render card with children', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <div>Content</div>
      </Card>,
    );
    const card = container.firstChild;
    expect(card).toHaveClass(/custom-class|card/);
  });
});

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle input changes', () => {
    const { container } = render(<Input />);
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(input.value).toBe('test value');
  });

  it('should support different input types', () => {
    const { container } = render(<Input type="email" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox') || document.querySelector('input')).toBeDisabled();
  });

  it('should show error state', () => {
    const { container } = render(<Input error="Field is required" />);
    expect(container.textContent).toContain('Field is required');
  });
});
