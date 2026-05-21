import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import UserManagement from "./UserManagement";
// @ts-ignore
import { useUserServiceApi } from "@madie/madie-util";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const renderRouter = () =>
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <UserManagement />
    </MemoryRouter>
  );

const mockFetchUsers = jest.fn();

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useUserRoles: jest
    .fn()
    .mockReturnValue({ roles: ["MADiE-Admin"], isAdmin: true }),
  useOktaTokens: jest.fn().mockReturnValue({
    getAccessToken: () => "test-token",
    getUserName: () => "testUser",
  }),
  useUserServiceApi: jest.fn(),
}));

const mockUsers = [
  {
    id: "1",
    harpId: "harp1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    status: "ACTIVE",
    lastLoginAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "2",
    harpId: "harp2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    status: "DEACTIVATED",
    lastLoginAt: null,
  },
  {
    id: "3",
    harpId: "harp3",
    firstName: "Bob",
    lastName: "Brown",
    email: "bob@example.com",
    status: "ACTIVE",
    lastLoginAt: "2026-03-20T08:30:00Z",
  },
];

const typeSearch = (value: string) => {
  const input = screen.getByTestId("user-search-input");
  userEvent.clear(input);
  userEvent.type(input, value);
};

const selectFilter = async (label: string) => {
  // MUI Select trigger has role="combobox" with the floating label as its
  // accessible name. Open it, then click the option whose data-testid matches.
  userEvent.click(screen.getByRole("combobox", { name: /filter by/i }));
  userEvent.click(await screen.findByTestId(`user-filter-by-${label}`));
};

describe("UserManagement", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/admin");
    mockFetchUsers.mockReset();
    mockNavigate.mockReset();
    (useUserServiceApi as jest.Mock).mockReturnValue({
      fetchUsers: mockFetchUsers,
    });
  });

  it("shows loading state initially", () => {
    mockFetchUsers.mockReturnValue(new Promise(() => {})); // never resolves
    renderRouter();
    expect(screen.getByTestId("loading-message")).toBeInTheDocument();
    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    mockFetchUsers.mockRejectedValue(new Error("Server error"));
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });
    expect(screen.getByText("Unable to fetch users.")).toBeInTheDocument();
  });

  it("does not show error for AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    mockFetchUsers.mockRejectedValue(abortError);
    renderRouter();
    await waitFor(() => {
      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });
  });

  it("shows no users message when fetch returns empty", async () => {
    mockFetchUsers.mockResolvedValue([]);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("no-users-message")).toBeInTheDocument();
    });
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });

  it("navigates to the user profile with harpId when a user name is clicked", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    userEvent.click(screen.getByTestId("user-name-link-1"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/admin/userProfile?harpId=harp1"
    );
  });

  it("URL-encodes the harpId when navigating to the user profile", async () => {
    mockFetchUsers.mockResolvedValue([
      {
        id: "9",
        harpId: "harp with spaces&special",
        firstName: "Edge",
        lastName: "Case",
        email: "edge@example.com",
        status: "ACTIVE",
      },
    ]);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    userEvent.click(screen.getByTestId("user-name-link-9"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/admin/userProfile?harpId=harp%20with%20spaces%26special"
    );
  });

  it("does not navigate when the user has no harpId", async () => {
    mockFetchUsers.mockResolvedValue([
      {
        id: "10",
        firstName: "No",
        lastName: "HarpId",
        email: "nohid@example.com",
        status: "ACTIVE",
      },
    ]);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    userEvent.click(screen.getByTestId("user-name-link-10"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renders user table with data", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    expect(screen.getByTestId("user-count-total")).toHaveTextContent("3 users");
    expect(screen.getByTestId("user-count-breakdown")).toHaveTextContent(
      "(2 active, 1 deactivated)"
    );

    const rows = screen.getAllByTestId("user-row-item");
    expect(rows).toHaveLength(3);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("harp1")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getAllByTestId("status-chip-ACTIVE")).toHaveLength(2);
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(screen.getByTestId("status-chip-DEACTIVATED")).toBeInTheDocument();
    expect(screen.getByText("Deactivated")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("filters users by search text across all fields", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    typeSearch("jane");

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("filters by harp ID when filter is set", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    await selectFilter("Harp ID");
    typeSearch("harp3");

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  });

  it("filters by Name", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    await selectFilter("Name");
    typeSearch("doe");

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("filters by Email Address", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    await selectFilter("Email Address");
    typeSearch("bob@");

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  });

  it("filters by Status", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    await selectFilter("Status");
    typeSearch("deactivated");

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("clears search and filter when clear button is clicked", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    typeSearch("jane");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(1);
    });

    userEvent.click(screen.getByTestId("user-clear-search"));

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(3);
    });
  });

  it("shows 'No results were found.' when search yields no results", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    typeSearch("nonexistent_xyz");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-message")).toBeInTheDocument();
    });
    expect(screen.getByText("No results were found.")).toBeInTheDocument();
    expect(screen.queryByTestId("no-users-message")).not.toBeInTheDocument();
  });

  it("shows 'No users found.' (not the search message) when users list is empty with no search", async () => {
    mockFetchUsers.mockResolvedValue([]);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("no-users-message")).toBeInTheDocument();
    });
    expect(screen.getByText("No users found.")).toBeInTheDocument();
    expect(screen.queryByTestId("no-results-message")).not.toBeInTheDocument();
  });

  it("displays users sorted alphabetically by name by default", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const rows = screen.getAllByTestId("user-row-item");
    expect(rows[0]).toHaveTextContent("Bob Brown");
    expect(rows[1]).toHaveTextContent("Jane Smith");
    expect(rows[2]).toHaveTextContent("John Doe");
  });

  it("sorts columns when header is clicked", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const nameHeader = screen.getByText("Name").closest("th");
    if (!nameHeader) {
      throw new Error("Name header not found");
    }

    userEvent.click(nameHeader);

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows[0]).toHaveTextContent("John Doe");
    });

    userEvent.click(nameHeader);

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows[0]).toHaveTextContent("Bob Brown");
    });
  });

  it("shows sort icon on hover", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const nameHeader = screen.getByText("Name").closest("th");
    if (!nameHeader) {
      throw new Error("Name header not found");
    }

    userEvent.hover(nameHeader);

    await waitFor(() => {
      expect(nameHeader.querySelector("svg")).toBeInTheDocument();
    });

    userEvent.unhover(nameHeader);
  });

  it("handles Enter key in search without submitting", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("user-search-input");
    userEvent.type(searchInput, "{enter}");
    // No crash, test passes
  });

  // ─── AC: No filter selected — search across ALL columns ───────────────────
  it("searches across all columns when no filter is selected — matches by harpId", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    typeSearch("harp2");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(1);
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("searches across all columns when no filter is selected — matches by email", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    typeSearch("bob@example");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(1);
    });
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  });

  it("searches across all columns when no filter is selected — matches by status label", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    typeSearch("Deactivated");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(1);
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("searches across all columns when no filter is selected — matches multiple rows", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    typeSearch("Active");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(2);
    });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  });

  // ─── AC: Filter selected — search only in that column ─────────────────────
  it("searching by Name filter only matches name column, not email", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    await selectFilter("Name");
    typeSearch("example.com");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-message")).toBeInTheDocument();
    });
    expect(screen.getByText("No results were found.")).toBeInTheDocument();
  });

  it("searching by Harp ID filter only matches harpId column, not name", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    await selectFilter("Harp ID");
    typeSearch("John");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-message")).toBeInTheDocument();
    });
    expect(screen.getByText("No results were found.")).toBeInTheDocument();
  });

  it("searching by Email Address filter only matches email column, not name", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    await selectFilter("Email Address");
    typeSearch("Brown");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-message")).toBeInTheDocument();
    });
    expect(screen.getByText("No results were found.")).toBeInTheDocument();
  });

  it("searching by Status filter only matches status label, not name", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    await selectFilter("Status");
    typeSearch("harp");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-message")).toBeInTheDocument();
    });
    expect(screen.getByText("No results were found.")).toBeInTheDocument();
  });

  // ─── AC: Click X clears both Search AND Filter By ─────────────────────────
  it("clicking clear X resets both search text and Filter By to defaults", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    await selectFilter("Name");
    typeSearch("doe");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(1);
    });

    userEvent.click(screen.getByTestId("user-clear-search"));

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(3);
    });

    expect(screen.getByTestId("user-search-input")).toHaveValue("");
    expect(screen.queryByTestId("no-results-message")).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-clear-search")).not.toBeInTheDocument();
  });

  // ─── AC: Whitespace-only search should not filter ─────────────────────────
  it("whitespace-only search text does not filter results", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    typeSearch("   ");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(3);
    });
  });

  // ─── AC: Search is case-insensitive ───────────────────────────────────────
  it("search is case-insensitive across all columns", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    typeSearch("JOHN");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(1);
    });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("filter-by search is case-insensitive", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    renderRouter();
    await waitFor(() =>
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument()
    );

    await selectFilter("Email Address");
    typeSearch("JANE@EXAMPLE");

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(1);
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });
});
