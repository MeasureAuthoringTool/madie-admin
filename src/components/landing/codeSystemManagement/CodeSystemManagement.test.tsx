import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CodeSystemManagement from "./CodeSystemManagement";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";
import userEvent from "@testing-library/user-event";

jest.mock("../../../api/useTerminologyServiceApi");

describe("CodeSystemManagement", () => {
  const mockTrigger = jest.fn();
  const mockGetCodeSystems = jest.fn();
  const mockCreateCodeSystem = jest.fn();
  const mockUpdateCodeSystem = jest.fn();
  const mockDeleteCodeSystem = jest.fn();

  const existingCodeSystem = {
    id: "cs-1",
    title: "Example Title",
    name: "example",
    version: { fhirVersion: "4.0.1", vsacVersion: "2024" },
    fullUrl: "http://example.com",
    oid: "1.2.3",
    lastUpdated: "2025-01-01T00:00:00Z",
    isLatestVersion: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCodeSystems.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 25,
      numberOfElements: 0,
    });
    mockCreateCodeSystem.mockResolvedValue({});
    mockUpdateCodeSystem.mockResolvedValue({});
    mockDeleteCodeSystem.mockResolvedValue({});

    (useTerminologyServiceApi as jest.Mock).mockReturnValue({
      triggerUpdateCodeSystems: mockTrigger,
      getCodeSystems: mockGetCodeSystems,
      createCodeSystem: mockCreateCodeSystem,
      updateCodeSystem: mockUpdateCodeSystem,
      deleteCodeSystem: mockDeleteCodeSystem,
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
    expect(mockGet).toHaveBeenCalledWith(0, 25, "title,false", "", "");
  });

  it("applies search text and clears it", async () => {
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
      expect(mockGet).toHaveBeenCalledWith(0, 25, "title,false", "", "");
    });

    const searchInput = screen.getByTestId("code-system-search-input");
    await userEvent.type(searchInput, "example");
    await userEvent.click(screen.getByTestId("code-system-trigger-search"));

    await waitFor(() => {
      expect(mockGet).toHaveBeenLastCalledWith(
        0,
        25,
        "title,false",
        "",
        "example"
      );
    });

    await userEvent.click(screen.getByTestId("code-system-clear-search"));

    await waitFor(() => {
      expect(mockGet).toHaveBeenLastCalledWith(0, 25, "title,false", "", "");
    });
  });

  it("shows loading message while fetching code systems", async () => {
    let resolvePromise: (value: {
      content: [
        {
          id: string;
          title: string;
          name: string;
          version: { fhirVersion: string };
          fullUrl: string;
          lastUpdated: string;
          isLatestVersion: boolean;
        }
      ];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
      numberOfElements: number;
    }) => void;
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
    resolvePromise({
      content: [
        {
          id: "cs-1",
          title: "Example Title",
          name: "example",
          version: { fhirVersion: "4.0.1" },
          fullUrl: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          isLatestVersion: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
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

  it("renders the sort headers for code systems", async () => {
    mockGetCodeSystems.mockResolvedValue({
      content: [
        {
          id: "cs-1",
          title: "Example Title",
          name: "example",
          version: { fhirVersion: "4.0.1" },
          fullUrl: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          isLatestVersion: true,
        },
      ],
      totalElements: 1,
      totalPages: 2,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<CodeSystemManagement />);

    await waitFor(() => {
      expect(mockGetCodeSystems).toHaveBeenCalledWith(
        0,
        25,
        "title,false",
        "",
        ""
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("code-system-table")).toBeInTheDocument();
    });

    const lastUpdatedHeader = screen.getByRole("columnheader", {
      name: /Last Updated/i,
    });
    expect(lastUpdatedHeader).toBeInTheDocument();

    await userEvent.click(lastUpdatedHeader);

    expect(mockGetCodeSystems).toHaveBeenCalledTimes(1);
  });

  it("reloads value sets when page changes", async () => {
    mockGetCodeSystems.mockResolvedValue({
      content: [
        {
          id: "cs-1",
          title: "Example Title",
          name: "example",
          version: { fhirVersion: "4.0.1" },
          fullUrl: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          isLatestVersion: true,
        },
      ],
      totalElements: 25,
      totalPages: 2,
      number: 0,
      size: 10,
      numberOfElements: 10,
    });

    render(<CodeSystemManagement />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Go to page 2" })
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    await waitFor(() => {
      expect(mockGetCodeSystems).toHaveBeenLastCalledWith(
        1,
        25,
        "title,false",
        "",
        ""
      );
    });
  });

  it("renders pagination controls for multiple pages", async () => {
    mockGetCodeSystems.mockResolvedValue({
      content: [
        {
          id: "cs-1",
          title: "Example Title",
          name: "example",
          version: { fhirVersion: "4.0.1" },
          fullUrl: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          isLatestVersion: true,
        },
      ],
      totalElements: 25,
      totalPages: 2,
      number: 0,
      size: 10,
      numberOfElements: 10,
    });

    render(<CodeSystemManagement />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Go to page 2" })
      ).toBeInTheDocument();
    });

    expect(mockGetCodeSystems).toHaveBeenCalledWith(
      0,
      25,
      "title,false",
      "",
      ""
    );
  });
  it("toggles title sort from ASC to DESC", async () => {
    mockGetCodeSystems.mockResolvedValue({
      content: [
        {
          id: "cs-1",
          title: "Example Title",
          name: "example",
          version: { fhirVersion: "4.0.1" },
          fullUrl: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          isLatestVersion: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<CodeSystemManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("header-title")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("header-title"));

    await waitFor(() => {
      expect(mockGetCodeSystems).toHaveBeenLastCalledWith(
        0,
        25,
        "title,true",
        "",
        ""
      );
    });
  });
  it("changes sort column to lastUpdated", async () => {
    mockGetCodeSystems.mockResolvedValue({
      content: [
        {
          id: "cs-1",
          title: "Example Title",
          name: "example",
          version: { fhirVersion: "4.0.1" },
          fullUrl: "http://example.com",
          lastUpdated: "2025-01-01T00:00:00Z",
          isLatestVersion: true,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
    });

    render(<CodeSystemManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("header-lastUpdated")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("header-lastUpdated"));

    await waitFor(() => {
      expect(mockGetCodeSystems).toHaveBeenLastCalledWith(
        0,
        25,
        "lastUpdated,false",
        "",
        ""
      );
    });
  });

  it("opens add code system modal when add button is clicked", async () => {
    render(<CodeSystemManagement />);

    await userEvent.click(screen.getByTestId("add-code-system-button"));

    expect(screen.getByText("Add New Codesystem Data")).toBeInTheDocument();
    expect(
      screen.getByTestId("add-code-system-title-input")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("add-code-system-name-input")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("add-code-system-fhir-version-input")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("add-code-system-vsac-version-input")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("add-code-system-full-url-input")
    ).toBeInTheDocument();
    expect(screen.getByTestId("add-code-system-oid-input")).toBeInTheDocument();
    expect(
      screen.getByTestId("add-code-system-latest-checkbox")
    ).toBeInTheDocument();
  });

  it("keeps save disabled until required fields are filled", async () => {
    render(<CodeSystemManagement />);

    await userEvent.click(screen.getByTestId("add-code-system-button"));

    const saveButton = screen.getByTestId("add-code-system-save-button");
    expect(saveButton).toBeDisabled();

    await userEvent.type(
      screen.getByTestId("add-code-system-name-input"),
      "SNOMED"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-fhir-version-input"),
      "4.0.1"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-full-url-input"),
      "http://example.com"
    );

    expect(saveButton).toBeDisabled();

    await userEvent.type(
      screen.getByTestId("add-code-system-oid-input"),
      "1.2.3"
    );

    expect(saveButton).toBeEnabled();
  });

  it("closes add code system modal on cancel", async () => {
    render(<CodeSystemManagement />);

    await userEvent.click(screen.getByTestId("add-code-system-button"));
    expect(screen.getByText("Add New Codesystem Data")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("add-code-system-cancel-button"));

    await waitFor(() => {
      expect(
        screen.queryByText("Add New Codesystem Data")
      ).not.toBeInTheDocument();
    });
  });

  it("saves add code system modal data", async () => {
    render(<CodeSystemManagement />);

    await userEvent.click(screen.getByTestId("add-code-system-button"));

    await userEvent.type(
      screen.getByTestId("add-code-system-name-input"),
      "SNOMED"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-fhir-version-input"),
      "4.0.1"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-full-url-input"),
      "http://example.com"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-oid-input"),
      "1.2.3"
    );

    await userEvent.click(screen.getByTestId("add-code-system-save-button"));

    await waitFor(() => {
      expect(mockCreateCodeSystem).toHaveBeenCalled();
    });
  });

  it("calls createCodeSystem API and shows success toast on save", async () => {
    render(<CodeSystemManagement />);

    await userEvent.click(screen.getByTestId("add-code-system-button"));
    await userEvent.type(
      screen.getByTestId("add-code-system-title-input"),
      "Example"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-name-input"),
      "SNOMED"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-fhir-version-input"),
      "4.0.1"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-vsac-version-input"),
      "2024"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-full-url-input"),
      "http://example.com"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-oid-input"),
      "1.2.3"
    );
    await userEvent.click(
      screen.getByTestId("add-code-system-latest-checkbox")
    );

    await userEvent.click(screen.getByTestId("add-code-system-save-button"));

    await waitFor(() => {
      expect(mockCreateCodeSystem).toHaveBeenCalledWith({
        title: "Example",
        name: "SNOMED",
        fullUrl: "http://example.com",
        oid: "1.2.3",
        isLatestVersion: true,
        version: {
          fhirVersion: "4.0.1",
          vsacVersion: "2024",
        },
      });
    });

    expect(
      screen.getByText("Code System created successfully")
    ).toBeInTheDocument();
  });

  it("shows error toast when createCodeSystem fails", async () => {
    mockCreateCodeSystem.mockRejectedValueOnce({
      response: {
        data: {
          message: "Unable to create code system",
        },
      },
    });

    render(<CodeSystemManagement />);

    await userEvent.click(screen.getByTestId("add-code-system-button"));
    await userEvent.type(
      screen.getByTestId("add-code-system-name-input"),
      "SNOMED"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-fhir-version-input"),
      "4.0.1"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-full-url-input"),
      "http://example.com"
    );
    await userEvent.type(
      screen.getByTestId("add-code-system-oid-input"),
      "1.2.3"
    );

    await userEvent.click(screen.getByTestId("add-code-system-save-button"));

    await waitFor(() => {
      expect(mockCreateCodeSystem).toHaveBeenCalled();
    });

    expect(
      screen.getByText("Unable to create code system")
    ).toBeInTheDocument();
    expect(screen.getByText("Add New Codesystem Data")).toBeInTheDocument();
  });

  it("closes add code system modal on X icon click", async () => {
    render(<CodeSystemManagement />);

    await userEvent.click(screen.getByTestId("add-code-system-button"));
    expect(screen.getByText("Add New Codesystem Data")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /close/i });
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Add New Codesystem Data")
      ).not.toBeInTheDocument();
    });
  });

  describe("delete code system", () => {
    const renderWithExistingCodeSystem = async () => {
      mockGetCodeSystems.mockResolvedValue({
        content: [existingCodeSystem],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 25,
        numberOfElements: 1,
      });

      render(<CodeSystemManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("code-system-table")).toBeInTheDocument();
      });
    };

    it("opens delete confirmation dialog when delete icon is clicked", async () => {
      await renderWithExistingCodeSystem();

      await userEvent.click(screen.getByTestId("delete-code-system-cs-1"));

      expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
      expect(screen.getByText("Delete Code system")).toBeInTheDocument();
    });

    it("closes dialog and does not delete when cancel is clicked", async () => {
      await renderWithExistingCodeSystem();

      await userEvent.click(screen.getByTestId("delete-code-system-cs-1"));
      await userEvent.click(screen.getByTestId("delete-dialog-cancel-button"));

      await waitFor(() => {
        expect(screen.queryByTestId("delete-dialog")).not.toBeInTheDocument();
      });
      expect(mockDeleteCodeSystem).not.toHaveBeenCalled();
    });

    it("deletes the code system, reloads table, and shows success toast", async () => {
      mockGetCodeSystems
        .mockResolvedValueOnce({
          content: [existingCodeSystem],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 25,
          numberOfElements: 1,
        })
        .mockResolvedValueOnce({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 25,
          numberOfElements: 0,
        });

      render(<CodeSystemManagement />);

      await waitFor(() => {
        expect(
          screen.getByTestId("delete-code-system-cs-1")
        ).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("delete-code-system-cs-1"));
      await userEvent.click(
        screen.getByTestId("delete-dialog-continue-button")
      );

      await waitFor(() => {
        expect(mockDeleteCodeSystem).toHaveBeenCalledWith("cs-1");
      });

      await waitFor(() => {
        expect(mockGetCodeSystems).toHaveBeenCalledTimes(2);
      });

      expect(
        screen.getByText("Code system successfully deleted")
      ).toBeInTheDocument();
    });
  });

  describe("edit code system modal", () => {
    const renderWithExistingCodeSystem = async () => {
      mockGetCodeSystems.mockResolvedValue({
        content: [existingCodeSystem],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 25,
        numberOfElements: 1,
      });

      render(<CodeSystemManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("code-system-table")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("edit-code-system-cs-1"));

      expect(screen.getByText("Edit Codesystem Data")).toBeInTheDocument();
    };

    it("opens the edit modal populated with the selected code system's data", async () => {
      await renderWithExistingCodeSystem();

      expect(screen.getByTestId("add-code-system-title-input")).toHaveValue(
        "Example Title"
      );
      expect(screen.getByTestId("add-code-system-name-input")).toHaveValue(
        "example"
      );
      expect(
        screen.getByTestId("add-code-system-fhir-version-input")
      ).toHaveValue("4.0.1");
      expect(
        screen.getByTestId("add-code-system-vsac-version-input")
      ).toHaveValue("2024");
      expect(screen.getByTestId("add-code-system-full-url-input")).toHaveValue(
        "http://example.com"
      );
      expect(screen.getByTestId("add-code-system-oid-input")).toHaveValue(
        "1.2.3"
      );
      expect(
        screen.getByRole("checkbox", { name: "Add new Code System" })
      ).toBeChecked();
    });

    it("keeps save enabled with existing valid data and disables it when a required field is cleared", async () => {
      await renderWithExistingCodeSystem();

      const saveButton = screen.getByTestId("add-code-system-save-button");
      expect(saveButton).toBeEnabled();

      await userEvent.clear(screen.getByTestId("add-code-system-oid-input"));

      expect(saveButton).toBeDisabled();

      await userEvent.type(
        screen.getByTestId("add-code-system-oid-input"),
        "1.2.3"
      );

      expect(saveButton).toBeEnabled();
    });

    it("resets edited fields and closes the modal on cancel without calling updateCodeSystem", async () => {
      await renderWithExistingCodeSystem();

      await userEvent.clear(screen.getByTestId("add-code-system-name-input"));
      await userEvent.type(
        screen.getByTestId("add-code-system-name-input"),
        "changed-name"
      );

      await userEvent.click(
        screen.getByTestId("add-code-system-cancel-button")
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Edit Codesystem Data")
        ).not.toBeInTheDocument();
      });

      expect(mockUpdateCodeSystem).not.toHaveBeenCalled();

      await userEvent.click(screen.getByTestId("edit-code-system-cs-1"));

      expect(screen.getByTestId("add-code-system-name-input")).toHaveValue(
        "example"
      );
    });

    it("calls updateCodeSystem with the edited data and shows success toast on save", async () => {
      await renderWithExistingCodeSystem();

      await userEvent.clear(screen.getByTestId("add-code-system-name-input"));
      await userEvent.type(
        screen.getByTestId("add-code-system-name-input"),
        "updated-name"
      );

      await userEvent.click(screen.getByTestId("add-code-system-save-button"));

      await waitFor(() => {
        expect(mockUpdateCodeSystem).toHaveBeenCalledWith("cs-1", {
          title: "Example Title",
          name: "updated-name",
          fullUrl: "http://example.com",
          oid: "1.2.3",
          isLatestVersion: true,
          version: {
            fhirVersion: "4.0.1",
            vsacVersion: "2024",
          },
        });
      });

      expect(mockCreateCodeSystem).not.toHaveBeenCalled();
      expect(
        screen.getByText("Code System updated successfully")
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(
          screen.queryByText("Edit Codesystem Data")
        ).not.toBeInTheDocument();
      });
    });

    it("shows error toast when updateCodeSystem fails", async () => {
      mockUpdateCodeSystem.mockRejectedValueOnce({
        response: {
          data: {
            message: "Unable to update code system",
          },
        },
      });

      await renderWithExistingCodeSystem();

      await userEvent.click(screen.getByTestId("add-code-system-save-button"));

      await waitFor(() => {
        expect(mockUpdateCodeSystem).toHaveBeenCalled();
      });

      expect(
        screen.getByText("Unable to update code system")
      ).toBeInTheDocument();
      expect(screen.getByText("Edit Codesystem Data")).toBeInTheDocument();
    });
  });
});
