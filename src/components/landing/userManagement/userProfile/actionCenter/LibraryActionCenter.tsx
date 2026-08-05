import React from "react";
import { CqlLibrary } from "@madie/madie-models";

import DeleteAction from "./deleteAction/DeleteAction";
import AdminLibraryShareAction from "./LibraryShareAction/LibraryShareAction";

interface PropTypes {
  libraries: CqlLibrary[];
  canDelete: boolean;
  activeTab: number;
  onDelete: () => void;
  onShare?: (option: string) => void;
  disabledReason?: string;
  target?: string;
}

export default function LibraryActionCenter({
  target = "library",
  libraries,
  canDelete,
  activeTab,
  onDelete,
  onShare,
  disabledReason,
}: PropTypes) {
  return (
    <div className="action-center" data-testid="action-center">
      <AdminLibraryShareAction
        libraries={libraries}
        onClick={onShare}
        activeTab={activeTab}
      />
      <DeleteAction
        deleteTarget={target}
        disabled={!canDelete}
        onClick={onDelete}
        disabledReason={disabledReason}
      />
    </div>
  );
}
