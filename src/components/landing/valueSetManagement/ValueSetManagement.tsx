import React, { useState } from "react";
import { Button, Toast } from "@madie/madie-design-system/dist/react";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";
import "./ValueSetManagement.scss";

export default function ValueSetManagement() {
  const terminologyServiceApi = useTerminologyServiceApi();
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastType, setToastType] = useState<string>("success");
  const [toastMessage, setToastMessage] = useState<string>("");

  const handleUpdateValueSets = async () => {
    setToastOpen(false);
    try {
      await terminologyServiceApi.updateValueSets();
      setToastType("success");
      setToastMessage("VSES update has started");
      setToastOpen(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while updating VSES.";
      setToastType("danger");
      setToastMessage(errorMessage);
      setToastOpen(true);
    }
  };

  const onToastClose = () => {
    setToastOpen(false);
  };

  return (
    <div className="value-set-management" data-testid="value-set-management">
      <div className="value-set-management-card">
        <Button
          data-testid="update-vses-data-button"
          onClick={handleUpdateValueSets}
        >
          Update VSES Data
        </Button>
      </div>
      <Toast
        toastKey="value-set-management-toast"
        aria-live="polite"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "update-vses-error-message"
            : "update-vses-success-message"
        }
        closeButtonProps={{
          "data-testid": "close-toast-button",
        }}
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
    </div>
  );
}
