import React from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import {
  useDocumentTitle,
  useUserRoles,
  // @ts-ignore
  useFeatureFlags,
} from "@madie/madie-util";
import UserManagement from "./userManagement/UserManagement";
import "./AdminLanding.scss";

const AdminLanding = () => {
  useDocumentTitle("MADiE Admin");
  const userRoles = useUserRoles();
  const featureFlags = useFeatureFlags();

  if (!userRoles?.isAdmin) {
    return null;
  }

  return (
    <div data-testid="admin-landing">
      <div id="admin-nav" style={{ marginTop: "-48px", marginLeft: "32px" }}>
        <Tabs value="user-management" type="A" size="standard">
          {featureFlags?.AdminUserList && (
            <Tab
              type="A"
              size="standard"
              value="user-management"
              label="User Management"
              data-testid="user-management-tab"
            />
          )}
        </Tabs>
      </div>

      {featureFlags?.AdminUserList && <UserManagement />}
    </div>
  );
};

export default AdminLanding;
