import React, { createContext, useContext, useState, useEffect } from 'react';

const SUPPORTED_LANGUAGES = ['en', 'zh', 'es', 'fr', 'de', 'ar', 'hi', 'mr', 'ru', 'ja', 'pt'];

const LanguageContext = createContext({
  language: 'en',
  setLanguage: (lang: string) => {},
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      setLanguage(browserLang);
    }
  }, []);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext); 