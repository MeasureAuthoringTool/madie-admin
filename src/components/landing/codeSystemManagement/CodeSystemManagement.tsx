import React, { useState } from "react";
import { Button, Toast } from "@madie/madie-design-system/dist/react";
import "./CodeSystemManagement.scss";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";
export default function CodeSystemManagement() {
  const terminologyServiceApi = useTerminologyServiceApi();
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastType, setToastType] = useState<string>("success");
  const [toastMessage, setToastMessage] = useState<string>("");

  const handleUpdateCodeSystems = async () => {
    try {
      await terminologyServiceApi.triggerUpdateCodeSystems();
      setToastType("success");
      setToastMessage("Update Code Systems job has been started");
      setToastOpen(true);
    } catch (err: any) {
      setToastType("danger");
      setToastMessage(err.message);
      setToastOpen(true);
    }
  };
  const onToastClose = () => {
    setToastOpen(false);
  };

  return (
    <div
      className="code-system-management"
      data-testid="code-system-management"
    >
      <div
        className="code-system-management-card"
        data-testid="code-system-management-card"
      >
        <Button
          data-testid="update-code-systems-button"
          onClick={handleUpdateCodeSystems}
        >
          Update Code Systems
        </Button>
        <div>
          <p>
            This is a synchronous job that should only be used in specific
            scenarios where we cannot wait for the job to run that evening. This
            could potentially effect the users as it is running and it will take
            5-10 min to run. Please continue to have a nice day!
          </p>
        </div>
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
