import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Tags,
  Clock,
  Users,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { label: "Översikt", href: "/", icon: LayoutDashboard },
  { label: "Prenumerationer", href: "/subscriptions", icon: CreditCard },
  { label: "Kategorier", href: "/categories", icon: Tags },
  { label: "Kommande betalningar", href: "/upcoming", icon: Clock },
  { label: "Familjegrupper", href: "/family", icon: Users },
  { label: "Profil", href: "/profile", icon: User },
];

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2",
    "text-sm transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-white",
    isActive
      ? "bg-sidebar-active text-sidebar-text-active"
      : "text-sidebar-text hover:bg-sidebar-active/60 hover:text-sidebar-text-active",
  ].join(" ");
}

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLabel = isAdmin ? "Admin" : "User";

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    closeMenu();
    logout();
  }

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-primary"
      >
        Hoppa till innehållet
      </a>

      {/* Mobilheader */}
      <header className="flex min-h-16 items-center justify-between gap-3 bg-sidebar-bg px-4 py-2 lg:hidden">
        <NavLink
          to="/"
          onClick={closeMenu}
          aria-label="MySubs – till översikten"
          className="flex min-h-11 items-center gap-2 rounded-md text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <CreditCard size={18} aria-hidden="true" />
          </span>
          <span className="text-base font-semibold">MySubs</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="main-sidebar"
          aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-sidebar-active focus-visible:outline-2 focus-visible:outline-white"
        >
          {menuOpen ? (
            <X size={24} aria-hidden="true" />
          ) : (
            <Menu size={24} aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Utfällbar mobilmeny och permanent sidomeny på desktop */}
      <aside
        id="main-sidebar"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            closeMenu();
            document
              .querySelector<HTMLButtonElement>(
                'button[aria-controls="main-sidebar"]'
              )
              ?.focus();
          }
        }}
        className={[
          menuOpen ? "flex" : "hidden",
          "min-w-0 flex-col gap-5 bg-sidebar-bg px-3 py-4",
          "lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto lg:py-5",
        ].join(" ")}
      >
        {/* Desktoplogo */}
        <NavLink
          to="/"
          aria-label="MySubs – till översikten"
          className="hidden min-h-11 items-center gap-2 rounded-md px-2 text-white focus-visible:outline-2 focus-visible:outline-white lg:flex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <CreditCard size={18} aria-hidden="true" />
          </span>
          <span className="text-base font-semibold">MySubs</span>
        </NavLink>

        <nav aria-label="Huvudnavigation" className="flex flex-col gap-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/"}
              onClick={closeMenu}
              className={navLinkClass}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="mb-1 mt-5 px-3 text-xs font-medium tracking-wide text-sidebar-text">
                ADMIN
              </div>

              <NavLink
                to="/admin/users"
                onClick={closeMenu}
                className={navLinkClass}
              >
                <ShieldCheck
                  size={18}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span>Användare</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Inloggad användare */}
        <div className="mt-auto rounded-lg bg-sidebar-active/50 p-3">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-white"
            >
              {initials(user?.firstName, user?.lastName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="break-all text-xs text-sidebar-text">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span
              className={`rounded px-2 py-1 text-xs font-medium ${
                isAdmin
                  ? "bg-primary/20 text-primary-soft"
                  : "bg-white/10 text-sidebar-text-active"
              }`}
            >
              {roleLabel}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm text-sidebar-text hover:bg-sidebar-active hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            >
              <LogOut size={18} aria-hidden="true" />
              Logga ut
            </button>
          </div>
        </div>
      </aside>

      {/* Sidinnehåll */}
      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 p-4 sm:p-6 lg:p-8"
      >
        <Outlet />
      </main>
    </div>
  );
}