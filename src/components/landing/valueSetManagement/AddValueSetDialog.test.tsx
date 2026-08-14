import * as React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddValueSetDialog from "./AddValueSetDialog";

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
      // Keep the shared handle in sync with the current editor content.
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

describe("AddValueSetDialog", () => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockEditorApi.value = "";
    mockEditorApi.pasteHandler = undefined;
    mockEditorApi.blurHandler = undefined;
    onSubmit.mockResolvedValue(undefined);
  });

  const renderDialog = (open = true) =>
    render(
      <AddValueSetDialog open={open} onClose={onClose} onSubmit={onSubmit} />
    );

  it("renders the dialog fields when open", () => {
    renderDialog();

    expect(screen.getByText("Add New Valueset Data")).toBeInTheDocument();
    expect(screen.getByTestId("add-value-set-url-input")).toBeInTheDocument();
    expect(
      screen.getByTestId("add-value-set-version-input")
    ).toBeInTheDocument();
    expect(screen.getByTestId("mock-monaco-editor")).toBeInTheDocument();
  });

  it("disables the submit button while the form is invalid", async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.getByTestId("add-value-set-submit-button")).toBeDisabled();
    });
  });

  it("enables the submit button once required fields are valid", async () => {
    renderDialog();

    userEvent.type(
      screen.getByTestId("add-value-set-url-input"),
      "http://example.com/vs"
    );
    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: '{"resourceType":"ValueSet"}' },
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("add-value-set-submit-button")
      ).not.toBeDisabled();
    });
  });

  it("shows a required error for the URL field once touched", async () => {
    renderDialog();

    const urlInput = screen.getByTestId("add-value-set-url-input");
    fireEvent.focus(urlInput);
    fireEvent.blur(urlInput);

    await waitFor(() => {
      expect(
        screen.getByText("Value set URL is required.")
      ).toBeInTheDocument();
    });
  });

  it("shows an invalid JSON error when the expansion is not valid JSON", async () => {
    renderDialog();

    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: "not valid json" },
    });
    // Monaco reports "touched" via its blur callback, not a DOM blur event.
    mockEditorApi.blurHandler?.();

    await waitFor(() => {
      expect(screen.getByTestId("add-value-set-json-error")).toHaveTextContent(
        "Value set expansion JSON must be valid JSON."
      );
    });
  });

  it("submits trimmed values and minified JSON", async () => {
    renderDialog();

    userEvent.type(
      screen.getByTestId("add-value-set-url-input"),
      "http://example.com/vs"
    );
    userEvent.type(screen.getByTestId("add-value-set-version-input"), "1.0");
    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: '{\n  "resourceType": "ValueSet"\n}' },
    });

    userEvent.click(screen.getByTestId("add-value-set-submit-button"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        url: "http://example.com/vs",
        version: "1.0",
        valueSet: '{"resourceType":"ValueSet"}',
      });
    });
  });

  it("formats pasted JSON when the content is valid", async () => {
    renderDialog();

    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: '{"resourceType":"ValueSet"}' },
    });

    // Simulate Monaco firing its paste event.
    mockEditorApi.pasteHandler?.();

    await waitFor(() => {
      expect(mockEditorApi.formatRun).toHaveBeenCalled();
    });
  });

  it("does not format pasted content when it is invalid JSON", async () => {
    renderDialog();

    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: "not json" },
    });

    mockEditorApi.pasteHandler?.();

    // Give the deferred format action a chance to (not) run.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockEditorApi.formatRun).not.toHaveBeenCalled();
  });

  it("resets the form when the dialog is closed and reopened", async () => {
    const { rerender } = renderDialog(true);

    userEvent.type(
      screen.getByTestId("add-value-set-url-input"),
      "http://example.com/vs"
    );
    expect(screen.getByTestId("add-value-set-url-input")).toHaveValue(
      "http://example.com/vs"
    );

    rerender(
      <AddValueSetDialog open={false} onClose={onClose} onSubmit={onSubmit} />
    );
    rerender(
      <AddValueSetDialog open={true} onClose={onClose} onSubmit={onSubmit} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("add-value-set-url-input")).toHaveValue("");
    });
  });
});
