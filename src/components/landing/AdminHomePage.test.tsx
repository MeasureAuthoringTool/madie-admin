import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminHomePage from "./AdminHomePage";

jest.mock("./userManagement/UserManagement", () => ({
  __esModule: true,
  default: () => <div data-testid="user-management">UserManagement</div>,
}));

jest.mock("./codeSystemManagement/CodeSystemManagement", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="code-system-management">CodeSystemManagement</div>
  ),
}));

jest.mock("./valueSetManagement/ValueSetManagement", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="value-set-management">ValueSetManagement</div>
  ),
}));

describe("AdminHomePage", () => {
  test("renders the User Management tab and UserManagement", () => {
    render(<AdminHomePage />);

    expect(screen.getByTestId("user-management-tab")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByTestId("user-management")).toBeInTheDocument();
  });

  test("User Management tab is selected by default", () => {
    render(<AdminHomePage />);

    const tab = screen.getByTestId("user-management-tab");
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  test("renders Code System Management and Value Set Management tabs", () => {
    render(<AdminHomePage />);

    expect(
      screen.getByTestId("code-system-management-tab")
    ).toBeInTheDocument();
    expect(screen.getByText("Code System Management")).toBeInTheDocument();
    expect(screen.getByTestId("value-set-management-tab")).toBeInTheDocument();
    expect(screen.getByText("Value Set Management")).toBeInTheDocument();
  });

  test("renders CodeSystemManagement component when Code System Management tab is clicked", () => {
    render(<AdminHomePage />);

    expect(screen.getByTestId("user-management")).toBeInTheDocument();
    expect(
      screen.queryByTestId("code-system-management")
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByTestId("code-system-management-tab"));

    expect(screen.getByTestId("code-system-management")).toBeInTheDocument();
    expect(screen.queryByTestId("user-management")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("value-set-management")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("code-system-management-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("renders ValueSetManagement component when Value Set Management tab is clicked", () => {
    render(<AdminHomePage />);

    expect(screen.getByTestId("user-management")).toBeInTheDocument();
    expect(
      screen.queryByTestId("value-set-management")
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByTestId("value-set-management-tab"));

    expect(screen.getByTestId("value-set-management")).toBeInTheDocument();
    expect(screen.queryByTestId("user-management")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("code-system-management")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("value-set-management-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("switches back to User Management when its tab is clicked", () => {
    render(<AdminHomePage />);

    userEvent.click(screen.getByTestId("code-system-management-tab"));
    expect(screen.getByTestId("code-system-management")).toBeInTheDocument();

    userEvent.click(screen.getByTestId("user-management-tab"));

    expect(screen.getByTestId("user-management")).toBeInTheDocument();
    expect(
      screen.queryByTestId("code-system-management")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("user-management-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
