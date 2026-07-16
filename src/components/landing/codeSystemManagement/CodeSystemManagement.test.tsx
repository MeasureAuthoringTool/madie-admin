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

  it("requests code systems with default paging and sorting", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      numberOfElements: 0,
    });
    (useTerminologyServiceApi as jest.Mock).mockReturnValue({
      triggerUpdateCodeSystems: mockTrigger,
      getCodeSystems: mockGet,
    });
    render(<CodeSystemManagement />);
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });
    expect(mockGet).toHaveBeenCalledWith(0, 20, "title,false");
  });

  it("shows loading message while fetching code systems", async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((res) => {
      resolvePromise = res;
    });
    const mockGet = jest.fn().mockReturnValue(pendingPromise);
    (useTerminologyServiceApi as jest.Mock).mockReturnValue({
      triggerUpdateCodeSystems: mockTrigger,
      getCodeSystems: mockGet,
    });
    render(<CodeSystemManagement />);
    // loading should be visible while the promise is pending
    expect(screen.getByTestId("loading-message")).toBeInTheDocument();
    // resolve the promise to finish loading
    resolvePromise!({
      content: [],
      totalPages: 0,
      totalElements: 0,
      numberOfElements: 0,
    });
    await waitFor(() => {
      expect(screen.queryByTestId("loading-message")).not.toBeInTheDocument();
    });
  });

  it("renders table when code systems exist and hides empty message", async () => {
    const codeSystems = [
      {
        id: "cs-1",
        title: "Example Title",
        name: "example",
        version: { fhirVersion: "4.0.1" },
        fullUrl: "http://example.com",
        lastUpdated: new Date().toISOString(),
        isLatestVersion: true,
      },
    ];
    const mockGet = jest.fn().mockResolvedValue({
      content: codeSystems,
      totalPages: 1,
      totalElements: 1,
      numberOfElements: 1,
    });
    (useTerminologyServiceApi as jest.Mock).mockReturnValue({
      triggerUpdateCodeSystems: mockTrigger,
      getCodeSystems: mockGet,
    });
    render(<CodeSystemManagement />);
    await waitFor(() => {
      expect(screen.getByTestId("code-system-table")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("no-code-systems-message")
    ).not.toBeInTheDocument();
  });

  it("shows error toast when loading code systems fails", async () => {
    const mockGet = jest
      .fn()
      .mockRejectedValue(new Error("Failed to load code systems"));
    (useTerminologyServiceApi as jest.Mock).mockReturnValue({
      triggerUpdateCodeSystems: mockTrigger,
      getCodeSystems: mockGet,
    });
    render(<CodeSystemManagement />);
    await waitFor(() => {
      expect(
        screen.getByText("Failed to load code systems")
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("update-vses-error-message")).toBeInTheDocument();
  });
});
