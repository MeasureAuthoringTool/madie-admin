import * as React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ValueSetManagement from "./ValueSetManagement";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";

jest.mock("../../../api/useTerminologyServiceApi");

jest.mock("monaco-editor", () => ({}), { virtual: true });

jest.mock("@monaco-editor/react", () => {
  return {
    __esModule: true,
    loader: {
      config: jest.fn(),
      init: jest.fn().mockResolvedValue({}),
    },
    default: function MockMonacoEditor(props: {
      value: string;
      onChange?: (value: string) => void;
    }) {
      return (
        <textarea
          data-testid="mock-monaco-editor"
          value={props.value}
          onChange={(event) => props.onChange?.(event.target.value)}
        />
      );
    },
  };
});

const mockUpdateValueSets = jest.fn();
const mockGetValueSets = jest.fn();
const mockAddValueSet = jest.fn();
const mockUpdateValueSet = jest.fn();

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
      addValueSet: mockAddValueSet,
      updateValueSet: mockUpdateValueSet,
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

  it("renders the Add Value Set button", () => {
    render(<ValueSetManagement />);
    const button = screen.getByTestId("open-add-value-set-modal-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Add New Valueset Data");
  });

  it("loads value sets on mount using default sorting", async () => {
    render(<ValueSetManagement />);

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenCalled();
    });

    expect(mockGetValueSets).toHaveBeenCalledWith(0, 25, "url,false", "");
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
    let resolvePromise: (value: {
      content: [];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
      numberOfElements: number;
    }) => void;
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

    expect(screen.getByText("Edit Value Set")).toBeInTheDocument();
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
      expect(mockGetValueSets).toHaveBeenCalledWith(0, 25, "url,false", "");
    });

    userEvent.click(screen.getByTestId("header-lastUpdated"));

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenCalledWith(0, 25, "url,false", "");
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

    userEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenLastCalledWith(1, 25, "url,false", "");
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

    userEvent.click(screen.getByRole("combobox"));

    const option25 = await screen.findByText("50");

    userEvent.click(option25);

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenLastCalledWith(0, 50, "url,false", "");
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
      expect(mockGetValueSets).toHaveBeenCalledWith(0, 25, "url,true", "");
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
      expect(mockGetValueSets).toHaveBeenCalledWith(
        0,
        25,
        "lastUpdated,false",
        ""
      );
    });
  });
  it("opens the VSE dialog when Edit Value Set is clicked", async () => {
    mockGetValueSets.mockResolvedValueOnce({
      content: [
        {
          id: "1",
          url: "http://example.com/vs",
          version: "1.0",
          lastUpdated: "2025-01-01T00:00:00Z",
          manuallyModified: false,
          valueSet: '{"resourceType":"ValueSet"}',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<ValueSetManagement />);

    const button = await screen.findByRole("button", {
      name: /edit value set/i,
    });

    userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Edit Valueset Data")).toBeInTheDocument();
    });
    userEvent.click(screen.getByTestId("edit-value-set-discard-button"));
    await waitFor(() => {
      expect(screen.queryByText("Edit Valueset Data")).not.toBeInTheDocument();
    });
  });

  it("submits an edited value set and shows success toast", async () => {
    mockUpdateValueSet.mockResolvedValueOnce(undefined);
    mockGetValueSets.mockResolvedValueOnce({
      content: [
        {
          id: "1",
          url: "http://example.com/vs",
          version: "1.0",
          lastUpdated: "2025-01-01T00:00:00Z",
          manuallyModified: false,
          valueSet: '{"resourceType":"ValueSet"}',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<ValueSetManagement />);

    userEvent.click(await screen.findByRole("button", { name: /edit value set/i }));

    fireEvent.change(screen.getByTestId("edit-value-set-url-input"), {
      target: { value: "http://example.com/vs-updated" },
    });
    fireEvent.change(screen.getByTestId("edit-value-set-version-input"), {
      target: { value: "2.0" },
    });
    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: '{"resourceType":"ValueSet","status":"active"}' },
    });

    userEvent.click(screen.getByTestId("edit-value-set-save-button"));

    await waitFor(() => {
      expect(mockUpdateValueSet).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "1",
          url: "http://example.com/vs-updated",
          version: "2.0",
          valueSet: '{"resourceType":"ValueSet","status":"active"}',
          manuallyModified: true,
          lastUpdated: expect.any(String),
        })
      );
    });

    expect(
      screen.getByText("Value set updated successfully.")
    ).toBeInTheDocument();
  });

  it("shows an error toast when editing a value set fails", async () => {
    mockUpdateValueSet.mockRejectedValueOnce(new Error("Edit failed"));
    mockGetValueSets.mockResolvedValueOnce({
      content: [
        {
          id: "1",
          url: "http://example.com/vs",
          version: "1.0",
          lastUpdated: "2025-01-01T00:00:00Z",
          manuallyModified: false,
          valueSet: '{"resourceType":"ValueSet"}',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<ValueSetManagement />);

    userEvent.click(await screen.findByRole("button", { name: /edit value set/i }));
    userEvent.click(screen.getByTestId("edit-value-set-save-button"));

    await waitFor(() => {
      expect(screen.getByTestId("update-vses-error-message")).toBeInTheDocument();
    });
    expect(screen.getByText("Edit failed")).toBeInTheDocument();
  });

  it("searches value sets when search icon is clicked", async () => {
    render(<ValueSetManagement />);

    const searchInput = screen.getByTestId("vs-list-search-input");

    userEvent.type(searchInput, "diabetes");

    userEvent.click(screen.getByTestId("vs-trigger-search"));

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenLastCalledWith(
        0,
        25,
        "url,false",
        "diabetes"
      );
    });
  });
  it("searches value sets when Enter is pressed", async () => {
    render(<ValueSetManagement />);

    const searchInput = screen.getByTestId("vs-list-search-input");

    userEvent.type(searchInput, "diabetes");

    fireEvent.keyPress(searchInput, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenLastCalledWith(
        0,
        25,
        "url,false",
        "diabetes"
      );
    });
  });
  it("clears the search text when clear button is clicked", async () => {
    render(<ValueSetManagement />);

    const searchInput = screen.getByTestId("vs-list-search-input");

    userEvent.type(searchInput, "diabetes");

    userEvent.click(screen.getByTestId("vs-trigger-search"));

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenLastCalledWith(
        0,
        25,
        "url,false",
        "diabetes"
      );
    });

    userEvent.click(screen.getByTestId("vs-clear-search"));

    expect(searchInput).toHaveValue("");

    await waitFor(() => {
      expect(mockGetValueSets).toHaveBeenLastCalledWith(0, 25, "url,false", "");
    });
  });

  it("opens and closes the add value set modal", async () => {
    render(<ValueSetManagement />);

    userEvent.click(screen.getByTestId("open-add-value-set-modal-button"));
    expect(
      await screen.findByTestId("add-value-set-url-input")
    ).toBeInTheDocument();

    userEvent.click(screen.getByTestId("add-value-set-cancel-button"));
    await waitFor(() => {
      expect(
        screen.queryByTestId("add-value-set-url-input")
      ).not.toBeInTheDocument();
    });
  });

  it("shows JSON syntax validation in the add value set modal", async () => {
    render(<ValueSetManagement />);

    userEvent.click(screen.getByTestId("open-add-value-set-modal-button"));

    userEvent.type(
      screen.getByTestId("add-value-set-url-input"),
      "http://example.com/new-vs"
    );

    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: "not valid json" },
    });
    fireEvent.blur(screen.getByTestId("mock-monaco-editor"));

    userEvent.click(screen.getByTestId("add-value-set-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("add-value-set-json-error")).toHaveTextContent(
        "Value set expansion JSON must be valid JSON."
      );
    });
    expect(mockAddValueSet).not.toHaveBeenCalled();
  });

  it("submits a new value set and shows success toast", async () => {
    mockAddValueSet.mockResolvedValueOnce(undefined);

    render(<ValueSetManagement />);

    userEvent.click(screen.getByTestId("open-add-value-set-modal-button"));
    userEvent.type(
      screen.getByTestId("add-value-set-url-input"),
      "http://example.com/new-vs"
    );
    userEvent.type(screen.getByTestId("add-value-set-version-input"), "1.0");
    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: '{"resourceType":"ValueSet"}' },
    });

    userEvent.click(screen.getByTestId("add-value-set-submit-button"));

    await waitFor(() => {
      expect(mockAddValueSet).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://example.com/new-vs",
          version: "1.0",
          valueSet: '{"resourceType":"ValueSet"}',
          manuallyModified: true,
          lastUpdated: expect.any(String),
        })
      );
    });

    expect(
      screen.getByText("Value set added successfully.")
    ).toBeInTheDocument();
  });

  it("shows an error toast when adding a value set fails", async () => {
    mockAddValueSet.mockRejectedValueOnce(
      new Error(
        "The URL in the expansion JSON does not match the provided URL."
      )
    );

    render(<ValueSetManagement />);

    userEvent.click(screen.getByTestId("open-add-value-set-modal-button"));
    userEvent.type(
      screen.getByTestId("add-value-set-url-input"),
      "http://example.com/new-vs"
    );
    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: '{"resourceType":"ValueSet"}' },
    });

    userEvent.click(screen.getByTestId("add-value-set-submit-button"));

    await waitFor(() => {
      expect(
        screen.getByTestId("update-vses-error-message")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        "The URL in the expansion JSON does not match the provided URL."
      )
    ).toBeInTheDocument();
    // Dialog stays open so the user can correct the input.
    expect(screen.getByTestId("add-value-set-url-input")).toBeInTheDocument();
  });

  it("falls back to a generic error message when the add failure is not an Error", async () => {
    mockAddValueSet.mockRejectedValueOnce("boom");

    render(<ValueSetManagement />);

    userEvent.click(screen.getByTestId("open-add-value-set-modal-button"));
    userEvent.type(
      screen.getByTestId("add-value-set-url-input"),
      "http://example.com/new-vs"
    );
    fireEvent.change(screen.getByTestId("mock-monaco-editor"), {
      target: { value: '{"resourceType":"ValueSet"}' },
    });

    userEvent.click(screen.getByTestId("add-value-set-submit-button"));

    await waitFor(() => {
      expect(
        screen.getByText("An error occurred while adding the value set.")
      ).toBeInTheDocument();
    });
  });
});
