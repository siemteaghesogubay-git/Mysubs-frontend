import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, CreditCard, LayoutGrid, Clock, Users, User, LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { label: "Översikt", href: "/", icon: LayoutDashboard },
  { label: "Prenumerationer", href: "/subscriptions", icon: CreditCard },
  { label: "Kategorier", href: "/categories", icon: LayoutGrid },
  { label: "Kommande betalningar", href: "/upcoming", icon: Clock },
  { label: "Familjegrupper", href: "/family", icon: Users },
  { label: "Profil", href: "/profile", icon: User },
];

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export function Layout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-background">
      <aside className="flex flex-col bg-sidebar-bg px-3 py-5">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <CreditCard size={15} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-white">MySubs</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  isActive
                    ? "bg-sidebar-active text-sidebar-text-active"
                    : "text-sidebar-text hover:bg-sidebar-active/60 hover:text-sidebar-text-active"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {isAdmin && (
          <>
            <div className="mt-6 mb-2 px-3 text-[11px] font-medium tracking-wide text-sidebar-text/60">
              ADMIN
            </div>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] ${
                  isActive
                    ? "bg-sidebar-active text-sidebar-text-active"
                    : "text-sidebar-text hover:bg-sidebar-active/60 hover:text-sidebar-text-active"
                }`
              }
            >
              <Users size={16} />
              Användare
            </NavLink>
          </>
        )}

        <div className="mt-auto flex items-center gap-2.5 rounded-lg bg-sidebar-active/50 p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-white">
            {initials(user?.firstName, user?.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-white">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="truncate text-[11px] text-sidebar-text">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            aria-label="Logga ut"
            className="shrink-0 rounded-md p-1.5 text-sidebar-text hover:bg-sidebar-active hover:text-white"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className="overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}