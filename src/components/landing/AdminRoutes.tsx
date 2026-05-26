import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDocumentTitle, useUserRoles } from "@madie/madie-util";
import AdminHomePage from "./AdminHomePage";
import UserProfile from "./userManagement/userProfile/UserProfile";
import "./AdminRoutes.scss";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const userRoles = useUserRoles();
  if (!userRoles?.isAdmin) {
    return <Navigate to="/404" replace />;
  }
  return <>{children}</>;
};

const AdminRoutes = () => {
  useDocumentTitle("MADiE Admin");

  return (
    <div data-testid="admin-routes">
      <BrowserRouter>
        <AdminGuard>
          <Routes>
            <Route path="/admin" element={<AdminHomePage />} />
            <Route
              path="/admin/userProfile/:harpId"
              element={<UserProfile />}
            />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AdminGuard>
      </BrowserRouter>
    </div>
  );
};

export default AdminRoutes;
