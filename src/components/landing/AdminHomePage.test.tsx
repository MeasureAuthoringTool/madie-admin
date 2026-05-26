import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import AdminHomePage from "./AdminHomePage";
import { useFeatureFlags } from "@madie/madie-util";

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn(),
}));

jest.mock("./userManagement/UserManagement", () => ({
  __esModule: true,
  default: () => <div data-testid="user-management">UserManagement</div>,
}));

describe("AdminHomePage", () => {
  test("renders nothing when AdminUserList flag is disabled", () => {
    (useFeatureFlags as jest.Mock).mockReturnValueOnce({
      AdminUserList: false,
    });

    const { container } = render(<AdminHomePage />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("user-management-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("user-management")).not.toBeInTheDocument();
  });

  test("renders nothing when featureFlags is undefined", () => {
    (useFeatureFlags as jest.Mock).mockReturnValueOnce(undefined);

    const { container } = render(<AdminHomePage />);

    expect(container).toBeEmptyDOMElement();
  });

  test("renders the User Management tab and UserManagement when flag is enabled", () => {
    (useFeatureFlags as jest.Mock).mockReturnValueOnce({
      AdminUserList: true,
    });

    render(<AdminHomePage />);

    expect(screen.getByTestId("user-management-tab")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByTestId("user-management")).toBeInTheDocument();
  });

  test("User Management tab is selected by default", () => {
    (useFeatureFlags as jest.Mock).mockReturnValueOnce({
      AdminUserList: true,
    });

    render(<AdminHomePage />);

    const tab = screen.getByTestId("user-management-tab");
    expect(tab).toHaveAttribute("aria-selected", "true");
  });
});
