import React, { createContext, useState, useContext } from 'react';

const translations = {
  al: {
    home: "Kërko", 
    favorites: "Të preferuarat", 
    profile: "Profili",
    search_placeholder: "Kërko barna...", 
    details: "Detajet",
    read_more: "Lexo më shumë", 
    read_less: "Lexo më pak",
    dark_mode: "Mënyra e errët", 
    language: "Gjuha", 
    logout: "Dil",
    indications: "Indikacionet", 
    dosage: "Dozimi",
    warnings: "Paralajmërime", 
    side_effects: "Efektet Anësore",
    empty_fav: "Nuk keni asnjë bar të ruajtur.", 
    unknown: "I panjohur",
    welcome: "Mirësevini,", 
    suggestions: "Sugjerimet", 
    version: "Versioni",
    // SHTESA E RE KËTU:
    health_news: "Lajmet e Shëndetit",
    results: "Rezultatet"
  },
  en: {
    home: "Search", 
    favorites: "Favorites", 
    profile: "Profile",
    search_placeholder: "Search medicines...", 
    details: "Details",
    read_more: "Read more", 
    read_less: "Read less",
    dark_mode: "Dark Mode", 
    language: "Language", 
    logout: "Logout",
    indications: "Indications", 
    dosage: "Dosage",
    warnings: "Warnings", 
    side_effects: "Side Effects",
    empty_fav: "No favorites saved.", 
    unknown: "Unknown",
    welcome: "Welcome,", 
    suggestions: "Suggestions", 
    version: "Version",
    // SHTESA E RE KËTU:
    health_news: "Health News",
    results: "Results"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('al');
  
  // Funksioni t kërkon çelësin, nëse nuk e gjen kthen vetë emrin e çelësit
  const t = (key) => {
    if (translations[locale] && translations[locale][key]) {
      return translations[locale][key];
    }
    return key; 
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);