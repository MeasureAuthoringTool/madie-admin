import React from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

interface PropTypes {
  disabled: boolean;
  onClick: () => void;
}

export const DELETE_MEASURE = "Delete measure";
export const NOTHING_SELECTED = "Select measure to delete";

export default function DeleteAction({ disabled, onClick }: PropTypes) {
  const tooltipMessage = disabled ? NOTHING_SELECTED : DELETE_MEASURE;
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
