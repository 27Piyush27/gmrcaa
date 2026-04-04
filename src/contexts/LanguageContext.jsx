import { createContext, useContext, useState, useEffect } from "react";

const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.about": "About",
    "nav.services": "Services",
    "nav.contact": "Contact",
    "nav.dashboard": "My Dashboard",
    "nav.appointments": "My Appointments",
    "nav.admin": "Admin Panel",
    "nav.blog": "Blog",
    "nav.reviews": "Reviews",
    "nav.taxCalc": "Tax Calculator",
    "nav.login": "Login",
    "nav.getStarted": "Get Started",
    "nav.signOut": "Sign Out",

    // Home
    "home.hero.title": "Expert Financial Solutions",
    "home.hero.subtitle": "Comprehensive expertise across every financial discipline",
    "home.cta.explore": "Explore Services",
    "home.cta.book": "Book Consultation",
    "home.stats.clients": "Happy Clients",
    "home.stats.experience": "Years Experience",
    "home.stats.services": "Services",
    "home.stats.teamMembers": "Team Members",

    // Common
    "common.learnMore": "Learn more",
    "common.readMore": "Read More",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.all": "All",
    "common.loading": "Loading...",
    "common.noResults": "No results found",
    "common.viewAll": "View All",

    // Footer
    "footer.company": "Company",
    "footer.services": "Services",
    "footer.legal": "Legal",
    "footer.rights": "All rights reserved",
    "footer.available": "Available for new clients",

    // Auth
    "auth.login": "Sign In",
    "auth.signup": "Create Account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full Name",
    "auth.forgotPassword": "Forgot password?",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.workspace": "CA Workspace",
    "dashboard.totalServices": "Total Services",
    "dashboard.inProgress": "In Progress",
    "dashboard.readyToPay": "Ready to Pay",
    "dashboard.paidDone": "Paid & Done",

    // Tools
    "tools.gstTracker": "GST Tracker",
    "tools.expenses": "Expenses",
    "tools.calculators": "Calculators",
    "tools.resources": "Resources",
    "tools.feedback": "Feedback",
  },
  hi: {
    // Navigation
    "nav.home": "होम",
    "nav.about": "हमारे बारे में",
    "nav.services": "सेवाएं",
    "nav.contact": "संपर्क करें",
    "nav.dashboard": "मेरा डैशबोर्ड",
    "nav.appointments": "मेरी अपॉइंटमेंट",
    "nav.admin": "एडमिन पैनल",
    "nav.blog": "ब्लॉग",
    "nav.reviews": "समीक्षाएं",
    "nav.taxCalc": "टैक्स कैलकुलेटर",
    "nav.login": "लॉगिन",
    "nav.getStarted": "शुरू करें",
    "nav.signOut": "साइन आउट",

    // Home
    "home.hero.title": "विशेषज्ञ वित्तीय समाधान",
    "home.hero.subtitle": "हर वित्तीय विषय में व्यापक विशेषज्ञता",
    "home.cta.explore": "सेवाएं देखें",
    "home.cta.book": "परामर्श बुक करें",
    "home.stats.clients": "खुश ग्राहक",
    "home.stats.experience": "वर्षों का अनुभव",
    "home.stats.services": "सेवाएं",
    "home.stats.teamMembers": "टीम सदस्य",

    // Common
    "common.learnMore": "और जानें",
    "common.readMore": "और पढ़ें",
    "common.submit": "जमा करें",
    "common.cancel": "रद्द करें",
    "common.save": "सहेजें",
    "common.delete": "हटाएं",
    "common.edit": "संपादित करें",
    "common.search": "खोजें",
    "common.filter": "फ़िल्टर",
    "common.all": "सभी",
    "common.loading": "लोड हो रहा है...",
    "common.noResults": "कोई परिणाम नहीं मिला",
    "common.viewAll": "सभी देखें",

    // Footer
    "footer.company": "कंपनी",
    "footer.services": "सेवाएं",
    "footer.legal": "कानूनी",
    "footer.rights": "सर्वाधिकार सुरक्षित",
    "footer.available": "नए ग्राहकों के लिए उपलब्ध",

    // Auth
    "auth.login": "साइन इन",
    "auth.signup": "खाता बनाएं",
    "auth.email": "ईमेल",
    "auth.password": "पासवर्ड",
    "auth.name": "पूरा नाम",
    "auth.forgotPassword": "पासवर्ड भूल गए?",

    // Dashboard
    "dashboard.welcome": "वापसी पर स्वागत है",
    "dashboard.workspace": "CA कार्यक्षेत्र",
    "dashboard.totalServices": "कुल सेवाएं",
    "dashboard.inProgress": "प्रगति में",
    "dashboard.readyToPay": "भुगतान के लिए तैयार",
    "dashboard.paidDone": "भुगतान हो गया",

    // Tools
    "tools.gstTracker": "GST ट्रैकर",
    "tools.expenses": "खर्चे",
    "tools.calculators": "कैलकुलेटर",
    "tools.resources": "संसाधन",
    "tools.feedback": "प्रतिक्रिया",
  }
};

const LanguageContext = createContext(undefined);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("app-language") || "en";
  });

  useEffect(() => {
    localStorage.setItem("app-language", language);
    document.documentElement.lang = language === "hi" ? "hi-IN" : "en-IN";
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "hi" : "en");
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
