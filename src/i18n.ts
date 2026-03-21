import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your JSON files directly since they are in the src folder
import csJSON from './locales/cs.json';
import enJSON from './locales/en.json';

i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: enJSON },
      cs: { translation: csJSON }
    },
    lng: 'cs', // Your default language
    fallbackLng: 'en', // If a translation is missing in Czech, use English
    interpolation: {
      escapeValue: false // React already safely escapes values, so we don't need this
    }
  });

export default i18n;