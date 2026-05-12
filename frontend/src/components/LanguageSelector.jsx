import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const location = useLocation();

  const handleLanguageChange = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);

    // Navigate to same page in new language
    // Replace current language in pathname with new language
    const currentLang = lang || 'fr';
    const newPathname = location.pathname.replace(`/${currentLang}/`, `/${newLang}/`);
    navigate(newPathname);
  };

  const currentLang = lang || 'fr';

  return (
    <div className="language-selector">
      <button
        className={currentLang === 'fr' ? 'active' : ''}
        onClick={() => handleLanguageChange('fr')}
      >
        FR
      </button>
      <button
        className={currentLang === 'en' ? 'active' : ''}
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector;
