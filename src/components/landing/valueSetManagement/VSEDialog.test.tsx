import * as React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VSEDialog from "./VSEDialog";

const mockEditorApi: {
  value: string;
  pasteHandler?: () => void;
  blurHandler?: () => void;
  formatRun: jest.Mock;
} = {
  value: "",
  formatRun: jest.fn(),
};

jest.mock("monaco-editor", () => ({}), { virtual: true });

jest.mock("@monaco-editor/react", () => {
  const React = require("react");
  return {
    __esModule: true,
    loader: { config: jest.fn() },
    default: function MockMonacoEditor(props: {
      value: string;
      onChange?: (value: string) => void;
      onMount?: (editor: unknown) => void;
    }) {
      mockEditorApi.value = props.value;

      React.useEffect(() => {
        const editor = {
          getValue: () => mockEditorApi.value,
          getAction: () => ({ run: mockEditorApi.formatRun }),
          onDidPaste: (cb: () => void) => {
            mockEditorApi.pasteHandler = cb;
          },
          onDidBlurEditorText: (cb: () => void) => {
            mockEditorApi.blurHandler = cb;
          },
        };
        props.onMount?.(editor);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <textarea
          data-testid="mock-monaco-editor"
          value={props.value}
          onChange={(event) => props.onChange?.(event.target.value)}
        />
      );
    },
  };
});

jest.mock("@madie/madie-design-system/dist/react", () => {
  const React = require("react");
  return {
    MadieDialog: ({
      title,
      children,
      dialogProps,
      continueButtonProps,
      cancelButtonProps,
    }: any) => (
      <div data-testid="madie-dialog" data-open={dialogProps.open}>
        <div>{title}</div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            dialogProps.onSubmit?.(event);
          }}
        >
          {children}
          <button
            type="button"
            data-testid={cancelButtonProps?.["data-testid"]}
            onClick={() => dialogProps.onClose?.()}
          >
            {cancelButtonProps?.cancelText ?? "Cancel"}
          </button>
          <button
            type={continueButtonProps?.type ?? "button"}
            data-testid={continueButtonProps?.["data-testid"]}
            disabled={continueButtonProps?.disabled}
          >
            {continueButtonProps?.continueText ?? "Save"}
          </button>
        </form>
      </div>
    ),
    TextField: ({ inputProps = {}, helperText, ...props }: any) => (
      <div>
        <input {...props} {...inputProps} />
        {helperText ? <span>{helperText}</span> : null}
      </div>
    ),
  };
});

describe("VSEDialog", () => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();

  const selectedValueSet = {
    id: "vs-1",
    url: "http://example.com/vs",
    version: "1.0",
    lastUpdated: "2025-01-01T00:00:00Z",
    manuallyModified: true,
    valueSet: '{"name":"test"}',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEditorApi.value = "";
    mockEditorApi.pasteHandler = undefined;
    mockEditorApi.blurHandler = undefined;
    onSubmit.mockResolvedValue(undefined);
  });

  const renderDialog = (overrides = {}) =>
    render(
      <VSEDialog
        open={true}
        onClose={onClose}
        onSubmit={onSubmit}
        targetValueSet={selectedValueSet}
        {...overrides}
      />
    );

  it("renders edit dialog fields with pre-populated values", async () => {
    renderDialog();

    expect(screen.getByText("Edit Valueset Data")).toBeInTheDocument();
    expect(screen.getByTestId("edit-value-set-url-input")).toHaveValue(
      "http://example.com/vs"
    );
    expect(screen.getByTestId("edit-value-set-version-input")).toHaveValue(
      "1.0"
    );
    await waitFor(() => {
      expect(screen.getByTestId("mock-monaco-editor")).toHaveValue(
        '{\n  "name": "test"\n}'
      );
    });
  });

  it("allows an empty version", () => {
    renderDialog({
      targetValueSet: {
        ...selectedValueSet,
        version: undefined,
      },
    });

    expect(screen.getByTestId("edit-value-set-version-input")).toHaveValue("");
  });

  it("shows JSON validation errors after Monaco blur", async () => {
    renderDialog();

    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: "not valid json" },
    });
    mockEditorApi.blurHandler?.();

    await waitFor(() => {
      expect(screen.getByTestId("edit-value-set-json-error")).toHaveTextContent(
        "Value set expansion JSON must be valid JSON."
      );
    });
  });

  it("submits trimmed values and minified JSON", async () => {
    renderDialog();

    fireEvent.change(screen.getByTestId("edit-value-set-url-input"), {
      target: { value: "  http://example.com/updated-vs  " },
    });
    fireEvent.change(screen.getByTestId("edit-value-set-version-input"), {
      target: { value: "  2.0  " },
    });
    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: '{\n  "resourceType": "ValueSet"\n}' },
    });

    userEvent.click(screen.getByTestId("edit-value-set-save-button"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        id: "vs-1",
        url: "http://example.com/updated-vs",
        version: "2.0",
        valueSet: '{"resourceType":"ValueSet"}',
      });
    });
  });

  it("calls onClose when discard is clicked", () => {
    renderDialog();

    userEvent.click(screen.getByTestId("edit-value-set-discard-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("passes open=false to the dialog", () => {
    render(
      <VSEDialog
        open={false}
        onClose={onClose}
        onSubmit={onSubmit}
        targetValueSet={selectedValueSet}
      />
    );

    expect(screen.getByTestId("madie-dialog")).toHaveAttribute(
      "data-open",
      "false"
    );
  });
});
