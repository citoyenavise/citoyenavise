import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/LanguageSwitcher.css';

export function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useTranslation();

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${currentLanguage === 'fr' ? 'active' : ''}`}
        onClick={() => changeLanguage('fr')}
        aria-label="Français"
      >
        🇫🇷 FR
      </button>
      <button
        className={`lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        aria-label="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
