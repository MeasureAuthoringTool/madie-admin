// VSEDialog.test.tsx

import React from "react";
import { render, screen } from "@testing-library/react";
import VSEDialog, { ModalProps, ReadOnlyJsonEditor } from "./VSEDialog";

jest.mock("react-ace", () => {
  return function MockAceEditor(props: ModalProps) {
    return <div data-testid="ace-editor">{props.value}</div>;
  };
});

jest.mock("@madie/madie-design-system/dist/react", () => ({
  MadieDialog: ({ title, children, dialogProps }: unknown) => (
    <div data-testid="madie-dialog" data-open={dialogProps.open}>
      <div>{title}</div>
      {children}
    </div>
  ),
}));

describe("ReadOnlyJsonEditor", () => {
  it("renders the editor with supplied value", () => {
    render(<ReadOnlyJsonEditor value="test value" height="500px" />);

    expect(screen.getByTestId("ace-editor")).toBeInTheDocument();
    expect(screen.getByText("test value")).toBeInTheDocument();
  });
});

describe("VSEDialog", () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
  };

  it("renders the dialog when open", () => {
    render(<VSEDialog {...defaultProps} targetVSE='{"name":"test"}' />);

    expect(screen.getByTestId("madie-dialog")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("formats valid json before passing to AceEditor", () => {
    render(<VSEDialog {...defaultProps} targetVSE='{"name":"test"}' />);

    expect(screen.getByText(/"name": "test"/)).toBeInTheDocument();
  });

  it("falls back to original string when json is invalid", () => {
    render(<VSEDialog {...defaultProps} targetVSE="not-json" />);

    expect(screen.getByText("not-json")).toBeInTheDocument();
  });

  it("handles null targetVSE", () => {
    render(<VSEDialog {...defaultProps} targetVSE={null} />);

    expect(screen.getByTestId("madie-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("ace-editor")).toBeInTheDocument();
  });

  it("passes open=false to the dialog", () => {
    render(<VSEDialog open={false} onClose={jest.fn()} targetVSE={null} />);

    expect(screen.getByTestId("madie-dialog")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  it("uses the default open value when none ", () => {
    render(<VSEDialog onClose={jest.fn()} targetVSE={null} />);

    expect(screen.getByTestId("madie-dialog")).toHaveAttribute(
      "data-open",
      "false"
    );
  });
});
