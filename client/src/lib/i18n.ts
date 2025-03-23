
const translations = {
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
    }
  },
  hi: {
    common: {
      save: "सहेजें",
      cancel: "रद्द करें",
      delete: "हटाएं",
      edit: "संपादित करें",
      add: "जोड़ें",
    }
  },
  ta: {
    common: {
      save: "சேமி",
      cancel: "ரத்து",
      delete: "அழி",
      edit: "திருத்து",
      add: "சேர்",
    }
  },
  te: {
    common: {
      save: "సేవ్",
      cancel: "రద్దు",
      delete: "తొలగించు",
      edit: "సవరించు",
      add: "జోడించు",
    }
  }
};

let currentLanguage = 'en';

export const setLanguage = (lang: 'en' | 'hi' | 'ta' | 'te') => {
  currentLanguage = lang;
};

export const t = (key: string) => {
  const keys = key.split('.');
  let value = translations[currentLanguage as keyof typeof translations];
  
  for (const k of keys) {
    value = value?.[k as keyof typeof value];
  }
  
  return value || key;
};
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

export const translations = {
  en: {
    translation: {
      // Add your translations here
      welcome: 'Welcome'
    }
  }
};

i18next
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;
