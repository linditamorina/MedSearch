import React, { createContext, useState, useContext } from 'react';

const translations = {
  al: {
    home: "Kërko", 
    favorites: "Të preferuarat", 
    profile: "Profili",
    plan: "Plani", // Emri i Tab-it të ri
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
    health_news: "Lajmet e Shëndetit",
    results: "Rezultatet",

    // SHTESAT PËR PLANIN DHE ORARET
    select_days: "Zgjidh ditët",
    set_schedule: "Cakto Orarin",
    remaining: "mbetur",
    empty_plan: "Nuk keni asnjë orar të caktuar.",
    confirm_delete: "Konfirmo Fshirjen",
    delete_msg: "A dëshironi ta fshini orarin për",
    cancel: "Anulo",
    delete: "Fshije",
    success: "Sukses",
    updated_msg: "Orari u përditësua me sukses!",
    plan_saved: "Orari u ruajt"
  },
  en: {
    home: "Search", 
    favorites: "Favorites", 
    profile: "Profile",
    plan: "Plan",
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
    health_news: "Health News",
    results: "Results",

    // SHTESAT PËR PLANIN DHE ORARET
    select_days: "Select days",
    set_schedule: "Set Schedule",
    remaining: "remaining",
    empty_plan: "No schedules set yet.",
    confirm_delete: "Confirm Delete",
    delete_msg: "Are you sure you want to delete the schedule for",
    cancel: "Cancel",
    delete: "Delete",
    success: "Success",
    updated_msg: "Schedule updated successfully!",
    plan_saved: "Schedule saved"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('al');
  
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