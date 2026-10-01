import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExportSelectedUsersDialog from "./ExportSelectedUsersDialog";
import { type UserDetails } from "@madie/madie-models";

const selectedUsers: UserDetails[] = [
  {
    id: "1",
    harpId: "harp1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  },
  {
    id: "2",
    harpId: "harp2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
  },
];

const OPTION_KEYS = [
  "owned-measures",
  "shared-measures",
  "owned-libraries",
  "shared-libraries",
];

describe("ExportSelectedUsersDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ExportSelectedUsersDialog
        open={false}
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByText(/Export Selected Users/)).not.toBeInTheDocument();
  });

  it("renders the title with the number of selected users", () => {
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText("Export Selected Users (2)")).toBeInTheDocument();
  });

  it("lists each selected user as '<first> <last> (<harpId>)'", () => {
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByTestId("selected-user-1")).toHaveTextContent(
      "John Doe (harp1)"
    );
    expect(screen.getByTestId("selected-user-2")).toHaveTextContent(
      "Jane Smith (harp2)"
    );
  });

  it("renders every selected user even when there are more than five", () => {
    const manyUsers: UserDetails[] = Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      harpId: `harp${index}`,
      firstName: `First${index}`,
      lastName: `Last${index}`,
    }));
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={manyUsers}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByTestId("selected-users-list").children).toHaveLength(7);
    expect(screen.getByText("Export Selected Users (7)")).toBeInTheDocument();
  });

  it("falls back to the list index when a user has no id or harpId", () => {
    const users: UserDetails[] = [{ firstName: "Anon", lastName: "User" }];
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={users}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByTestId("selected-user-0")).toHaveTextContent(
      "Anon User ()"
    );
  });

  it("shows the four include-in-export options checked by default", () => {
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    OPTION_KEYS.forEach((key) => {
      expect(screen.getByTestId(`export-option-${key}-input`)).toBeChecked();
    });
  });

  it("unchecks an option when its checkbox is clicked", async () => {
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    const ownedMeasures = screen.getByTestId(
      "export-option-owned-measures-input"
    );
    await userEvent.click(ownedMeasures);
    expect(ownedMeasures).not.toBeChecked();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = jest.fn();
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={onClose}
      />
    );
    await userEvent.click(
      screen.getByTestId("export-selected-users-cancel-button")
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close icon is clicked", async () => {
    const onClose = jest.fn();
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={onClose}
      />
    );
    await userEvent.click(screen.getByTestId("close-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onExport with the selected harpIds and default options when Export is clicked", async () => {
    const onExport = jest.fn();
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
        onExport={onExport}
      />
    );
    await userEvent.click(
      screen.getByTestId("export-selected-users-export-button")
    );
    expect(onExport).toHaveBeenCalledWith({
      userIds: ["harp1", "harp2"],
      ownedMeasures: true,
      sharedMeasures: true,
      ownedLibraries: true,
      sharedLibraries: true,
    });
  });

  it("includes the chosen options in the export request", async () => {
    const onExport = jest.fn();
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
        onExport={onExport}
      />
    );
    await userEvent.click(
      screen.getByTestId("export-option-shared-measures-input")
    );
    await userEvent.click(
      screen.getByTestId("export-option-shared-libraries-input")
    );
    await userEvent.click(
      screen.getByTestId("export-selected-users-export-button")
    );
    expect(onExport).toHaveBeenCalledWith({
      userIds: ["harp1", "harp2"],
      ownedMeasures: true,
      sharedMeasures: false,
      ownedLibraries: true,
      sharedLibraries: false,
    });
  });

  it("omits users without a harpId from the export request", async () => {
    const onExport = jest.fn();
    const users: UserDetails[] = [
      { id: "1", harpId: "harp1", firstName: "John", lastName: "Doe" },
      { id: "3", firstName: "No", lastName: "Harp" },
    ];
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={users}
        onClose={jest.fn()}
        onExport={onExport}
      />
    );
    await userEvent.click(
      screen.getByTestId("export-selected-users-export-button")
    );
    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({ userIds: ["harp1"] })
    );
  });

  it("does not throw when Export is clicked without an onExport handler", async () => {
    render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    await userEvent.click(
      screen.getByTestId("export-selected-users-export-button")
    );
    expect(screen.getByText("Export Selected Users (2)")).toBeInTheDocument();
  });

  it("resets options to their defaults when reopened", async () => {
    const { rerender } = render(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    const ownedMeasures = screen.getByTestId(
      "export-option-owned-measures-input"
    );
    await userEvent.click(ownedMeasures);
    expect(ownedMeasures).not.toBeChecked();

    rerender(
      <ExportSelectedUsersDialog
        open={false}
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    rerender(
      <ExportSelectedUsersDialog
        open
        selectedUsers={selectedUsers}
        onClose={jest.fn()}
      />
    );
    expect(
      screen.getByTestId("export-option-owned-measures-input")
    ).toBeChecked();
  });
});
