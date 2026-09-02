import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import AdminRoutes from "./AdminRoutes";
import { useUserRoles } from "@madie/madie-util";

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useUserRoles: jest
    .fn()
    .mockReturnValue({ roles: ["MADiE-Admin"], isAdmin: true }),
  useOktaTokens: jest.fn().mockReturnValue({
    getAccessToken: () => "test-token",
    getUserName: () => "testUser",
  }),
  useUserServiceApi: jest.fn().mockReturnValue({
    fetchUsers: jest.fn().mockResolvedValue([]),
  }),
}));

describe("AdminRoutes Component", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/admin");
  });
  test("renders the User Management tab for admin users", async () => {
    render(<AdminRoutes />);

    expect(screen.getByTestId("admin-routes")).toBeInTheDocument();
    expect(screen.getByTestId("user-management-tab")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("user-management")).toBeInTheDocument();
    });
  });

  test("User Management tab is selected by default", () => {
    render(<AdminRoutes />);

    const tab = screen.getByTestId("user-management-tab");
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  test("redirects non-admin users to /404", () => {
    (useUserRoles as jest.Mock).mockReturnValueOnce({
      roles: [],
      isAdmin: false,
    });

    render(<AdminRoutes />);

    expect(window.location.pathname).toBe("/404");
    expect(screen.queryByTestId("user-management-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-management")).not.toBeInTheDocument();
  });
});
