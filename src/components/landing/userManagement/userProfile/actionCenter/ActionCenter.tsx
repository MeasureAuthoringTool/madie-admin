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
  onExport: (exportType: string) => void;
  onViewHumanReadable: () => void;
  onViewHistory: () => void;
  onCompareVersions: () => void;
  onShare: (option: string) => void;
  onTransfer: () => void;
  disabledReason?: string;
}

export default function ActionCenter({
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
  return (
    <div className="action-center" data-testid="action-center">
      <DeleteAction
        disabled={!canDelete}
        onClick={onDelete}
        disabledReason={disabledReason}
      />
      <ExportAction measures={measures} onClick={onExport} />
      {/* isOwner/isSharedWithUser are unused for admins — the icon short-circuits on isAdmin */}
      <ShareAction
        measures={measures}
        onClick={onShare}
        isOwner={false}
        isSharedWithUser={false}
        activeTab={activeTab}
      />
      <ViewHRAction measures={measures} onClick={onViewHumanReadable} />
      <HistoryAction measures={measures} onClick={onViewHistory} />
      <CompareVersionsAction measures={measures} onClick={onCompareVersions} />
      <TransferAction
        measures={measures}
        onClick={onTransfer}
        activeTab={activeTab}
      />
    </div>
  );
}
