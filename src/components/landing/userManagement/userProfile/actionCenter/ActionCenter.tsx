import React from "react";
import DeleteAction from "./deleteAction/DeleteAction";

interface PropTypes {
  canDelete: boolean;
  onDelete: () => void;
}

export default function ActionCenter({ canDelete, onDelete }: PropTypes) {
  return (
    <div className="action-center" data-testid="action-center">
      <DeleteAction disabled={!canDelete} onClick={onDelete} />
    </div>
  );
}
