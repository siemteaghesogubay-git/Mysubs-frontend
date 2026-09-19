import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "./routes/ProtectedRoute";
import { Layout } from "./components/layout/layout";

import { Login } from "./pages/Login/Login";
import { Register } from "./pages/Register/Register";
import { ForgotPassword } from "./pages/ForgotPassword/ForgotPassword";
import { ResetPassword } from "./pages/ForgotPassword/ResetPassword";

import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Subscriptions } from "./pages/Subscriptions/Subscriptions";
import { Categories } from "./pages/Categories/Categories";
import { Family } from "./pages/Family/Family";
import { Profile } from "./pages/Profile/Profile";
import { AdminUsers } from "./pages/AdminUsers/AdminUsers";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Publika sidor */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Kräver inloggning */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />

              <Route
                path="subscriptions"
                element={<Subscriptions />}
              />

              {/* Tillfälligt: betalningsöversikten finns på dashboarden */}
              <Route
                path="upcoming"
                element={<Navigate to="/" replace />}
              />

              <Route path="categories" element={<Categories />} />
              <Route path="family" element={<Family />} />
              <Route path="profile" element={<Profile />} />

              {/* Kräver adminbehörighet */}
              <Route element={<AdminRoute />}>
                <Route path="admin/users" element={<AdminUsers />} />
              </Route>
            </Route>
          </Route>

          {/* Okända adresser */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}