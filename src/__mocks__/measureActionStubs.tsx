import * as React from "react";

// Stubs for the shared action-center icons that live in @madie/madie-util
// (their real behavior is unit-tested there). Spread into a test's inline
// `jest.mock("@madie/madie-util", ...)` factory as `mockMeasureActionStubs`.
export const ExportAction = ({ onClick }: any) => (
  <div>
    <button data-testid="export-action-btn">Export</button>
    <button
      data-testid="export-option"
      onClick={() => onClick && onClick("Export")}
    >
      Export
    </button>
    <button
      data-testid="export-publishing-option"
      onClick={() => onClick && onClick("Export for Publishing")}
    >
      Export for Publishing
    </button>
  </div>
);
export const ViewHRAction = ({ onClick }: any) => (
  <button data-testid="view-hr-action-btn" onClick={onClick}>
    View HR Action
  </button>
);
export const HistoryAction = ({ onClick }: any) => (
  <button data-testid="history-action-btn" onClick={onClick}>
    History Action
  </button>
);
export const CompareVersionsAction = ({ onClick }: any) => (
  <button data-testid="compare-versions-action-btn" onClick={onClick}>
    Compare Versions Action
  </button>
);
export const ShareAction = ({ measures, activeTab, onClick }: any) => {
  const options = activeTab === 1 ? ["Unshare"] : ["Share With", "Unshare"];
  return (
    <div>
      <button data-testid="share-action-btn" disabled={!measures?.length}>
        Share
      </button>
      {options.map((option: string) => (
        <button
          key={option}
          data-testid={`share-option-${option
            .replace(/\s+/g, "-")
            .toLowerCase()}`}
          onClick={() => onClick && onClick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
export const TransferAction = ({ measures, onClick }: any) => (
  <button
    data-testid="transfer-action-btn"
    disabled={!measures?.length}
    onClick={() => onClick && onClick()}
  >
    Transfer
  </button>
);
