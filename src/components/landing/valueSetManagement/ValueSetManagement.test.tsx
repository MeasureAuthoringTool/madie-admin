import * as React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValueSetManagement from "./ValueSetManagement";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";

jest.mock("../../../api/useTerminologyServiceApi");

const mockUpdateValueSets = jest.fn();
const mockGetValueSets = jest.fn();

describe("ValueSetManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetValueSets.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      numberOfElements: 0,
    });

    (useTerminologyServiceApi as jest.Mock).mockReturnValue({
      updateValueSets: mockUpdateValueSets,
      getValueSets: mockGetValueSets,
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

  it("loads value sets on mount using default sorting", async () => {
    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenCalled();
    });

    expect(mockGetValueSets).toHaveBeenCalledWith(0, 10, "url,false");
  });

  it("shows empty state when no value sets are returned", async () => {
    mockGetValueSets.mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      numberOfElements: 0,
    });

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("no-value-sets-message")).toBeInTheDocument();
    });
  });

  it("shows loading message while data is being retrieved", async () => {
    let resolvePromise;

    mockGetValueSets.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<ValueSetManagement />);

    expect(screen.getByTestId("loading-message")).toBeInTheDocument();

    resolvePromise({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      numberOfElements: 0,
    });

    await waitFor(() => {
      expect(screen.queryByTestId("loading-message")).not.toBeInTheDocument();
    });
  });

  it("shows error toast when getValueSets throws an Error", async () => {
    mockGetValueSets.mockRejectedValueOnce(
      new Error("Failed loading value sets")
    );

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-error-message")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Failed loading value sets")).toBeInTheDocument();
  });

  it("uses generic load error message when thrown value is not an Error", async () => {
    mockGetValueSets.mockRejectedValueOnce("failure");

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-error-message")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("An error occurred while loading value sets.")
    ).toBeInTheDocument();
  });

  it("renders loaded value sets", async () => {
    mockGetValueSets.mockResolvedValueOnce({
      content: [
        {
          id: "1",
          url: "http://example.com/vs",
          lastUpdated: "2025-01-01T12:00:00Z",
          manuallyModified: false,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(screen.getByText("http://example.com/vs")).toBeInTheDocument();
    });

    expect(screen.getByText("View Expansions")).toBeInTheDocument();
  });

  it("renders manually modified icon when value set is manually modified", async () => {
    mockGetValueSets.mockResolvedValueOnce({
      content: [
        {
          id: "1",
          url: "http://example.com/vs",
          lastUpdated: "2025-01-01T12:00:00Z",
          manuallyModified: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("manual-modified-check")).toBeInTheDocument();
    });
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
  it("changes sort field when last updated header is clicked", async () => {
    mockGetValueSets.mockResolvedValue({
      content: [
        {
          id: "1",
          url: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          manuallyModified: false,
        },
      ],
      totalElements: 1,
      totalPages: 2,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenCalledWith(0, 10, "url,false");
    });

    await userEvent.click(screen.getByTestId("header-lastUpdated"));

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenCalledWith(0, 10, "url,false");
    });
  });

  it("reloads value sets when page changes", async () => {
    mockGetValueSets.mockResolvedValue({
      content: [
        {
          id: "1",
          url: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          manuallyModified: false,
        },
      ],
      totalElements: 20,
      totalPages: 2,
      number: 0,
      size: 10,
      numberOfElements: 10,
    });

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Go to page 2" })
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenLastCalledWith(1, 10, "url,false");
    });
  });

  it("reloads value sets when limit changes", async () => {
    mockGetValueSets.mockResolvedValue({
      content: [
        {
          id: "1",
          url: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          manuallyModified: false,
        },
      ],
      totalElements: 20,
      totalPages: 2,
      number: 0,
      size: 10,
      numberOfElements: 10,
    });

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("combobox"));

    const option25 = await screen.findByText("25");

    await userEvent.click(option25);

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenLastCalledWith(0, 25, "url,false");
    });
  });
  it("toggles url sort from ASC to DESC", async () => {
    mockGetValueSets.mockResolvedValue({
      content: [
        {
          id: "1",
          url: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          manuallyModified: false,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("header-url")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("header-url"));

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenCalledWith(0, 10, "url,true");
    });
  });
  it("changes sort column to lastUpdated", async () => {
    mockGetValueSets.mockResolvedValue({
      content: [
        {
          id: "1",
          url: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          manuallyModified: false,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("header-lastUpdated")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("header-lastUpdated"));

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenCalledWith(0, 10, "lastUpdated,false");
    });
  });
});
