import React, { useEffect } from "react";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import { DialogContent, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useFormik } from "formik";
import MonacoEditor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

const REQUIRED_ASTERISK_COLOR = "rgb(174, 28, 28)";

loader.config({ monaco });

export interface AddValueSetFormValues {
  url: string;
  version: string;
  valueSet: string;
}

interface AddValueSetDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddValueSetFormValues) => Promise<void>;
}

const initialValues: AddValueSetFormValues = {
  url: "",
  version: "",
  valueSet: "",
};

export default function AddValueSetDialog({
  open,
  onClose,
  onSubmit,
}: AddValueSetDialogProps) {
  const formik = useFormik<AddValueSetFormValues>({
    initialValues,
    validateOnMount: true,
    validate: (values) => {
      const errors: Partial<Record<keyof AddValueSetFormValues, string>> = {};

      if (!values.url.trim()) {
        errors.url = "Value set URL is required.";
      }

      if (!values.valueSet.trim()) {
        errors.valueSet = "Value set expansion JSON is required.";
      } else {
        try {
          JSON.parse(values.valueSet);
        } catch {
          errors.valueSet = "Value set expansion JSON must be valid JSON.";
        }
      }

      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const normalizedJson = JSON.stringify(JSON.parse(values.valueSet));
        await onSubmit({
          url: values.url.trim(),
          version: values.version.trim(),
          valueSet: normalizedJson,
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { resetForm } = formik;

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const formikErrorHandler = (name: keyof AddValueSetFormValues) => {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
    return "";
  };

  const formRow = {
    display: "flex",
    flexDirection: "row",
    marginTop: "12px",
  };

  return (
    <MadieDialog
      form
      title="Add New Valueset Data"
      dialogProps={{
        id: "add-value-set-modal",
        onClose,
        open,
        onSubmit: formik.handleSubmit,
        maxWidth: "lg",
        fullWidth: true,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "add-value-set-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        continueText: "Add Value Set",
        disabled: formik.isSubmitting || !formik.isValid,
        "data-testid": "add-value-set-submit-button",
      }}
    >
      <DialogContent>
        <Box sx={formRow}>
          <TextField
            {...formik.getFieldProps("url")}
            required
            label="URL"
            id="value-set-url"
            data-testid="add-value-set-url-field"
            size="small"
            inputProps={{
              "data-testid": "add-value-set-url-input",
              "aria-describedby": "value-set-url-helper-text",
              required: true,
              "aria-required": true,
            }}
            error={formik.touched.url && Boolean(formik.errors.url)}
            helperText={formikErrorHandler("url")}
          />
        </Box>

        <Box sx={formRow}>
          <TextField
            {...formik.getFieldProps("version")}
            label="Version"
            id="value-set-version"
            data-testid="add-value-set-version-field"
            size="small"
            inputProps={{
              "data-testid": "add-value-set-version-input",
              "aria-describedby": "value-set-version-helper-text",
            }}
            helperText="If this should be the latest version, leave blank"
          />
        </Box>

        <Box sx={formRow} style={{ flexDirection: "column" }}>
          <Typography
            component="label"
            htmlFor="add-value-set-json-editor"
            style={{
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "Rubik",
              color: "#333",
            }}
          >
            {" "}
            <span style={{ color: REQUIRED_ASTERISK_COLOR, marginRight: 2 }}>
              *
            </span>
            Expansion
          </Typography>
          <div
            id="add-value-set-json-editor"
            data-testid="add-value-set-json-editor"
            style={{ border: "1px solid #8c8f94", marginTop: "8px" }}
          >
            <MonacoEditor
              height="350px"
              defaultLanguage="json"
              theme="vs-dark"
              value={formik.values.valueSet}
              onChange={(value) => {
                formik.setFieldValue("valueSet", value ?? "");
              }}
              onMount={(editor) => {
                editor.onDidBlurEditorText(() => {
                  formik.setFieldTouched("valueSet", true);
                });
                editor.onDidPaste(() => {
                  const currentValue = editor.getValue();
                  try {
                    JSON.parse(currentValue);
                  } catch {
                    return;
                  }
                  setTimeout(() => {
                    editor.getAction("editor.action.formatDocument")?.run();
                  }, 0);
                });
              }}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </div>
          {formik.touched.valueSet && formik.errors.valueSet && (
            <div
              data-testid="add-value-set-json-error"
              style={{
                color: REQUIRED_ASTERISK_COLOR,
                fontSize: 14,
                fontFamily: "Rubik",
                marginTop: "8px",
              }}
            >
              {formik.errors.valueSet}
            </div>
          )}
        </Box>
      </DialogContent>
    </MadieDialog>
  );
}
