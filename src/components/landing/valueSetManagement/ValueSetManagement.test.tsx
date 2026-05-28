import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ValueSetManagement from "./ValueSetManagement";

describe("ValueSetManagement", () => {
  it("renders the value set management container", () => {
    render(<ValueSetManagement />);
    expect(screen.getByTestId("value-set-management")).toBeInTheDocument();
  });

  it("renders the Update VSES Data button", () => {
    render(<ValueSetManagement />);
    const button = screen.getByTestId("update-vses-data-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Update VSES Data");
  });

  it("renders the button in an enabled state", () => {
    render(<ValueSetManagement />);
    const button = screen.getByTestId("update-vses-data-button");
    expect(button).not.toBeDisabled();
  });

  it("renders the card wrapper containing the button", () => {
    const { container } = render(<ValueSetManagement />);
    const card = container.querySelector(".value-set-management-card");
    expect(card).toBeInTheDocument();
    expect(card).toContainElement(
      screen.getByTestId("update-vses-data-button")
    );
  });
});
