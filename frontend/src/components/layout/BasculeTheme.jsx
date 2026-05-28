import { useEffect, useState } from 'react';
import './BasculeTheme.css';

const CLE_THEME = 'citoyenavise-theme';

function getThemeInitial() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CLE_THEME);
}

export default function BasculeTheme() {
  const [theme, setTheme] = useState(getThemeInitial);

  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
      window.localStorage.setItem(CLE_THEME, theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const basculer = () => {
    const courant =
      theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(courant === 'dark' ? 'light' : 'dark');
  };

  const estSombre = theme === 'dark';
  const intitule = estSombre ? 'Activer le mode clair' : 'Activer le mode sombre';

  return (
    <button
      type="button"
      className="bascule-theme"
      onClick={basculer}
      aria-label={intitule}
      title={intitule}
    >
      {estSombre ? 'Clair' : 'Sombre'}
    </button>
  );
}
