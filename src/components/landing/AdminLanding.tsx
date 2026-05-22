import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDocumentTitle, useUserRoles } from "@madie/madie-util";
import AdminHomePage from "./AdminHomePage";
import UserProfile from "./userManagement/userProfile/UserProfile";
import "./AdminLanding.scss";

const AdminLanding = () => {
  useDocumentTitle("MADiE Admin");
  const userRoles = useUserRoles();

  if (!userRoles?.isAdmin) {
    window.location.replace("/404");
  }

  return (
    <div data-testid="admin-landing">
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminHomePage />} />
          <Route path="/admin/userProfile" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AdminLanding;
