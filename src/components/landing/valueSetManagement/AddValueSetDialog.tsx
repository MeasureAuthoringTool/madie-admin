import React, { useEffect } from "react";
import { MadieDialog, TextField } from "@madie/madie-design-system/dist/react";
import { DialogContent } from "@mui/material";
import { useFormik } from "formik";
import Editor, { loader } from "@monaco-editor/react";

const webpackPublicPath =
  typeof __webpack_public_path__ !== "undefined"
    ? __webpack_public_path__
    : "/";

loader.config({
  paths: {
    vs: `${webpackPublicPath}vs`,
  },
});

let monacoInitPromise: Promise<unknown> | null = null;

const ensureMonacoLoaderInitialized = () => {
  if (monacoInitPromise) {
    return monacoInitPromise;
  }

  const globalWindow = window as Window & {
    define?: ((...args: unknown[]) => unknown) & { amd?: unknown };
    require?: unknown;
  };

  const hasForeignAmdDefine =
    typeof globalWindow.require === "undefined" &&
    typeof globalWindow.define === "function" &&
    Boolean(globalWindow.define.amd);

  const previousDefine = hasForeignAmdDefine ? globalWindow.define : undefined;

  if (hasForeignAmdDefine) {
    // Let Monaco bootstrap its own AMD loader when another loader defined only `define`.
    delete globalWindow.define;
  }

  monacoInitPromise = loader.init().finally(() => {
    if (previousDefine && typeof globalWindow.define === "undefined") {
      globalWindow.define = previousDefine;
    }
  });

  return monacoInitPromise;
};

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
  useEffect(() => {
    if (open) {
      ensureMonacoLoaderInitialized().catch(() => {
        // Keep UI responsive; loader errors surface through the editor itself.
      });
    }
  }, [open]);

  const formik = useFormik<AddValueSetFormValues>({
    initialValues,
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

  return (
    <MadieDialog
      form
      title="New Value Set"
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
        disabled: formik.isSubmitting,
        "data-testid": "add-value-set-submit-button",
      }}
    >
      <DialogContent>
        <TextField
          {...formik.getFieldProps("url")}
          required
          label="URL"
          id="value-set-url"
          data-testid="add-value-set-url-field"
          inputProps={{
            "data-testid": "add-value-set-url-input",
          }}
          error={formik.touched.url && Boolean(formik.errors.url)}
          helperText={formik.touched.url ? formik.errors.url : ""}
        />

        <div style={{ marginTop: "16px" }}>
          <TextField
            {...formik.getFieldProps("version")}
            label="Version (Optional)"
            id="value-set-version"
            data-testid="add-value-set-version-field"
            inputProps={{
              "data-testid": "add-value-set-version-input",
            }}
            helperText="If this should be the latest version, leave blank"
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <label htmlFor="add-value-set-json-editor">Expansion JSON*</label>
          <div
            id="add-value-set-json-editor"
            data-testid="add-value-set-json-editor"
            style={{ border: "1px solid #8c8f94", marginTop: "8px" }}
          >
            <Editor
              height="350px"
              defaultLanguage="json"
              value={formik.values.valueSet}
              onChange={(value) => {
                formik.setFieldValue("valueSet", value ?? "");
              }}
              onMount={(editor) => {
                editor.onDidBlurEditorText(() => {
                  formik.setFieldTouched("valueSet", true);
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
              style={{ color: "#d92f2f", marginTop: "8px" }}
            >
              {formik.errors.valueSet}
            </div>
          )}
        </div>
      </DialogContent>
    </MadieDialog>
  );
}
