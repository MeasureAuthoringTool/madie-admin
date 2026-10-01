import React, { useEffect, useState } from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import { type UserDetails } from "@madie/madie-models";
// @ts-ignore - types provided by the local madie-util declaration shim
import { type UserExportRequest } from "@madie/madie-util";
import "./ExportSelectedUsersDialog.scss";

interface ExportSelectedUsersDialogProps {
  open: boolean;
  selectedUsers: UserDetails[];
  onClose: () => void;
  // Wiring the actual export is out of scope for this story; the callback is
  // optional so a future story can perform the export with the chosen options.
  onExport?: (exportRequest: UserExportRequest) => void;
}

interface ExportOptionsState {
  ownedMeasures: boolean;
  sharedMeasures: boolean;
  ownedLibraries: boolean;
  sharedLibraries: boolean;
}

const DEFAULT_EXPORT_OPTIONS: ExportOptionsState = {
  ownedMeasures: true,
  sharedMeasures: true,
  ownedLibraries: true,
  sharedLibraries: true,
};

const EXPORT_OPTION_FIELDS: {
  key: keyof ExportOptionsState;
  label: string;
  testId: string;
}[] = [
  {
    key: "ownedMeasures",
    label: "Owned Measures",
    testId: "export-option-owned-measures",
  },
  {
    key: "sharedMeasures",
    label: "Shared Measures",
    testId: "export-option-shared-measures",
  },
  {
    key: "ownedLibraries",
    label: "Owned Libraries",
    testId: "export-option-owned-libraries",
  },
  {
    key: "sharedLibraries",
    label: "Shared Libraries",
    testId: "export-option-shared-libraries",
  },
];

const formatUser = (user: UserDetails): string => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return `${fullName} (${user.harpId ?? ""})`;
};

const ExportSelectedUsersDialog = ({
  open,
  selectedUsers,
  onClose,
  onExport,
}: ExportSelectedUsersDialogProps) => {
  const [options, setOptions] = useState<ExportOptionsState>(
    DEFAULT_EXPORT_OPTIONS
  );

  // Reset the checkboxes to their defaults each time the dialog is opened.
  useEffect(() => {
    if (open) {
      setOptions(DEFAULT_EXPORT_OPTIONS);
    }
  }, [open]);

  const handleToggle =
    (key: keyof ExportOptionsState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOptions((prev) => ({ ...prev, [key]: event.target.checked }));
    };

  const handleExport = () => {
    const userIds = selectedUsers
      .map((user) => user.harpId)
      .filter((harpId): harpId is string => Boolean(harpId));

    onExport?.({ userIds, ...options });
  };

  return (
    <MadieDialog
      form
      title={`Export Selected Users (${selectedUsers.length})`}
      dialogProps={{
        id: "export-selected-users-dialog",
        "data-testid": "export-selected-users-dialog",
        open,
        onClose,
        onSubmit: handleExport,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "export-selected-users-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        continueText: "Export",
        "data-testid": "export-selected-users-export-button",
      }}
    >
      <Box className="export-selected-users">
        <Typography
          className="section-label"
          data-testid="selected-users-label"
        >
          Selected users:
        </Typography>
        <Box
          component="ul"
          className="selected-users-list"
          data-testid="selected-users-list"
        >
          {selectedUsers.map((user, index) => (
            <Box
              component="li"
              key={user.id ?? user.harpId ?? index}
              className="selected-user"
              data-testid={`selected-user-${user.id ?? user.harpId ?? index}`}
            >
              {formatUser(user)}
            </Box>
          ))}
        </Box>

        <Typography
          className="section-label"
          data-testid="include-in-export-label"
        >
          Include in export:
        </Typography>
        <FormGroup>
          {EXPORT_OPTION_FIELDS.map(({ key, label, testId }) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  name={key}
                  checked={options[key]}
                  onChange={handleToggle(key)}
                  data-testid={testId}
                  slotProps={{
                    input: {
                      "data-testid": `${testId}-input`,
                    } as React.InputHTMLAttributes<HTMLInputElement>,
                  }}
                />
              }
              label={label}
            />
          ))}
        </FormGroup>
      </Box>
    </MadieDialog>
  );
};

export type { ExportSelectedUsersDialogProps };
export default ExportSelectedUsersDialog;
