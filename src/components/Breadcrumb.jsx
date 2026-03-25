import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS = {
  "/": "Home",
  "/about": "About",
  "/services": "Services",
  "/contact": "Contact",
  "/dashboard": "Dashboard",
  "/admin": "Admin",
  "/auth": "Login",
  "/profile": "Profile",
  "/tax-calculator": "Tax Calculator",
  "/faq": "FAQ",
  "/blog": "Blog",
  "/terms": "Terms of Service",
  "/privacy": "Privacy Policy",
  "/appointments": "Appointments",
  "/analytics": "Analytics",
  "/payments": "Payments",
};

export function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) return null;

  const crumbs = pathSegments.map((seg, i) => {
    const path = `/${pathSegments.slice(0, i + 1).join("/")}`;
    const label = ROUTE_LABELS[path] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    const isLast = i === pathSegments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="w-3 h-3" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-muted-foreground hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
