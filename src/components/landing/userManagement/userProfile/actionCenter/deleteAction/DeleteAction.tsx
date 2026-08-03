import React from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

interface PropTypes {
  disabled: boolean;
  onClick: () => void;
  disabledReason?: string;
  deleteTarget?: string;
}

export default function DeleteAction({
  deleteTarget = "measure",
  disabled,
  onClick,
  disabledReason,
}: PropTypes) {
  const DELETE_TOOLTIP = `Delete ${deleteTarget}`;
  const NOTHING_SELECTED_TOOLTIP = `Select ${deleteTarget} to delete`;
  const tooltipMessage = disabled
    ? disabledReason ?? NOTHING_SELECTED_TOOLTIP
    : DELETE_TOOLTIP;
  return (
    <Tooltip
      data-testid="delete-action-tooltip"
      title={tooltipMessage}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            zIndex: 99,
            backgroundColor: "#333",
            "& .MuiTooltip-arrow": {
              color: "#333",
            },
          },
        },
      }}
    >
      <span>
        <IconButton
          onClick={onClick}
          disabled={disabled}
          data-testid="delete-action-btn"
          aria-label="Delete measure"
          className="DeleteClass"
        >
          <DeleteOutlinedIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
