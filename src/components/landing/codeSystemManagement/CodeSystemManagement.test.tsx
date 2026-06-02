import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import CodeSystemManagement from "./CodeSystemManagement";

describe("CodeSystemManagement", () => {
  it("renders the code system management container", () => {
    render(<CodeSystemManagement />);
    expect(screen.getByTestId("code-system-management")).toBeInTheDocument();
  });

  it("applies the code-system-management class to the container", () => {
    render(<CodeSystemManagement />);
    const container = screen.getByTestId("code-system-management");
    expect(container).toHaveClass("code-system-management");
  });

  it("renders the card wrapper", () => {
    const { container } = render(<CodeSystemManagement />);
    const card = container.querySelector(".code-system-management-card");
    expect(card).toBeInTheDocument();
  });
});
