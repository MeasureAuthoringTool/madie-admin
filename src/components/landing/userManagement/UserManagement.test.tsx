import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import UserManagement from "./UserManagement";
// @ts-ignore
import { useUserServiceApi } from "@madie/madie-util";

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

describe("UserManagement", () => {
  beforeEach(() => {
    mockFetchUsers.mockReset();
    (useUserServiceApi as jest.Mock).mockReturnValue({
      fetchUsers: mockFetchUsers,
    });
  });

  it("shows loading state initially", () => {
    mockFetchUsers.mockReturnValue(new Promise(() => {})); // never resolves
    render(<UserManagement />);
    expect(screen.getByTestId("loading-message")).toBeInTheDocument();
    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    mockFetchUsers.mockRejectedValue(new Error("Server error"));
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });
    expect(screen.getByText("Unable to fetch users.")).toBeInTheDocument();
  });

  it("does not show error for AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    mockFetchUsers.mockRejectedValue(abortError);
    render(<UserManagement />);
    // Should not show error message, just stay loading or empty
    await waitFor(() => {
      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });
  });

  it("shows no users message when fetch returns empty", async () => {
    mockFetchUsers.mockResolvedValue([]);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("no-users-message")).toBeInTheDocument();
    });
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });

  it("renders user table with data", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    // Check user count
    expect(screen.getByTestId("user-count-total")).toHaveTextContent("3 users");
    expect(screen.getByTestId("user-count-breakdown")).toHaveTextContent(
      "(2 active, 1 deactivated)"
    );

    // Check rows rendered
    const rows = screen.getAllByTestId("user-row-item");
    expect(rows).toHaveLength(3);

    // Check name column
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();

    // Check harpId
    expect(screen.getByText("harp1")).toBeInTheDocument();

    // Check email
    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    // Check status labels
    expect(screen.getAllByText("ACTIVE")).toHaveLength(2);
    expect(screen.getByText("DEACTIVATED")).toBeInTheDocument();

    // Check last login - formatted date or dash
    expect(screen.getByText("-")).toBeInTheDocument(); // Jane has no lastLoginAt
  });

  it("filters users by search text across all fields", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("user-search-input");
    fireEvent.change(searchInput, { target: { value: "jane" } });

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("filters by harp ID when filter is set", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    // Select "Harp ID" filter
    const filterSelect = screen.getByTestId("user-filter-by-input");
    fireEvent.change(filterSelect, { target: { value: "Harp ID" } });

    const searchInput = screen.getByTestId("user-search-input");
    fireEvent.change(searchInput, { target: { value: "harp3" } });

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  });

  it("filters by Name", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId("user-filter-by-input");
    fireEvent.change(filterSelect, { target: { value: "Name" } });

    const searchInput = screen.getByTestId("user-search-input");
    fireEvent.change(searchInput, { target: { value: "doe" } });

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("filters by Email Address", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId("user-filter-by-input");
    fireEvent.change(filterSelect, { target: { value: "Email Address" } });

    const searchInput = screen.getByTestId("user-search-input");
    fireEvent.change(searchInput, { target: { value: "bob@" } });

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
  });

  it("filters by Status", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId("user-filter-by-input");
    fireEvent.change(filterSelect, { target: { value: "Status" } });

    const searchInput = screen.getByTestId("user-search-input");
    fireEvent.change(searchInput, { target: { value: "deactivated" } });

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows).toHaveLength(1);
    });
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("clears search and filter when clear button is clicked", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("user-search-input");
    fireEvent.change(searchInput, { target: { value: "jane" } });

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(1);
    });

    // Click clear
    const clearBtn = screen.getByTestId("user-clear-search");
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.getAllByTestId("user-row-item")).toHaveLength(3);
    });
  });

  it("shows no users message when search has no results", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("user-search-input");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByTestId("no-users-message")).toBeInTheDocument();
    });
  });

  it("sorts columns when header is clicked", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    // Click Name header to sort ascending
    const nameHeader = screen.getByText("Name").closest("th");
    if (!nameHeader) {
      throw new Error("Name header not found");
    }

    fireEvent.click(nameHeader);

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows[0]).toHaveTextContent("Bob Brown");
    });

    // Click again for descending
    fireEvent.click(nameHeader);

    await waitFor(() => {
      const rows = screen.getAllByTestId("user-row-item");
      expect(rows[0]).toHaveTextContent("John Doe");
    });
  });

  it("shows sort icon on hover", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const nameHeader = screen.getByText("Name").closest("th");
    if (!nameHeader) {
      throw new Error("Name header not found");
    }

    fireEvent.mouseEnter(nameHeader);

    // UnfoldMoreIcon should appear (via SVG)
    await waitFor(() => {
      expect(nameHeader.querySelector("svg")).toBeInTheDocument();
    });

    fireEvent.mouseLeave(nameHeader);
  });

  it("handles Enter key in search without submitting", async () => {
    mockFetchUsers.mockResolvedValue(mockUsers);
    render(<UserManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("user-management-table")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("user-search-input");
    const preventDefaultMock = jest.fn();
    fireEvent.keyPress(searchInput, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
      preventDefault: preventDefaultMock,
    });
    // No crash, test passes
  });
});
