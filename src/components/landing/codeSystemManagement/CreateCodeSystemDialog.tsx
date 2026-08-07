import React from "react";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";

interface NewCodeSystemFormData {
  title: string;
  name: string;
  fhirVersion: string;
  vsacVersion: string;
  fullUrl: string;
  oid: string;
  isLatestVersion: boolean;
}

interface CreateCodeSystemDialogProps {
  open: boolean;
  formData: NewCodeSystemFormData;
  onClose: () => void;
  onSave: (formData: NewCodeSystemFormData) => Promise<void>;
  onFieldChange: (
    field: keyof NewCodeSystemFormData,
    value: string | boolean
  ) => void;
}

const CreateCodeSystemDialog = ({
  open,
  formData,
  onClose,
  onSave,
  onFieldChange,
}: CreateCodeSystemDialogProps) => {
  const isSaveDisabled =
    !formData.name.trim() ||
    !formData.fhirVersion.trim() ||
    !formData.fullUrl.trim() ||
    !formData.oid.trim();

  const formRowSx = {
    marginTop: "16px",
  };

  return (
    <MadieDialog
      form
      title="Add New Codesystem Data"
      dialogProps={{
        id: "add-code-system-dialog",
        open,
        onClose,
        onSubmit: (event) => {
          event.preventDefault();
          onSave(formData);
        },
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "add-code-system-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        continueText: "Save",
        "data-testid": "add-code-system-save-button",
        disabled: isSaveDisabled,
      }}
    >
      <div
        style={{
          marginTop: 5,
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <Typography
          style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
        >
          <span
            style={{
              color: "rgb(174, 28, 28)",
              marginRight: 3,
              fontWeight: 400,
            }}
          >
            *
          </span>
          Indicates required field
        </Typography>
      </div>

      <Box sx={formRowSx}>
        <TextField
          required
          label="Name (Machine Readable)"
          id="add-code-system-name"
          data-testid="add-code-system-name"
          inputProps={{
            "data-testid": "add-code-system-name-input",
            "aria-required": true,
          }}
          placeholder="Enter Name"
          size="small"
          value={formData.name}
          onChange={(e) => {
            onFieldChange("name", e.target.value);
          }}
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          label="Title (Human Readable)"
          id="add-code-system-title"
          data-testid="add-code-system-title"
          inputProps={{
            "data-testid": "add-code-system-title-input",
          }}
          placeholder="Enter Title"
          size="small"
          value={formData.title}
          onChange={(e) => {
            onFieldChange("title", e.target.value);
          }}
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          required
          label="FHIR Version"
          id="add-code-system-fhir-version"
          data-testid="add-code-system-fhir-version"
          inputProps={{
            "data-testid": "add-code-system-fhir-version-input",
            "aria-required": true,
          }}
          placeholder="Enter FHIR Version"
          size="small"
          value={formData.fhirVersion}
          onChange={(e) => {
            onFieldChange("fhirVersion", e.target.value);
          }}
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          label="VSAC Version"
          id="add-code-system-vsac-version"
          data-testid="add-code-system-vsac-version"
          inputProps={{
            "data-testid": "add-code-system-vsac-version-input",
          }}
          placeholder="Enter VSAC Version"
          size="small"
          value={formData.vsacVersion}
          onChange={(e) => {
            onFieldChange("vsacVersion", e.target.value);
          }}
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          required
          label="Full URL"
          id="add-code-system-full-url"
          data-testid="add-code-system-full-url"
          inputProps={{
            "data-testid": "add-code-system-full-url-input",
            "aria-required": true,
          }}
          placeholder="Enter Full URL"
          size="small"
          value={formData.fullUrl}
          onChange={(e) => {
            onFieldChange("fullUrl", e.target.value);
          }}
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          required
          label="OID"
          id="add-code-system-oid"
          data-testid="add-code-system-oid"
          inputProps={{
            "data-testid": "add-code-system-oid-input",
            "aria-required": true,
          }}
          placeholder="Enter OID"
          size="small"
          value={formData.oid}
          onChange={(e) => {
            onFieldChange("oid", e.target.value);
          }}
        />
      </Box>

      <Box sx={formRowSx}>
        <FormControlLabel
          control={
            <Checkbox
              data-testid="add-code-system-latest-checkbox"
              id="add-code-system-latest-checkbox"
              name="isLatestVersion"
              checked={formData.isLatestVersion}
              onChange={(e) => {
                onFieldChange("isLatestVersion", e.target.checked);
              }}
              slotProps={{
                input: {
                  "aria-label": "Add new Code System",
                },
              }}
            />
          }
          label="Latest?"
        />
      </Box>
    </MadieDialog>
  );
};

export type { NewCodeSystemFormData };
export default CreateCodeSystemDialog;
