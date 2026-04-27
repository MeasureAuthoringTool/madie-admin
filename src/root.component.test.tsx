import * as React from "react";
import { render, screen } from "@testing-library/react";
import Root from "./root.component";

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useUserRoles: jest
    .fn()
    .mockReturnValue({ roles: ["MADiE-Admin"], isAdmin: true }),
}));

describe("Root component", () => {
  it("should render AdminLanding", () => {
    render(<Root name="Testapp" />);
    expect(screen.getByTestId("admin-landing")).toBeInTheDocument();
  });
});
