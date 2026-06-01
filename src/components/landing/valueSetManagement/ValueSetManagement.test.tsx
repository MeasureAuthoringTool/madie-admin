import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValueSetManagement from "./ValueSetManagement";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";

jest.mock("../../../api/useTerminologyServiceApi");

const mockUpdateValueSets = jest.fn();

describe("ValueSetManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTerminologyServiceApi as jest.Mock).mockReturnValue({
      updateValueSets: mockUpdateValueSets,
    });
  });

  it("renders the value set management container", () => {
    render(<ValueSetManagement />);
    expect(screen.getByTestId("value-set-management")).toBeInTheDocument();
  });

  it("applies the value-set-management class to the container", () => {
    render(<ValueSetManagement />);
    expect(screen.getByTestId("value-set-management")).toHaveClass(
      "value-set-management"
    );
  });

  it("renders the card wrapper", () => {
    const { container } = render(<ValueSetManagement />);
    expect(
      container.querySelector(".value-set-management-card")
    ).toBeInTheDocument();
  });

  it("renders the update button with the default label", () => {
    render(<ValueSetManagement />);
    const button = screen.getByTestId("update-vses-data-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Update VSES Data");
  });

  it("shows the success toast after a successful update", async () => {
    mockUpdateValueSets.mockResolvedValueOnce(undefined);

    render(<ValueSetManagement />);
    userEvent.click(screen.getByTestId("update-vses-data-button"));

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-success-message")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("VSES update has started")).toBeInTheDocument();
    expect(mockUpdateValueSets).toHaveBeenCalledTimes(1);
  });

  it("shows the error toast with the Error message when the update throws an Error", async () => {
    mockUpdateValueSets.mockRejectedValueOnce(new Error("Service is down"));

    render(<ValueSetManagement />);
    userEvent.click(screen.getByTestId("update-vses-data-button"));

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-error-message")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Service is down")).toBeInTheDocument();
  });

  it("falls back to the generic error message when the thrown value is not an Error", async () => {
    mockUpdateValueSets.mockRejectedValueOnce("unexpected string failure");

    render(<ValueSetManagement />);
    userEvent.click(screen.getByTestId("update-vses-data-button"));

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-error-message")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("An error occurred while updating VSES.")
    ).toBeInTheDocument();
  });

  it("closes the success toast when the close button is clicked", async () => {
    mockUpdateValueSets.mockResolvedValueOnce(undefined);

    render(<ValueSetManagement />);
    userEvent.click(screen.getByTestId("update-vses-data-button"));

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-success-message")
      ).toBeInTheDocument();
    });

    userEvent.click(screen.getByTestId("close-toast-button"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("update-vses-success-message")
      ).not.toBeInTheDocument();
    });
  });

  it("hides any prior toast as soon as a new update is triggered", async () => {
    mockUpdateValueSets.mockRejectedValueOnce(new Error("first failure"));

    render(<ValueSetManagement />);
    const button = screen.getByTestId("update-vses-data-button");
    userEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-error-message")
      ).toBeInTheDocument();
    });

    let resolveSecond: () => void = () => {};
    mockUpdateValueSets.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSecond = resolve;
      })
    );

    userEvent.click(button);

    await waitFor(() => {
      expect(
        screen.queryByTestId("update-vses-error-message")
      ).not.toBeInTheDocument();
    });

    resolveSecond();

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-success-message")
      ).toBeInTheDocument();
    });
  });
});
