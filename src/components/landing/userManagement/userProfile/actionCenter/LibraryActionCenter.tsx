import React from "react";
import type { CqlLibrary } from "@madie/madie-models";

import DeleteAction from "./deleteAction/DeleteAction";
import PipeSeparator from "./PipeSeparator";
import {
  LibraryShareAction,
  LibraryHistoryAction,
  LibraryCompareVersionsAction,
} from "@madie/madie-util";

interface PropTypes {
  libraries: CqlLibrary[];
  canDelete: boolean;
  activeTab: number;
  onDelete: () => void;
  onShare: (option: string) => void;
  onViewHistory?: () => void;
  onCompareVersions?: () => void;
  disabledReason?: string;
  target?: string;
  userName: string;
}

export default function LibraryActionCenter({
  target = "library",
  libraries,
  canDelete,
  activeTab,
  onDelete,
  onShare,
  onViewHistory,
  onCompareVersions,
  disabledReason,
  userName,
}: PropTypes) {
  return (
    <div className="action-center" data-testid="action-center">
      <LibraryShareAction
        libraries={libraries}
        onClick={onShare}
        canEdit={true}
        userName={userName}
        owners={libraries.map((library) => library.librarySet?.owner)}
        // doesn't matter
        isSharedWithUser={false}
        activeTab={activeTab}
      />
      <DeleteAction
        deleteTarget={target}
        disabled={!canDelete}
        onClick={onDelete}
        disabledReason={disabledReason}
      />

      {(onViewHistory ?? onCompareVersions) && <PipeSeparator />}

      {onViewHistory && (
        <LibraryHistoryAction libraries={libraries} onClick={onViewHistory} />
      )}
      {onCompareVersions && (
        <LibraryCompareVersionsAction
          libraries={libraries}
          onClick={onCompareVersions}
        />
      )}
    </div>
  );
}
