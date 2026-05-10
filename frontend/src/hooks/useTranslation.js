import { useTranslation as useI18nTranslation } from 'react-i18next';

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const currentLanguage = i18n.language;

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage,
    isLoading: i18n.isInitialized === false
  };
}
