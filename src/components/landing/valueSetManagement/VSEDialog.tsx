import React, { useMemo } from "react";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import { DialogContent, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useFormik } from "formik";
import MonacoEditor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { ValueSetDisplayForAdmin } from "@madie/madie-util";

const REQUIRED_ASTERISK_COLOR = "rgb(174, 28, 28)";

loader.config({ monaco });

export interface ModalProps {
  open?: boolean;
  onClose: () => void;
  targetValueSet: ValueSetDisplayForAdmin | null;
  onSubmit: (valueSet: EditValueSetFormValues) => Promise<void>;
}

export interface EditValueSetFormValues {
  id: string;
  url: string;
  version: string;
  valueSet: string;
}

export default function VSEDialog(props: ModalProps) {
  const { open = false, onClose, targetValueSet, onSubmit } = props;

  const formattedJson = useMemo(() => {
    if (!targetValueSet?.valueSet) return "";
    try {
      return JSON.stringify(JSON.parse(targetValueSet.valueSet), null, 2);
    } catch {
      return targetValueSet.valueSet;
    }
  }, [targetValueSet]);

  const initialValues: EditValueSetFormValues = useMemo(
    () => ({
      id: targetValueSet?.id ?? "",
      url: targetValueSet?.url ?? "",
      version: targetValueSet?.version ?? "",
      valueSet: formattedJson,
    }),
    [formattedJson, targetValueSet]
  );

  const formik = useFormik<EditValueSetFormValues>({
    initialValues,
    enableReinitialize: true,
    validateOnMount: true,
    validate: (values) => {
      const errors: Partial<Record<keyof EditValueSetFormValues, string>> = {};

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
          id: values.id,
          url: values.url.trim(),
          version: values.version.trim(),
          valueSet: normalizedJson,
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formikErrorHandler = (name: keyof EditValueSetFormValues) => {
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
      title="Edit Valueset Data"
      dialogProps={{
        id: "edit-value-set-modal",
        onClose,
        open,
        onSubmit: formik.handleSubmit,
        maxWidth: "lg",
        fullWidth: true,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Discard Changes",
        "data-testid": "edit-value-set-discard-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        continueText: "Save",
        disabled: formik.isSubmitting || !formik.isValid,
        "data-testid": "edit-value-set-save-button",
      }}
    >
      <DialogContent>
        <Box sx={formRow}>
          <TextField
            {...formik.getFieldProps("url")}
            required
            label="URL"
            id="value-set-url"
            data-testid="edit-value-set-url-field"
            size="small"
            inputProps={{
              "data-testid": "edit-value-set-url-input",
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
            label="Valueset version"
            id="value-set-version"
            data-testid="edit-value-set-version-field"
            size="small"
            inputProps={{
              "data-testid": "edit-value-set-version-input",
              "aria-describedby": "value-set-version-helper-text",
            }}
          />
        </Box>

        <Box sx={formRow} style={{ flexDirection: "column" }}>
          <Typography
            component="label"
            htmlFor="edit-value-set-json-editor"
            style={{
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "Rubik",
              color: "#333",
            }}
          >
            <span style={{ color: REQUIRED_ASTERISK_COLOR, marginRight: 2 }}>
              *
            </span>
            Expansion
          </Typography>
          <div
            id="edit-value-set-json-editor"
            data-testid="edit-value-set-json-editor"
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
              data-testid="edit-value-set-json-error"
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
