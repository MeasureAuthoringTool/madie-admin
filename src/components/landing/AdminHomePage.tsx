import React, { useState } from "react";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import "./AdminRoutes.scss";
import UserManagement from "./userManagement/UserManagement";
import CodeSystemManagement from "./codeSystemManagement/CodeSystemManagement";
import ValueSetManagement from "./valueSetManagement/ValueSetManagement";

export default function AdminHomePage() {
  const [activeTab, setActiveTab] = useState("user-management");

  return (
    <>
      <div id="admin-nav" style={{ marginTop: "-48px", marginLeft: "32px" }}>
        <Tabs
          value={activeTab}
          onChange={(_e: React.SyntheticEvent, value: string) => {
            setActiveTab(value);
          }}
          type="A"
          size="standard"
        >
          <Tab
            type="A"
            size="standard"
            value="user-management"
            label="User Management"
            data-testid="user-management-tab"
          />
          <Tab
            type="A"
            size="standard"
            value="code-system-management"
            label="Code System Management"
            data-testid="code-system-management-tab"
          />
          <Tab
            type="A"
            size="standard"
            value="value-set-management"
            label="Value Set Management"
            data-testid="value-set-management-tab"
          />
        </Tabs>
      </div>

      {activeTab === "user-management" && <UserManagement />}
      {activeTab === "code-system-management" && <CodeSystemManagement />}
      {activeTab === "value-set-management" && <ValueSetManagement />}
    </>
  );
}
