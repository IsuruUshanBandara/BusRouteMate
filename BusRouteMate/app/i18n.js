import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './translations/en.json';
import si from './translations/si.json';

i18n
    .use(initReactI18next)
    .init({
    compatibilityJSON: 'v3', // Ensures compatibility with JSON format
    resources: {
        en: {
            translation: en,
        },
        si: {
            translation: si,
        },
    },
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language if translation not found
    interpolation: {
        escapeValue: false, // React already escapes values
    },
});
export default i18n;