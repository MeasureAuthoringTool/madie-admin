import React, { useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDocumentTitle, useUserRoles } from "@madie/madie-util";
import AdminHomePage from "./AdminHomePage";
import UserProfile from "./userManagement/userProfile/UserProfile";
import "./AdminRoutes.scss";

const NotFoundRedirect = () => {
  useLayoutEffect(() => {
    window.location.replace("/404");
  }, []);
  return null;
};

const AdminRoutes = () => {
  useDocumentTitle("MADiE Admin");
  const userRoles = useUserRoles();

  if (!userRoles?.isAdmin) {
    window.location.replace("/404");
  }

  return (
    <div data-testid="admin-routes">
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminHomePage />} />
          <Route path="/admin/userProfile/:harpId" element={<UserProfile />} />
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AdminRoutes;
