import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import IndeterminateCheckbox from "./IndeterminateCheckbox";

describe("IndeterminateCheckbox", () => {
  it("sets the checkbox to indeterminate when indeterminate is true", () => {
    render(<IndeterminateCheckbox checked={false} indeterminate />);

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;

    expect(checkbox.indeterminate).toBe(true);
  });

  it("removes the indeterminate state when indeterminate changes to false", () => {
    const { rerender } = render(
      <IndeterminateCheckbox checked={false} indeterminate />
    );

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;

    expect(checkbox.indeterminate).toBe(true);

    rerender(<IndeterminateCheckbox checked={false} indeterminate={false} />);

    expect(checkbox.indeterminate).toBe(false);
  });
});
