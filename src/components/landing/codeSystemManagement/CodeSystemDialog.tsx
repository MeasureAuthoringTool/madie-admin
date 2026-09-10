import React from "react";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useFormik } from "formik";

interface NewCodeSystemFormData {
  title: string;
  name: string;
  fhirVersion: string;
  vsacVersion: string;
  fullUrl: string;
  oid: string;
  isLatestVersion: boolean;
}

interface CodeSystemDialogProps {
  open: boolean;
  initialCodeSystemData: NewCodeSystemFormData;
  onClose: () => void;
  onSave: (formData: NewCodeSystemFormData) => Promise<void>;
  title?: string;
  saveButtonText?: string;
}

const CodeSystemDialog = ({
  open,
  initialCodeSystemData: initialFormData,
  onClose,
  onSave,
  title = "Add New Codesystem Data",
  saveButtonText = "Save",
}: CodeSystemDialogProps) => {
  const formik = useFormik<NewCodeSystemFormData>({
    initialValues: initialFormData,
    enableReinitialize: true,
    validateOnMount: true,
    validate: (values) => {
      const errors: Partial<Record<keyof NewCodeSystemFormData, string>> = {};

      if (!values.name.trim()) {
        errors.name = "Name is required.";
      }
      if (!values.fhirVersion.trim()) {
        errors.fhirVersion = "FHIR Version is required.";
      }
      if (!values.fullUrl.trim()) {
        errors.fullUrl = "Full URL is required.";
      }
      if (!values.oid.trim()) {
        errors.oid =
          "OID is required. Enter NOT.IN.VSAC if the Code System is not in VSAC.";
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSave(values);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formRowSx = {
    marginTop: "16px",
  };

  return (
    <MadieDialog
      form
      title={title}
      dialogProps={{
        id: "add-code-system-dialog",
        open,
        onClose,
        onSubmit: formik.handleSubmit,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "add-code-system-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        continueText: saveButtonText,
        "data-testid": "add-code-system-save-button",
        disabled:
          formik.isSubmitting ||
          !formik.dirty ||
          !formik.values.name.trim() ||
          !formik.values.fhirVersion.trim() ||
          !formik.values.fullUrl.trim() ||
          !formik.values.oid.trim(),
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
          {...formik.getFieldProps("name")}
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
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          {...formik.getFieldProps("title")}
          label="Title (Human Readable)"
          id="add-code-system-title"
          data-testid="add-code-system-title"
          inputProps={{
            "data-testid": "add-code-system-title-input",
          }}
          placeholder="Enter Title"
          size="small"
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          {...formik.getFieldProps("fhirVersion")}
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
          error={
            formik.touched.fhirVersion && Boolean(formik.errors.fhirVersion)
          }
          helperText={formik.touched.fhirVersion && formik.errors.fhirVersion}
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          {...formik.getFieldProps("vsacVersion")}
          label="VSAC Version"
          id="add-code-system-vsac-version"
          data-testid="add-code-system-vsac-version"
          inputProps={{
            "data-testid": "add-code-system-vsac-version-input",
          }}
          placeholder="Enter VSAC Version"
          size="small"
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          {...formik.getFieldProps("fullUrl")}
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
          error={formik.touched.fullUrl && Boolean(formik.errors.fullUrl)}
          helperText={formik.touched.fullUrl && formik.errors.fullUrl}
        />
      </Box>

      <Box sx={formRowSx}>
        <TextField
          {...formik.getFieldProps("oid")}
          required
          label="OID (If not in VSAC, enter NOT.IN.VSAC)"
          id="add-code-system-oid"
          data-testid="add-code-system-oid"
          inputProps={{
            "data-testid": "add-code-system-oid-input",
            "aria-required": true,
          }}
          placeholder="Enter OID"
          size="small"
          error={formik.touched.oid && Boolean(formik.errors.oid)}
          helperText={formik.touched.oid && formik.errors.oid}
        />
      </Box>

      <Box sx={formRowSx}>
        <FormControlLabel
          control={
            <Checkbox
              data-testid="add-code-system-latest-checkbox"
              id="add-code-system-latest-checkbox"
              name="isLatestVersion"
              checked={formik.values.isLatestVersion}
              onChange={(e) => {
                formik.setFieldValue("isLatestVersion", e.target.checked);
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
export default CodeSystemDialog;
