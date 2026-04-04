import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, Languages } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationBell } from "@/components/NotificationBell";

export const Navigation = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const rafId = useRef(0);
  const { user, profile, role, signOut, loading } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode") === "true";
    setIsDark(darkMode);
    if (darkMode) document.documentElement.classList.add("dark");
  }, []);

  // RAF-throttled scroll handler — only updates state when thresholds cross,
  // so we never force a React re-render on every scroll pixel.
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
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    ...(!isStaff ? [{ name: "Tax Calculator", path: "/tax-calculator" }] : []),
    ...(!isStaff ? [{ name: "Calculators", path: "/calculators" }] : []),
    { name: "Resources", path: "/resources" },
    { name: "Contact", path: "/contact" },
    ...(!isStaff ? [
      { name: "My Dashboard", path: "/dashboard" },
      { name: "My Appointments", path: "/my-appointments" },
    ] : []),
    ...(isStaff ? [
      { name: "Admin Panel", path: "/admin" },
      { name: "Blog", path: "/admin/blog" },
      { name: "Reviews", path: "/admin/testimonials" },
    ] : []),
  ];

  const displayName = profile?.name || user?.email?.split("@")[0] || "";

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -80 : 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: "transform, opacity" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${scrolled ? "glass border-b border-border/40 shadow-soft" : "bg-transparent"}`
      }>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              
              <span className="text-[17px] font-semibold tracking-tight">
                GMR<span className="text-accent">&</span>Associates
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
            <Link
              key={link.path}
              to={link.path}
              className={`text-[13px] tracking-[0.01em] transition-colors duration-200 relative py-1 ${location.pathname === link.path ?
              "text-foreground" :
              "text-muted-foreground hover:text-foreground"}`
              }>
              
                {link.name}
                {location.pathname === link.path &&
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 -z-10 rounded-full bg-secondary"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ paddingLeft: "12px", paddingRight: "12px", margin: "0 -12px" }} />

              }
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              aria-label="Toggle theme">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "sun" : "moon"}
                  initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}>
                  
                  {isDark ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Language Toggle */}
            <motion.button
              onClick={toggleLanguage}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="h-8 px-2.5 flex items-center gap-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 text-xs font-medium"
              aria-label="Toggle language">
              <Languages className="h-[14px] w-[14px]" />
              {language === "en" ? "HI" : "EN"}
            </motion.button>

            {!loading && user ?
            <div className="flex items-center gap-3">
                <NotificationBell />
                <span className="text-[13px] text-muted-foreground">{displayName}</span>
                <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="h-8 text-[13px] rounded-full px-4 border-border/60 hover:bg-secondary">
                
                  Sign Out
                </Button>
              </div> :
            !loading ?
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="h-8 text-[13px] rounded-full px-4 hover:bg-secondary">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild size="sm" className="h-8 text-[13px] rounded-full px-4 bg-foreground text-background hover:bg-foreground/90">
                  <Link to="/auth?signup=true">Get Started</Link>
                </Button>
              </div> :
            null}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? "close" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.12 }}>
                
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen &&
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="md:hidden border-t border-border/40 glass overflow-hidden">
          
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-1">
              {navLinks.map((link, i) =>
            <motion.div
              key={link.path}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}>
              
                  <Link
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`text-[15px] py-2.5 px-3 block rounded-xl transition-all ${location.pathname === link.path ?
                "text-foreground font-medium bg-secondary" :
                "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`
                }>
                
                    {link.name}
                  </Link>
                </motion.div>
            )}

              <div className="flex items-center gap-3 pt-4 mt-2 border-t border-border/40">
                <button
                onClick={toggleTheme}
                className="text-[13px] text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors">
                
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDark ? "Light" : "Dark"} Mode
                </button>
              </div>

              {!loading && user ?
            <Button onClick={handleLogout} variant="outline" className="w-full rounded-xl mt-2">
                  Sign Out
                </Button> :
            !loading ?
            <div className="flex flex-col gap-2 mt-2">
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="w-full rounded-xl bg-foreground text-background">
                    <Link to="/auth?signup=true" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div> :
            null}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </motion.nav>);

};