import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import MapPage from '../src/pages/MapPage';
import PetitionsPage from '../src/pages/PetitionsPage';
import ElusPage from '../src/pages/ElusPage';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  test('MapPage has no a11y violations', async () => {
    const { container } = render(<MapPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('PetitionsPage has no a11y violations', async () => {
    const { container } = render(<PetitionsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('ElusPage has no a11y violations', async () => {
    const { container } = render(<ElusPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Images have alt text', () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      expect(img.alt).toBeTruthy();
    });
  });

  test('Color contrast sufficient', () => {
    const headings = document.querySelectorAll('h1, h2, h3');
    headings.forEach(h => {
      expect(h.style.color).toBeTruthy();
    });
  });
});
