import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CodeSystemManagement from "./CodeSystemManagement";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";

jest.mock("../../../api/useTerminologyServiceApi");

describe("CodeSystemManagement", () => {
  const mockTrigger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useTerminologyServiceApi as jest.Mock).mockReturnValue({
      triggerUpdateCodeSystems: mockTrigger,
    });
  });

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

  it("renders the update button", () => {
    render(<CodeSystemManagement />);
    expect(
      screen.getByTestId("update-code-systems-button")
    ).toBeInTheDocument();
  });

  it("calls API and shows success toast when update succeeds", async () => {
    mockTrigger.mockResolvedValueOnce({});

    render(<CodeSystemManagement />);

    fireEvent.click(screen.getByTestId("update-code-systems-button"));

    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalled();
    });

    expect(
      screen.getByText("Update Code Systems job has been started")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("update-vses-success-message")
    ).toBeInTheDocument();
  });

  it("shows error toast when API call fails", async () => {
    mockTrigger.mockRejectedValueOnce(
      new Error(
        "Update Code System is already running. We have NOT started the job again"
      )
    );

    render(<CodeSystemManagement />);

    fireEvent.click(screen.getByTestId("update-code-systems-button"));

    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalled();
    });

    expect(
      screen.getByText(
        "Update Code System is already running. We have NOT started the job again"
      )
    ).toBeInTheDocument();

    expect(screen.getByTestId("update-vses-error-message")).toBeInTheDocument();
  });

  it("closes the toast when close button is clicked", async () => {
    mockTrigger.mockResolvedValueOnce({});

    render(<CodeSystemManagement />);

    fireEvent.click(screen.getByTestId("update-code-systems-button"));

    await waitFor(() => {
      expect(
        screen.getByText("Update Code Systems job has been started")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("close-toast-button"));

    await waitFor(() => {
      expect(
        screen.queryByText("Update Code Systems job has been started")
      ).not.toBeInTheDocument();
    });
  });

  it("renders informational text", () => {
    render(<CodeSystemManagement />);

    expect(screen.getByText(/this is a synchronous job/i)).toBeInTheDocument();
  });
});
