import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="language-selector">
      <button
        className={i18n.language === 'fr' ? 'active' : ''}
        onClick={() => handleLanguageChange('fr')}
      >
        FR
      </button>
      <button
        className={i18n.language === 'en' ? 'active' : ''}
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector;
