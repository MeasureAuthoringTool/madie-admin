import React from "react";
import { type Measure } from "@madie/madie-models";
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
  onTransfer: () => void;
  onExport: (exportType: string) => void;
  onViewHumanReadable: () => void;
  onViewHistory: () => void;
  onCompareVersions: () => void;
  onShare: (option: string) => void;
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
  return (
    <div className="action-center" data-testid="action-center">
      <DeleteAction
        deleteTarget={target}
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
