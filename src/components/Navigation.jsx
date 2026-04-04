import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Moon, Sun, Menu, X, Languages, ChevronDown,
  Calculator, FileText, Wallet, BookOpen, MessageSquare, Bell,
  LayoutDashboard, CalendarDays, User, LogOut, Shield,
  Calendar, MessageCircle, Gift, TrendingUp, Columns3, ShieldCheck
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationBell } from "@/components/NotificationBell";

const easing = [0.22, 1, 0.36, 1];

const TOOLS_ITEMS = [
  { name: "Tax Calculator", path: "/tax-calculator", icon: Calculator, desc: "Old & New regime comparison" },
  { name: "Financial Calculators", path: "/calculators", icon: Calculator, desc: "EMI, SIP & HRA tools" },
  { name: "GST Tracker", path: "/gst-tracker", icon: FileText, desc: "Filing status & deadlines" },
  { name: "Expense Tracker", path: "/expenses", icon: Wallet, desc: "Track business expenses" },
  { name: "Tax Calendar", path: "/tax-calendar", icon: Calendar, desc: "All tax deadlines" },
  { name: "Resource Center", path: "/resources", icon: BookOpen, desc: "Checklists & guides" },
];

const ACCOUNT_ITEMS = [
  { name: "My Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Messages", path: "/messages", icon: MessageCircle },
  { name: "My Appointments", path: "/my-appointments", icon: CalendarDays },
  { name: "Compliance Score", path: "/compliance", icon: ShieldCheck },
  { name: "Referrals", path: "/referrals", icon: Gift },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Profile", path: "/profile", icon: User },
];

const ADMIN_ITEMS = [
  { name: "Admin Panel", path: "/admin", icon: Shield },
  { name: "Revenue Dashboard", path: "/admin/revenue", icon: TrendingUp },
  { name: "Task Board", path: "/admin/tasks", icon: Columns3 },
  { name: "Blog Manager", path: "/admin/blog", icon: FileText },
  { name: "Reviews", path: "/admin/testimonials", icon: MessageSquare },
];

// Reusable dropdown wrapper
function NavDropdown({ label, children, isActive }) {
  const [open, setOpen] = useState(false);
  const timeout = useRef(null);
  const ref = useRef(null);

  const handleEnter = () => { clearTimeout(timeout.current); setOpen(true); };
  const handleLeave = () => { timeout.current = setTimeout(() => setOpen(false), 150); };

  return (
    <div ref={ref} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-[13px] tracking-[0.01em] transition-colors duration-200 py-1 ${
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: easing }}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
          >
            <div className="min-w-[260px] rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-lg overflow-hidden">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const Navigation = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);
  const lastScrollY = useRef(0);
  const rafId = useRef(0);
  const { user, profile, role, signOut, loading } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    setIsDark(darkMode);
    if (darkMode) document.documentElement.classList.add("dark");
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      const y = window.scrollY;
      const prev = lastScrollY.current;
      setScrolled(y > 24);
      setHidden(y > prev && y > 80);
      lastScrollY.current = y;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [handleScroll]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("darkMode", String(newDark));
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const isStaff = role === "admin" || role === "ca";

  const primaryLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
  ];

  const displayName = profile?.name || user?.email?.split("@")[0] || "";
  const initials = displayName ? displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";

  const toolsPaths = TOOLS_ITEMS.map(t => t.path);
  const isToolsActive = toolsPaths.includes(location.pathname);

  const accountPaths = [...ACCOUNT_ITEMS.map(a => a.path), ...ADMIN_ITEMS.map(a => a.path)];
  const isAccountActive = accountPaths.includes(location.pathname);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -80 : 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: "transform, opacity" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "glass border-b border-border/40 shadow-soft" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <motion.div whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <span className="text-[17px] font-semibold tracking-tight">
                GMR<span className="text-accent">&</span>Associates
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation — clean & grouped */}
          <div className="hidden lg:flex items-center gap-7">
            {primaryLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[13px] tracking-[0.01em] transition-colors duration-200 relative py-1 ${
                  location.pathname === link.path
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-secondary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ paddingLeft: "12px", paddingRight: "12px", margin: "0 -12px" }}
                  />
                )}
              </Link>
            ))}

            {/* Tools Dropdown */}
            {!isStaff && (
              <NavDropdown label="Tools" isActive={isToolsActive}>
                <div className="p-2">
                  {TOOLS_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                          location.pathname === item.path
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          location.pathname === item.path
                            ? "bg-accent/10 text-accent"
                            : "bg-secondary/80 group-hover:bg-accent/10 group-hover:text-accent"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium leading-tight">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </NavDropdown>
            )}

            {/* Admin Links (staff only — small set, can be flat) */}
            {isStaff && (
              <NavDropdown label="Admin" isActive={isAccountActive}>
                <div className="p-2">
                  {ADMIN_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                          location.pathname === item.path
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[13px] font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </NavDropdown>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "sun" : "moon"}
                  initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                >
                  {isDark ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Language Toggle */}
            <motion.button
              onClick={toggleLanguage}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="h-8 px-2 flex items-center gap-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 text-xs font-medium"
              aria-label="Toggle language"
            >
              <Languages className="h-[14px] w-[14px]" />
              {language === "en" ? "हि" : "EN"}
            </motion.button>

            {/* Auth Section */}
            {!loading && user ? (
              <div className="flex items-center gap-2 ml-1">
                <NotificationBell />
                {/* User Avatar Dropdown */}
                <NavDropdown
                  label={
                    <span className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-[11px] font-bold">
                        {initials}
                      </span>
                    </span>
                  }
                  isActive={isAccountActive}
                >
                  <div className="p-3 border-b border-border/40">
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    {ACCOUNT_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                            location.pathname === item.path
                              ? "bg-secondary text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[13px]">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="p-2 border-t border-border/40">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-150 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-[13px]">Sign Out</span>
                    </button>
                  </div>
                </NavDropdown>
              </div>
            ) : !loading ? (
              <div className="flex items-center gap-2 ml-1">
                <Button asChild variant="ghost" size="sm" className="h-8 text-[13px] rounded-full px-4 hover:bg-secondary">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild size="sm" className="h-8 text-[13px] rounded-full px-4 bg-foreground text-background hover:bg-foreground/90">
                  <Link to="/auth?signup=true">Get Started</Link>
                </Button>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? "close" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:hidden border-t border-border/40 glass overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-0.5">
              {/* Primary Links */}
              {primaryLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-[15px] py-2.5 px-3 block rounded-xl transition-all ${
                      location.pathname === link.path
                        ? "text-foreground font-medium bg-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Tools Section */}
              {!isStaff && (
                <div className="mt-1">
                  <button
                    onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                    className="flex items-center justify-between w-full text-[15px] py-2.5 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                  >
                    Tools
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileToolsOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {mobileToolsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-3 flex flex-col gap-0.5 pb-1">
                          {TOOLS_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 text-[14px] py-2 px-3 rounded-xl transition-all ${
                                  location.pathname === item.path
                                    ? "text-foreground font-medium bg-secondary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile Account Section */}
              {user && !isStaff && (
                <div className="mt-1">
                  <button
                    onClick={() => setMobileAccountOpen(!mobileAccountOpen)}
                    className="flex items-center justify-between w-full text-[15px] py-2.5 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                  >
                    Account
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileAccountOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {mobileAccountOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-3 flex flex-col gap-0.5 pb-1">
                          {ACCOUNT_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 text-[14px] py-2 px-3 rounded-xl transition-all ${
                                  location.pathname === item.path
                                    ? "text-foreground font-medium bg-secondary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Admin Mobile */}
              {isStaff && (
                <>
                  {ADMIN_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 text-[15px] py-2.5 px-3 rounded-xl transition-all ${
                          location.pathname === item.path
                            ? "text-foreground font-medium bg-secondary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Bottom actions */}
              <div className="flex items-center gap-3 pt-4 mt-2 border-t border-border/40">
                <button
                  onClick={toggleTheme}
                  className="text-[13px] text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDark ? "Light" : "Dark"} Mode
                </button>
                <button
                  onClick={toggleLanguage}
                  className="text-[13px] text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Languages className="h-4 w-4" />
                  {language === "en" ? "हिन्दी" : "English"}
                </button>
              </div>

              {!loading && user ? (
                <Button onClick={handleLogout} variant="outline" className="w-full rounded-xl mt-2">
                  Sign Out
                </Button>
              ) : !loading ? (
                <div className="flex flex-col gap-2 mt-2">
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="w-full rounded-xl bg-foreground text-background">
                    <Link to="/auth?signup=true" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};