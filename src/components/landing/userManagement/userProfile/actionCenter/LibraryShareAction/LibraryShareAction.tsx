import React, { useCallback, useEffect, useState } from "react";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { CqlLibrary } from "@madie/madie-models";
import ShareIcon from "./ShareIcon";

interface PropTypes {
  libraries: CqlLibrary[];
  onClick: (option: string) => void;
  activeTab: number;
}

export const NOTHING_SELECTED = "Select a library to share/unshare";
export const VALID_SHARE_LIBRARY = "Share/Unshare";

export const SHARED_TAB_NOTHING_SELECTED = "Select a library to unshare";
export const SHARED_TAB_UNSHARE = "Unshare";

export enum SharedOptions {
  SHARE_WITH = "Share With",
  UNSHARE = "Unshare",
}

export default function AdminLibraryShareAction(props: PropTypes) {
  const { libraries, activeTab, onClick } = props;

  const [disableShareBtn, setDisableShareBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(
    activeTab === 3 ? SHARED_TAB_NOTHING_SELECTED : NOTHING_SELECTED
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isSharedLibraryTab = activeTab === 3;

  const options = isSharedLibraryTab
    ? [SharedOptions.UNSHARE]
    : [SharedOptions.SHARE_WITH, SharedOptions.UNSHARE];

  const validateShareActionState = useCallback(() => {
    const hasSelection = libraries?.length > 0;

    setDisableShareBtn(!hasSelection);

    if (!hasSelection) {
      setTooltipMessage(
        isSharedLibraryTab ? SHARED_TAB_NOTHING_SELECTED : NOTHING_SELECTED
      );
    } else {
      setTooltipMessage(VALID_SHARE_LIBRARY);
    }
  }, [libraries, isSharedLibraryTab]);

  useEffect(() => {
    validateShareActionState();
  }, [validateShareActionState]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setTooltipMessage(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (option: string) => {
    handleClose();
    onClick(option);
  };

  return (
    <Tooltip
      data-testid="share-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateShareActionState}
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
          onClick={handleClick}
          disabled={disableShareBtn}
          data-testid="share-action-btn"
        >
          <ShareIcon />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          data-testid="share-menu"
        >
          {options.map((option) => (
            <MenuItem
              key={option}
              data-testid={`${option}-option`}
              onClick={() => handleMenuItemClick(option)}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      </span>
    </Tooltip>
  );
}
