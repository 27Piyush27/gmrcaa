import { createContext, useContext, useState, useEffect } from "react";

const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.about": "About",
    "nav.services": "Services",
    "nav.careers": "Careers",
    "nav.contact": "Contact",
    "nav.tools": "Tools",
    "nav.admin": "Admin",
    "nav.account": "Account",
    "nav.dashboard": "My Dashboard",
    "nav.appointments": "My Appointments",
    "nav.admin_panel": "Admin Panel",
    "nav.blog": "Blog",
    "nav.reviews": "Reviews",
    "nav.taxCalc": "Tax Calculator",
    "nav.login": "Login",
    "nav.getStarted": "Get Started",
    "nav.signOut": "Sign Out",
    "nav.darkMode": "Dark Mode",
    "nav.lightMode": "Light Mode",

    // Home — Hero
    "home.badge": "Chartered Accountants · Since 2011",
    "home.hero.line1": "Financial clarity.",
    "home.hero.line2": "Uncompromised.",
    "home.hero.subtitle_pre": "We partner with discerning businesses to deliver",
    "home.hero.subtitle_post": "services of the highest calibre — precisely when it matters most.",
    "home.cta.explore": "Explore Services",
    "home.cta.expert": "Talk to an Expert",
    "home.scroll": "Scroll",

    // Home — Stats
    "home.stats.clients": "Clients Served",
    "home.stats.experience": "Years of Excellence",
    "home.stats.retention": "Client Retention",

    // Home — Services section
    "home.services.label": "What We Do",
    "home.services.heading": "Comprehensive expertise across every financial discipline",
    "home.services.accounting.title": "Accounting & Bookkeeping",
    "home.services.accounting.desc": "Precision financial management with meticulous attention to every detail.",
    "home.services.audit.title": "Auditing & Assurance",
    "home.services.audit.desc": "Comprehensive audits ensuring complete accuracy and regulatory compliance.",
    "home.services.tax.title": "Tax Advisory",
    "home.services.tax.desc": "Strategic planning to optimize your tax position legally and responsibly.",
    "home.services.consulting.title": "Business Consulting",
    "home.services.consulting.desc": "Expert guidance for growth, restructuring, and long-term financial health.",

    // Home — Process
    "home.process.label": "How It Works",
    "home.process.heading": "Simple. Transparent. Effective.",
    "home.process.step1.title": "Consultation",
    "home.process.step1.desc": "We listen first. A dedicated CA understands your unique situation, goals, and challenges.",
    "home.process.step2.title": "Strategy",
    "home.process.step2.desc": "We craft a tailored plan optimised for compliance, efficiency, and your long-term growth.",
    "home.process.step3.title": "Execution",
    "home.process.step3.desc": "Transparent delivery with real-time updates through your personal client portal.",

    // Home — Philosophy
    "home.philosophy.label": "Our Philosophy",
    "home.philosophy.quote1": "\"Excellence is not a skill.",
    "home.philosophy.quote2": "It's an attitude reflected in every",
    "home.philosophy.quote3": "balance sheet.",
    "home.philosophy.quote4": "\"",
    "home.philosophy.author": "— GMR & Associates",

    // Home — CTA
    "home.cta.label": "Ready to Begin?",
    "home.cta.heading1": "Let's elevate your",
    "home.cta.heading2": "financial strategy today.",
    "home.cta.desc": "Join 500+ businesses who trust GMR & Associates for their most important financial decisions.",
    "home.cta.schedule": "Schedule Consultation",
    "home.cta.create": "Create Account",

    // Home — Ticker
    "home.ticker.accounting": "Accounting & Bookkeeping",
    "home.ticker.tax": "Tax Advisory",
    "home.ticker.audit": "Auditing & Assurance",
    "home.ticker.consulting": "Business Consulting",
    "home.ticker.gst": "GST Filing",
    "home.ticker.company": "Company Registration",
    "home.ticker.planning": "Financial Planning",
    "home.ticker.payroll": "Payroll Management",

    // Home — Rotating words
    "home.rotating.accounting": "accounting",
    "home.rotating.tax": "tax advisory",
    "home.rotating.audit": "auditing",
    "home.rotating.consulting": "consulting",

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
    "footer.brand_desc": "Chartered Accountants providing comprehensive professional services with precision and integrity since 2011.",
    "footer.about": "About",
    "footer.contact": "Contact",
    "footer.clientPortal": "Client Portal",
    "footer.faq": "FAQ",
    "footer.team": "Team",
    "footer.testimonials": "Testimonials",
    "footer.careers": "Careers",
    "footer.feedback": "Feedback",
    "footer.taxCalc": "Tax Calculator",
    "footer.financialCalc": "Financial Calculators",
    "footer.gstTracker": "GST Tracker",

    "footer.resources": "Resource Center",
    "footer.bookConsultation": "Book Consultation",
    "footer.viewAllServices": "View All Services",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.blog": "Blog",

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
    "tools.taxCalc": "Tax Calculator",
    "tools.financialCalc": "Financial Calculators",
    "tools.gstTracker": "GST Tracker",

    "tools.taxCalendar": "Tax Calendar",
    "tools.resources": "Resource Center",
    "tools.expenses": "Expenses",
    "tools.calculators": "Calculators",
    "tools.feedback": "Feedback",
    "tools.taxCalc.desc": "Old & New regime comparison",
    "tools.financialCalc.desc": "EMI, SIP & HRA tools",
    "tools.gstTracker.desc": "Filing status & deadlines",

    "tools.taxCalendar.desc": "All tax deadlines",
    "tools.resources.desc": "Checklists & guides",

    // AI Tools
    "ai.taxOptimizer": "AI Tax Optimizer",
    "ai.docAnalyzer": "Smart Doc Analyzer",
    "ai.financialInsights": "Financial Insights",
    "ai.riskAssessment": "Risk Assessment",
    "ai.cashFlow": "Cash Flow Forecaster",
    "ai.invoiceScanner": "Invoice Scanner",
    "ai.deductionFinder": "Deduction Finder",
    "ai.hub": "AI Hub",
    "ai.section": "AI & ML Tools",
    "ai.taxOptimizer.desc": "Smart regime & deduction AI",
    "ai.docAnalyzer.desc": "AI document classification",
    "ai.financialInsights.desc": "Predictive analytics & ML",
    "ai.riskAssessment.desc": "ML compliance risk scoring",
    "ai.cashFlow.desc": "Monte Carlo simulations",
    "ai.invoiceScanner.desc": "AI invoice extraction",
    "ai.deductionFinder.desc": "Find missed deductions",
    "ai.hub.desc": "All AI tools overview",

    // Account items
    "account.dashboard": "My Dashboard",

    "account.appointments": "My Appointments",
    "account.compliance": "Compliance Score",
    "account.referrals": "Referrals",
    "account.notifications": "Notifications",
    "account.profile": "Profile",

    // Admin items
    "admin.panel": "Admin Panel",

    "admin.tasks": "Task Board",
    "admin.services": "Manage Services",
    "admin.team": "Team Manager",
    "admin.clientInsights": "Client Insights",
    "admin.workload": "Workload Optimizer",
    "admin.anomalies": "Anomaly Console",
    "admin.blog": "Blog Manager",
    "admin.reviews": "Reviews",
    "admin.careers": "Manage Careers",
  },
  hi: {
    // Navigation
    "nav.home": "होम",
    "nav.about": "हमारे बारे में",
    "nav.services": "सेवाएं",
    "nav.careers": "करियर",
    "nav.contact": "संपर्क करें",
    "nav.tools": "उपकरण",
    "nav.admin": "एडमिन",
    "nav.account": "खाता",
    "nav.dashboard": "मेरा डैशबोर्ड",
    "nav.appointments": "मेरी अपॉइंटमेंट",
    "nav.admin_panel": "एडमिन पैनल",
    "nav.blog": "ब्लॉग",
    "nav.reviews": "समीक्षाएं",
    "nav.taxCalc": "टैक्स कैलकुलेटर",
    "nav.login": "लॉगिन",
    "nav.getStarted": "शुरू करें",
    "nav.signOut": "साइन आउट",
    "nav.darkMode": "डार्क मोड",
    "nav.lightMode": "लाइट मोड",

    // Home — Hero
    "home.badge": "चार्टर्ड अकाउंटेंट · 2011 से",
    "home.hero.line1": "वित्तीय स्पष्टता।",
    "home.hero.line2": "बिना समझौता।",
    "home.hero.subtitle_pre": "हम विशिष्ट व्यवसायों के साथ मिलकर उच्चतम स्तर की",
    "home.hero.subtitle_post": "सेवाएं प्रदान करते हैं — ठीक जब इसकी सबसे ज़रूरत होती है।",
    "home.cta.explore": "सेवाएं देखें",
    "home.cta.expert": "विशेषज्ञ से बात करें",
    "home.scroll": "स्क्रॉल",

    // Home — Stats
    "home.stats.clients": "ग्राहकों की सेवा",
    "home.stats.experience": "वर्षों की उत्कृष्टता",
    "home.stats.retention": "ग्राहक प्रतिधारण",

    // Home — Services section
    "home.services.label": "हम क्या करते हैं",
    "home.services.heading": "हर वित्तीय विषय में व्यापक विशेषज्ञता",
    "home.services.accounting.title": "लेखांकन एवं बहीखाता",
    "home.services.accounting.desc": "हर विवरण पर सूक्ष्म ध्यान के साथ सटीक वित्तीय प्रबंधन।",
    "home.services.audit.title": "ऑडिट एवं आश्वासन",
    "home.services.audit.desc": "पूर्ण सटीकता और नियामक अनुपालन सुनिश्चित करने वाला व्यापक ऑडिट।",
    "home.services.tax.title": "कर सलाहकार",
    "home.services.tax.desc": "आपकी कर स्थिति को कानूनी और ज़िम्मेदारी से अनुकूलित करने की रणनीतिक योजना।",
    "home.services.consulting.title": "व्यवसाय परामर्श",
    "home.services.consulting.desc": "विकास, पुनर्गठन और दीर्घकालिक वित्तीय स्वास्थ्य के लिए विशेषज्ञ मार्गदर्शन।",

    // Home — Process
    "home.process.label": "यह कैसे काम करता है",
    "home.process.heading": "सरल। पारदर्शी। प्रभावी।",
    "home.process.step1.title": "परामर्श",
    "home.process.step1.desc": "हम पहले सुनते हैं। एक समर्पित CA आपकी अनूठी स्थिति, लक्ष्यों और चुनौतियों को समझता है।",
    "home.process.step2.title": "रणनीति",
    "home.process.step2.desc": "हम अनुपालन, दक्षता और आपके दीर्घकालिक विकास के लिए अनुकूलित योजना बनाते हैं।",
    "home.process.step3.title": "कार्यान्वयन",
    "home.process.step3.desc": "आपके व्यक्तिगत क्लाइंट पोर्टल के माध्यम से रियल-टाइम अपडेट के साथ पारदर्शी डिलीवरी।",

    // Home — Philosophy
    "home.philosophy.label": "हमारा दर्शन",
    "home.philosophy.quote1": "\"उत्कृष्टता एक कौशल नहीं है।",
    "home.philosophy.quote2": "यह हर",
    "home.philosophy.quote3": "बैलेंस शीट",
    "home.philosophy.quote4": " में झलकने वाला दृष्टिकोण है।\"",
    "home.philosophy.author": "— जीएमआर एंड एसोसिएट्स",

    // Home — CTA
    "home.cta.label": "शुरू करने के लिए तैयार?",
    "home.cta.heading1": "आइए आपकी वित्तीय",
    "home.cta.heading2": "रणनीति को आज ही उन्नत करें।",
    "home.cta.desc": "500+ व्यवसायों से जुड़ें जो अपने सबसे महत्वपूर्ण वित्तीय निर्णयों के लिए GMR & Associates पर भरोसा करते हैं।",
    "home.cta.schedule": "परामर्श शेड्यूल करें",
    "home.cta.create": "खाता बनाएं",

    // Home — Ticker
    "home.ticker.accounting": "लेखांकन एवं बहीखाता",
    "home.ticker.tax": "कर सलाहकार",
    "home.ticker.audit": "ऑडिट एवं आश्वासन",
    "home.ticker.consulting": "व्यवसाय परामर्श",
    "home.ticker.gst": "GST फाइलिंग",
    "home.ticker.company": "कंपनी पंजीकरण",
    "home.ticker.planning": "वित्तीय योजना",
    "home.ticker.payroll": "पेरोल प्रबंधन",

    // Home — Rotating words
    "home.rotating.accounting": "लेखांकन",
    "home.rotating.tax": "कर सलाहकार",
    "home.rotating.audit": "ऑडिटिंग",
    "home.rotating.consulting": "परामर्श",

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
    "footer.brand_desc": "चार्टर्ड अकाउंटेंट 2011 से सटीकता और ईमानदारी के साथ व्यापक पेशेवर सेवाएं प्रदान कर रहे हैं।",
    "footer.about": "हमारे बारे में",
    "footer.contact": "संपर्क करें",
    "footer.clientPortal": "क्लाइंट पोर्टल",
    "footer.faq": "अक्सर पूछे जाने वाले प्रश्न",
    "footer.team": "टीम",
    "footer.testimonials": "प्रशंसापत्र",
    "footer.careers": "करियर",
    "footer.feedback": "प्रतिक्रिया",
    "footer.taxCalc": "टैक्स कैलकुलेटर",
    "footer.financialCalc": "वित्तीय कैलकुलेटर",
    "footer.gstTracker": "GST ट्रैकर",

    "footer.resources": "संसाधन केंद्र",
    "footer.bookConsultation": "परामर्श बुक करें",
    "footer.viewAllServices": "सभी सेवाएं देखें",
    "footer.terms": "सेवा की शर्तें",
    "footer.privacy": "गोपनीयता नीति",
    "footer.blog": "ब्लॉग",

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
    "tools.taxCalc": "टैक्स कैलकुलेटर",
    "tools.financialCalc": "वित्तीय कैलकुलेटर",
    "tools.gstTracker": "GST ट्रैकर",

    "tools.taxCalendar": "टैक्स कैलेंडर",
    "tools.resources": "संसाधन केंद्र",
    "tools.expenses": "खर्चे",
    "tools.calculators": "कैलकुलेटर",
    "tools.feedback": "प्रतिक्रिया",
    "tools.taxCalc.desc": "पुरानी और नई व्यवस्था तुलना",
    "tools.financialCalc.desc": "EMI, SIP और HRA उपकरण",
    "tools.gstTracker.desc": "फाइलिंग स्थिति और समय-सीमा",

    "tools.taxCalendar.desc": "सभी कर की समय-सीमाएं",
    "tools.resources.desc": "चेकलिस्ट और गाइड",

    // AI Tools
    "ai.taxOptimizer": "AI टैक्स ऑप्टिमाइज़र",
    "ai.docAnalyzer": "स्मार्ट डॉक एनालाइज़र",
    "ai.financialInsights": "वित्तीय अंतर्दृष्टि",
    "ai.riskAssessment": "जोखिम मूल्यांकन",
    "ai.cashFlow": "कैश फ्लो फोरकास्टर",
    "ai.invoiceScanner": "इनवॉइस स्कैनर",
    "ai.deductionFinder": "कटौती खोजक",
    "ai.hub": "AI हब",
    "ai.section": "AI और ML उपकरण",
    "ai.taxOptimizer.desc": "स्मार्ट कर व्यवस्था और कटौती AI",
    "ai.docAnalyzer.desc": "AI दस्तावेज़ वर्गीकरण",
    "ai.financialInsights.desc": "पूर्वानुमान विश्लेषण और ML",
    "ai.riskAssessment.desc": "ML अनुपालन जोखिम स्कोरिंग",
    "ai.cashFlow.desc": "मोंटे कार्लो सिमुलेशन",
    "ai.invoiceScanner.desc": "AI इनवॉइस एक्सट्रैक्शन",
    "ai.deductionFinder.desc": "छूटी हुई कटौतियां खोजें",
    "ai.hub.desc": "सभी AI उपकरण अवलोकन",

    // Account items
    "account.dashboard": "मेरा डैशबोर्ड",

    "account.appointments": "मेरी अपॉइंटमेंट",
    "account.compliance": "अनुपालन स्कोर",
    "account.referrals": "रेफ़रल",
    "account.notifications": "सूचनाएं",
    "account.profile": "प्रोफ़ाइल",

    // Admin items
    "admin.panel": "एडमिन पैनल",

    "admin.tasks": "टास्क बोर्ड",
    "admin.services": "सेवाएं प्रबंधित करें",
    "admin.team": "टीम मैनेजर",
    "admin.clientInsights": "ग्राहक अंतर्दृष्टि",
    "admin.workload": "कार्यभार अनुकूलक",
    "admin.anomalies": "विसंगति कंसोल",
    "admin.blog": "ब्लॉग मैनेजर",
    "admin.reviews": "समीक्षाएं",
    "admin.careers": "करियर प्रबंधित करें",
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
