import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ActionCenter from "./ActionCenter";

jest.mock("@madie/madie-util", () => ({
  ExportAction: (props: any) => (
    <button
      data-testid="export-action"
      onClick={() => props.onClick?.("Export")}
    >
      Export
    </button>
  ),
  ViewHRAction: (props: any) => (
    <button data-testid="view-hr-action" onClick={() => props.onClick?.()}>
      View HR
    </button>
  ),
  HistoryAction: (props: any) => (
    <button data-testid="history-action" onClick={() => props.onClick?.()}>
      History
    </button>
  ),
  CompareVersionsAction: (props: any) => (
    <button data-testid="compare-action" onClick={() => props.onClick?.()}>
      Compare
    </button>
  ),
  ShareAction: (props: any) => (
    <button
      data-testid="share-action"
      onClick={() => props.onClick?.("Share With")}
    >
      Share
    </button>
  ),
  TransferAction: (props: any) => (
    <button data-testid="transfer-action" onClick={() => props.onClick?.()}>
      Transfer
    </button>
  ),
}));

jest.mock("./deleteAction/DeleteAction", () => (props: any) => (
  <button
    data-testid="delete-action"
    data-disabled={String(props.disabled)}
    data-target={props.deleteTarget}
  >
    Delete
  </button>
));

const baseProps = {
  measures: [],
  canDelete: true,
  activeTab: 0,
  onDelete: jest.fn(),
  onTransfer: jest.fn(),
  onExport: jest.fn(),
  onViewHumanReadable: jest.fn(),
  onViewHistory: jest.fn(),
  onCompareVersions: jest.fn(),
  onShare: jest.fn(),
  disabledReason: undefined,
};

describe("ActionCenter", () => {
  it("renders grouped admin actions and separator", () => {
    render(<ActionCenter {...baseProps} />);

    expect(screen.getByTestId("delete-action")).toHaveAttribute(
      "data-target",
      "measure"
    );
    expect(screen.getByTestId("delete-action")).toHaveAttribute(
      "data-disabled",
      "false"
    );
    expect(screen.getByTestId("export-action")).toBeInTheDocument();
    expect(screen.getByTestId("share-action")).toBeInTheDocument();
    expect(screen.getByTestId("transfer-action")).toBeInTheDocument();
    expect(screen.getByTestId("view-hr-action")).toBeInTheDocument();
    expect(screen.getByTestId("history-action")).toBeInTheDocument();
    expect(screen.getByTestId("compare-action")).toBeInTheDocument();
    expect(screen.getByText("|")).toBeInTheDocument();
  });

  it("omits optional actions and separator when handlers are missing", () => {
    render(
      <ActionCenter
        {...baseProps}
        canDelete={false}
        onShare={undefined as any}
        onTransfer={undefined as any}
        onViewHumanReadable={undefined as any}
        onViewHistory={undefined as any}
        onCompareVersions={undefined as any}
      />
    );

    expect(screen.getByTestId("delete-action")).toHaveAttribute(
      "data-disabled",
      "true"
    );
    expect(screen.getByTestId("export-action")).toBeInTheDocument();
    expect(screen.queryByTestId("share-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transfer-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("view-hr-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("history-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("compare-action")).not.toBeInTheDocument();
    expect(screen.queryByText("|")).not.toBeInTheDocument();
  });
});
