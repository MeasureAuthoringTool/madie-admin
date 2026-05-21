import React from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import { useFeatureFlags } from "@madie/madie-util";
import "./AdminLanding.scss";
import UserManagement from "./userManagement/UserManagement";

export default function AdminHomePage() {
  const featureFlags = useFeatureFlags();

  return featureFlags?.AdminUserList ? (
    <>
      <div id="admin-nav" style={{ marginTop: "-48px", marginLeft: "32px" }}>
        <Tabs value="user-management" type="A" size="standard">
          <Tab
            type="A"
            size="standard"
            value="user-management"
            label="User Management"
            data-testid="user-management-tab"
          />
        </Tabs>
      </div>

      <UserManagement />
    </>
  ) : (
    <></>
  );
}
