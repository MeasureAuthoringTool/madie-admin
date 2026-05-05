import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import AdminLanding from "./AdminLanding";
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

describe("AdminLanding Component", () => {
  test("renders the User Management tab for admin users", async () => {
    render(<AdminLanding />);

    expect(screen.getByTestId("admin-landing")).toBeInTheDocument();
    expect(screen.getByTestId("user-management-tab")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("user-management")).toBeInTheDocument();
    });
  });

  test("User Management tab is selected by default", () => {
    render(<AdminLanding />);

    const tab = screen.getByTestId("user-management-tab");
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  test("renders nothing for non-admin users", () => {
    (useUserRoles as jest.Mock).mockReturnValueOnce({
      roles: [],
      isAdmin: false,
    });

    const { container } = render(<AdminLanding />);

    expect(container).toBeEmptyDOMElement();
  });
});
