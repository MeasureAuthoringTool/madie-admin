import React from "react";
import { Measure } from "@madie/madie-models";
import {
  ExportAction,
  ViewHRAction,
  HistoryAction,
  CompareVersionsAction,
  ShareAction,
  TransferAction,
} from "@madie/madie-util";
import DeleteAction from "./deleteAction/DeleteAction";

interface PropTypes {
  measures: Measure[];
  canDelete: boolean;
  activeTab: number;
  onDelete: () => void;
  onTransfer?: () => void;
  onExport?: (exportType: string) => void;
  onViewHumanReadable?: () => void;
  onViewHistory?: () => void;
  onCompareVersions?: () => void;
  onShare?: (option: string) => void;
  disabledReason?: string;
  target?: string;
}

export default function ActionCenter({
  target = "measure", //lets reuse the action center component for libraries or measures.
  measures,
  canDelete,
  activeTab,
  onDelete,
  onExport,
  onViewHumanReadable,
  onViewHistory,
  onCompareVersions,
  onShare,
  onTransfer,
  disabledReason,
}: PropTypes) {
  const PipeSeparator = () => (
    <span
      aria-hidden="true"
      style={{ color: "#8C8C8C", display: "inline-flex", alignItems: "center" }}
    >
      |
    </span>
  );

  return (
    <div className="action-center" data-testid="action-center">
      <DeleteAction
        deleteTarget={target}
        disabled={!canDelete}
        onClick={onDelete}
        disabledReason={disabledReason}
      />
      {onExport && <ExportAction measures={measures} onClick={onExport} />}
      {/* isOwner/isSharedWithUser are unused for admins — the icon short-circuits on isAdmin */}
      {onShare && (
        <ShareAction
          measures={measures}
          onClick={onShare}
          isOwner={false}
          isSharedWithUser={false}
          activeTab={activeTab}
        />
      )}
      {onTransfer && (
        <TransferAction
          measures={measures}
          onClick={onTransfer}
          activeTab={activeTab}
        />
      )}

      {(onViewHumanReadable ?? onViewHistory ?? onCompareVersions) && (
        <PipeSeparator />
      )}

      {onViewHumanReadable && (
        <ViewHRAction measures={measures} onClick={onViewHumanReadable} />
      )}
      {onViewHistory && (
        <HistoryAction measures={measures} onClick={onViewHistory} />
      )}
      {onCompareVersions && (
        <CompareVersionsAction
          measures={measures}
          onClick={onCompareVersions}
        />
      )}
    </div>
  );
}
