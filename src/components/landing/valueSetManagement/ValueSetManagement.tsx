import React from "react";
import { Button } from "@madie/madie-design-system/dist/react";
import "./ValueSetManagement.scss";

export default function ValueSetManagement() {
  return (
    <div className="value-set-management" data-testid="value-set-management">
      <div className="value-set-management-card">
        <Button disabled={false} data-testid="update-vses-data-button">
          Update VSES Data
        </Button>
      </div>
    </div>
  );
}
