import * as mockCmsIdStubs from "../../../../__mocks__/cmsIdFormatterStubs";
import * as React from "react";
import * as mockMeasureActionStubs from "../../../../__mocks__/measureActionStubs";
import "@testing-library/jest-dom";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UserProfile from "./UserProfile";

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockAdminSearchMeasures = jest.fn();
const mockGetMeasuresByMeasureSetId = jest.fn();
const mockAdminDeleteMeasure = jest.fn();
const mockDeleteMeasure = jest.fn();
const mockFetchMeasure = jest.fn();
const mockExportMeasure = jest.fn();
const mockUseFeatureFlags = jest.fn(() => ({ AdminUserProfile: true }));

jest.mock("@madie/madie-util", () => ({
  ...mockCmsIdStubs,
  ...mockMeasureActionStubs,
  useUserServiceApi: jest.fn(() => ({
    getUser: (...args: unknown[]) => mockGetUser(...args),
  })),
  useMeasureServiceApi: jest.fn(() => ({
    adminSearchMeasuresForUser: (...args: unknown[]) =>
      mockAdminSearchMeasures(...args),
    getMeasuresByMeasureSetId: (...args: unknown[]) =>
      mockGetMeasuresByMeasureSetId(...args),
    adminDeleteMeasure: (...args: unknown[]) => mockAdminDeleteMeasure(...args),
    deleteMeasure: (...args: unknown[]) => mockDeleteMeasure(...args),
    fetchMeasure: (...args: unknown[]) => mockFetchMeasure(...args),
  })),
  useFeatureFlags: () => mockUseFeatureFlags(),
  adminUserStore: {
    state: null,
    updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  },
  exportMeasure: (...args: unknown[]) => mockExportMeasure(...args),
  ExportDialog: ({ open, handleContinueDialog, handleCancelDialog }: any) =>
    open ? (
      <div data-testid="export-dialog">
        Export Dialog
        <button
          data-testid="export-continue-btn"
          onClick={handleContinueDialog}
        >
          Continue
        </button>
        <button data-testid="export-cancel-btn" onClick={handleCancelDialog}>
          Cancel
        </button>
      </div>
    ) : null,
  ViewHRModal: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="view-human-readable-modal">
        View HR Modal
        <button data-testid="view-hr-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  ViewMeasureHistoryDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="view-measure-history-dialog">
        Measure History
        <button data-testid="view-history-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  CompareVersionsDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="compare-versions-dialog">
        Compare Versions
        <button data-testid="compare-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  ShareDialog: ({ open, option, onSave, onClose }: any) =>
    open ? (
      <div data-testid="share-dialog" data-option={option}>
        Share Dialog
        <button
          data-testid="share-save-btn"
          onClick={() =>
            onSave({
              toastType: "success",
              toastMessage: "Measure Successfully Shared",
              toastOpen: true,
            })
          }
        >
          Save
        </button>
        <button data-testid="share-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

const renderAt = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/userProfile/:harpId" element={<UserProfile />} />
      </Routes>
    </MemoryRouter>
  );

const emptyPage = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  numberOfElements: 0,
  pageable: { offset: 0 },
};

const ownedMeasure = {
  id: "m1",
  measureName: "Owned Measure A",
  version: "1.0.000",
  model: "QI-Core v4.1.1",
  lastModifiedAt: "2026-05-01T12:00:00Z",
  measureMetaData: { draft: true },
  measureSet: { acls: [{ userId: "x" }], cmsId: 42, owner: "test_user" },
};

const sharedMeasure = {
  id: "m2",
  measureName: "Shared Measure B",
  version: "2.1.000",
  model: "QDM v5.6",
  lastModifiedAt: "2026-04-15T08:00:00Z",
  measureMetaData: { draft: false },
  measureSet: { acls: [], cmsId: 7, owner: "other_user" },
};

const pageWith = (rows: any[], totalElements: number = rows.length) => ({
  content: rows,
  totalPages: 1,
  totalElements,
  numberOfElements: rows.length,
  pageable: { offset: 0 },
});

describe("UserProfile", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockUpdateUser.mockReset();
    mockAdminSearchMeasures.mockReset();
    mockGetMeasuresByMeasureSetId.mockReset();
    mockAdminDeleteMeasure.mockReset();
    mockDeleteMeasure.mockReset();
    mockFetchMeasure.mockReset();
    mockExportMeasure.mockReset();
    mockUseFeatureFlags.mockReset();
    mockUseFeatureFlags.mockReturnValue({ AdminUserProfile: true });
    mockGetUser.mockResolvedValue(null);
    mockAdminSearchMeasures.mockResolvedValue(emptyPage);
    mockGetMeasuresByMeasureSetId.mockResolvedValue([]);
    mockAdminDeleteMeasure.mockResolvedValue({ status: 200 });
    mockDeleteMeasure.mockResolvedValue({ status: 200 });
    mockFetchMeasure.mockImplementation((id: string) =>
      Promise.resolve({ id, measureName: "Owned Measure A" })
    );
    mockExportMeasure.mockResolvedValue(undefined);
  });

  it("renders the user-profile card structure", async () => {
    renderAt("/admin/userProfile/some_harp_id");
    expect(screen.getByTestId("user-profile")).toBeInTheDocument();
    expect(
      screen.getByTestId("user-profile").querySelector(".user-profile-header")
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });
  });

  it("fetches the user by harpId and pushes the result into adminUserStore", async () => {
    const user = {
      id: "u1",
      harpId: "test_user",
      firstName: "Lila",
      lastName: "Kensington",
      email: "l.kensington@cms.hhs.gov",
      status: "ACTIVE",
    };
    mockGetUser.mockResolvedValue(user);

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith(
        "test_user",
        expect.any(AbortSignal)
      );
    });
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(user);
    });
  });

  it("clears adminUserStore when the user fetch fails", async () => {
    mockGetUser.mockRejectedValue(new Error("Network error"));

    renderAt("/admin/userProfile/missing_user");

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(null);
    });
  });

  it("does not clear adminUserStore when the user fetch is aborted", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    mockGetUser.mockRejectedValue(abortError);

    renderAt("/admin/userProfile/any_user");

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockUpdateUser).not.toHaveBeenCalledWith(null);
  });

  it("calls the admin search endpoint for OWNED on mount and renders the rows", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 7));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        0,
        "lastModifiedAt",
        "DESC",
        expect.objectContaining({ searchField: "" }),
        expect.any(AbortController)
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("measure-name-m1-content")).toHaveTextContent(
        "Owned Measure A"
      );
      expect(screen.getByTestId("measure-cmsId-m1-content")).toHaveTextContent(
        "0042FHIR"
      );
    });
    expect(screen.getByTestId("owned-measures-tab")).toHaveTextContent(
      "Owned Measures (7)"
    );
  });

  it("switches to the Shared tab and re-queries with SHARED ownership", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 3));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });

    mockAdminSearchMeasures.mockClear();
    mockAdminSearchMeasures.mockResolvedValue(pageWith([sharedMeasure], 2));

    userEvent.click(screen.getByTestId("shared-measures-tab"));

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["SHARED"],
        10,
        0,
        "lastModifiedAt",
        "DESC",
        expect.any(Object),
        expect.any(AbortController)
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("measure-name-m2-content")).toHaveTextContent(
        "Shared Measure B"
      );
      expect(screen.getByTestId("shared-measures-tab")).toHaveTextContent(
        "Shared Measures (2)"
      );
    });
  });

  it("fetches the inactive tab's count on mount", async () => {
    mockAdminSearchMeasures.mockImplementation(
      (_harpId: string, ownershipTypes: string[]) => {
        if (ownershipTypes[0] === "OWNED") {
          return Promise.resolve(pageWith([], 4));
        }
        return Promise.resolve(pageWith([], 9));
      }
    );

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(screen.getByTestId("owned-measures-tab")).toHaveTextContent(
        "Owned Measures (4)"
      );
      expect(screen.getByTestId("shared-measures-tab")).toHaveTextContent(
        "Shared Measures (9)"
      );
    });
  });

  it("shows an error message when the search fails", async () => {
    mockAdminSearchMeasures.mockRejectedValue(new Error("failed"));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(screen.getByTestId("measures-error-message")).toHaveTextContent(
        "failed"
      );
    });
  });

  it("sort Measure column in the direction of ASC → DESC → unsorted ", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });
    mockAdminSearchMeasures.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Measure" }));
    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        0,
        "measureName",
        "ASC",
        expect.any(Object),
        expect.any(AbortController)
      );
    });

    mockAdminSearchMeasures.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Measure" }));
    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        0,
        "measureName",
        "DESC",
        expect.any(Object),
        expect.any(AbortController)
      );
    });

    mockAdminSearchMeasures.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Measure" }));
    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        0,
        "lastModifiedAt",
        "DESC",
        expect.any(Object),
        expect.any(AbortController)
      );
    });
  });

  it("expands a row with associated measures and fetches the nested measures", async () => {
    const parentMeasure = {
      ...ownedMeasure,
      hasAssociatedMeasures: true,
      measureSet: { ...ownedMeasure.measureSet, measureSetId: "set-1" },
      measureSetId: "set-1",
    };
    const nestedMeasure = {
      id: "m1-prev",
      measureName: "Owned Measure A",
      version: "0.9.000",
      model: "QI-Core v4.1.1",
      lastModifiedAt: "2026-04-01T12:00:00Z",
      measureMetaData: { draft: false },
      measureSet: { acls: [], cmsId: 42, measureSetId: "set-1" },
      measureSetId: "set-1",
    };
    mockAdminSearchMeasures.mockResolvedValue(pageWith([parentMeasure], 1));
    mockGetMeasuresByMeasureSetId.mockResolvedValue([
      parentMeasure,
      nestedMeasure,
    ]);

    renderAt("/admin/userProfile/test_user");

    const toggle = await screen.findByTestId("expand-toggle-m1");
    userEvent.click(toggle);

    await waitFor(() => {
      expect(mockGetMeasuresByMeasureSetId).toHaveBeenCalledWith(
        "set-1",
        true,
        expect.any(Object)
      );
    });
    expect(
      await screen.findByTestId("expanded-row-m1-prev")
    ).toBeInTheDocument();
  });

  it("collapses an already-expanded row when its toggle is clicked again", async () => {
    const parentMeasure = {
      ...ownedMeasure,
      hasAssociatedMeasures: true,
      measureSet: { ...ownedMeasure.measureSet, measureSetId: "set-1" },
      measureSetId: "set-1",
    };
    const nestedMeasure = {
      id: "m1-prev",
      measureName: "Owned Measure A v0.9",
      version: "0.9.000",
      model: "QI-Core v4.1.1",
      lastModifiedAt: "2026-04-01T12:00:00Z",
      measureMetaData: { draft: false },
      measureSet: { acls: [], cmsId: 42, measureSetId: "set-1" },
      measureSetId: "set-1",
    };
    mockAdminSearchMeasures.mockResolvedValue(pageWith([parentMeasure], 1));
    mockGetMeasuresByMeasureSetId.mockResolvedValue([
      parentMeasure,
      nestedMeasure,
    ]);

    renderAt("/admin/userProfile/test_user");

    userEvent.click(await screen.findByTestId("expand-toggle-m1"));
    expect(
      await screen.findByTestId("expanded-row-m1-prev")
    ).toBeInTheDocument();

    mockGetMeasuresByMeasureSetId.mockClear();
    userEvent.click(await screen.findByTestId("expand-toggle-m1"));
    await waitFor(() => {
      expect(
        screen.queryByTestId("expanded-row-m1-prev")
      ).not.toBeInTheDocument();
    });
    expect(mockGetMeasuresByMeasureSetId).not.toHaveBeenCalled();
  });

  it("refetches with the new page when pagination changes", async () => {
    mockAdminSearchMeasures.mockResolvedValue({
      content: [ownedMeasure],
      totalElements: 12,
      totalPages: 2,
      numberOfElements: 1,
      pageable: { offset: 0 },
    });

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });

    mockAdminSearchMeasures.mockClear();
    const page2 = await screen.findByRole("button", { name: /go to page 2/i });
    userEvent.click(page2);

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        1,
        "lastModifiedAt",
        "DESC",
        expect.any(Object),
        expect.any(AbortController)
      );
    });
  });

  it("shows an error message when the nested-measures fetch fails", async () => {
    const parentMeasure = {
      ...ownedMeasure,
      hasAssociatedMeasures: true,
      measureSet: { ...ownedMeasure.measureSet, measureSetId: "set-1" },
      measureSetId: "set-1",
    };
    mockAdminSearchMeasures.mockResolvedValue(pageWith([parentMeasure], 1));
    mockGetMeasuresByMeasureSetId.mockRejectedValue(
      new Error("nested fetch failed")
    );

    renderAt("/admin/userProfile/test_user");

    userEvent.click(await screen.findByTestId("expand-toggle-m1"));

    await waitFor(() => {
      expect(screen.getByTestId("measures-error-message")).toHaveTextContent(
        "Unable to load related nested measures"
      );
    });
    expect(
      screen.queryByTestId("expanded-row-m1-prev")
    ).not.toBeInTheDocument();
  });

  it.each([
    ["Enter", "{enter}"],
    [" ", "{space}"],
  ])(
    "expands a row when '%s' is pressed on the toggle",
    async (_label: string, keySeq: string) => {
      const parentMeasure = {
        ...ownedMeasure,
        hasAssociatedMeasures: true,
        measureSet: { ...ownedMeasure.measureSet, measureSetId: "set-1" },
        measureSetId: "set-1",
      };
      const nestedMeasure = {
        id: "m1-prev",
        measureName: "Owned Measure A v0.9",
        version: "0.9.000",
        model: "QI-Core v4.1.1",
        lastModifiedAt: "2026-04-01T12:00:00Z",
        measureMetaData: { draft: false },
        measureSet: { acls: [], cmsId: 42, measureSetId: "set-1" },
        measureSetId: "set-1",
      };
      mockAdminSearchMeasures.mockResolvedValue(pageWith([parentMeasure], 1));
      mockGetMeasuresByMeasureSetId.mockResolvedValue([
        parentMeasure,
        nestedMeasure,
      ]);

      renderAt("/admin/userProfile/test_user");

      const toggle = await screen.findByTestId("expand-toggle-m1");
      toggle.focus();
      userEvent.type(toggle, keySeq);
      expect(
        await screen.findByTestId("expanded-row-m1-prev")
      ).toBeInTheDocument();
    }
  );

  it("selects and deselects a nested measure via its checkbox", async () => {
    const parentMeasure = {
      ...ownedMeasure,
      hasAssociatedMeasures: true,
      measureSet: { ...ownedMeasure.measureSet, measureSetId: "set-1" },
      measureSetId: "set-1",
    };
    const nestedMeasure = {
      id: "m1-prev",
      measureName: "Owned Measure A v0.9",
      version: "0.9.000",
      model: "QI-Core v4.1.1",
      lastModifiedAt: "2026-04-01T12:00:00Z",
      measureMetaData: { draft: false },
      measureSet: { acls: [], cmsId: 42, measureSetId: "set-1" },
      measureSetId: "set-1",
    };
    mockAdminSearchMeasures.mockResolvedValue(pageWith([parentMeasure], 1));
    mockGetMeasuresByMeasureSetId.mockResolvedValue([
      parentMeasure,
      nestedMeasure,
    ]);

    renderAt("/admin/userProfile/test_user");

    userEvent.click(await screen.findByTestId("expand-toggle-m1"));
    const nestedCheckbox = (await screen.findByTestId(
      "checkbox-m1-prev"
    )) as HTMLInputElement;
    expect(nestedCheckbox.checked).toBe(false);

    userEvent.click(nestedCheckbox);
    expect(nestedCheckbox.checked).toBe(true);

    userEvent.click(nestedCheckbox);
    expect(nestedCheckbox.checked).toBe(false);
  });

  it("refetches with the new limit and resets to page 1 on limit change", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });
    mockAdminSearchMeasures.mockClear();
    const limitSelect = screen
      .getAllByRole("combobox")
      .find(
        (el) => el.getAttribute("aria-labelledby") === "pagination-limit-select"
      );
    expect(limitSelect).toBeTruthy();
    userEvent.click(limitSelect!);
    const option25 = (await screen.findAllByTestId("limit-option")).find(
      (el) => el.textContent === "25"
    );
    expect(option25).toBeTruthy();
    userEvent.click(option25!);

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        25,
        0,
        "lastModifiedAt",
        "DESC",
        expect.any(Object),
        expect.any(AbortController)
      );
    });
  });

  it("filter by a column and search measures based on criteria", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });

    const filterBy = screen.getByTestId("filter-by-select");
    const filterByDropDown = within(filterBy).getByRole("combobox", {
      hidden: true,
    });
    userEvent.click(filterByDropDown);

    const optionsList = await screen.findAllByRole("option");
    expect(optionsList).toHaveLength(5); // placeholder "-" + 4 columns

    userEvent.click(screen.getByTestId("filter-by-Model"));

    const input = screen.getByTestId("user-profile-measures-list-search-input");
    userEvent.type(input, "QI-Core");
    expect(input).toHaveValue("QI-Core");

    mockAdminSearchMeasures.mockClear();
    userEvent.click(screen.getByTestId("user-profile-measures-trigger-search"));

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        0,
        "lastModifiedAt",
        "DESC",
        { searchField: "QI-Core", optionalSearchProperties: ["model"] },
        expect.any(AbortController)
      );
    });
  });

  it("searches across all columns when no filter is selected", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });

    const input = screen.getByTestId("user-profile-measures-list-search-input");
    userEvent.type(input, "Owned");

    mockAdminSearchMeasures.mockClear();
    userEvent.click(screen.getByTestId("user-profile-measures-trigger-search"));

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        0,
        "lastModifiedAt",
        "DESC",
        {
          searchField: "Owned",
          optionalSearchProperties: ["measure", "version", "model", "cmsId"],
        },
        expect.any(AbortController)
      );
    });
  });

  it("shows 'No results were found' when a search yields no matches", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(screen.getByTestId("measure-name-m1-content")).toBeInTheDocument();
    });

    mockAdminSearchMeasures.mockResolvedValue(emptyPage);
    userEvent.type(
      screen.getByTestId("user-profile-measures-list-search-input"),
      "zzzz"
    );
    userEvent.click(screen.getByTestId("user-profile-measures-trigger-search"));

    await waitFor(() => {
      expect(screen.getByText("No results were found")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("measure-name-m1-content")
    ).not.toBeInTheDocument();
  });

  it("clears the search and refetches all measures when the X is clicked", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });

    const input = screen.getByTestId("user-profile-measures-list-search-input");
    userEvent.type(input, "Owned");
    userEvent.click(screen.getByTestId("user-profile-measures-trigger-search"));

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        0,
        "lastModifiedAt",
        "DESC",
        expect.objectContaining({ searchField: "Owned" }),
        expect.any(AbortController)
      );
    });

    mockAdminSearchMeasures.mockClear();
    userEvent.click(screen.getByTestId("user-profile-measures-clear-search"));

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "test_user",
        ["OWNED"],
        10,
        0,
        "lastModifiedAt",
        "DESC",
        { searchField: "", optionalSearchProperties: [] },
        expect.any(AbortController)
      );
    });
    expect(input).toHaveValue("");
  });

  it("hides the search/filter bar when the AdminUserProfile flag is off", async () => {
    mockUseFeatureFlags.mockReturnValue({ AdminUserProfile: false });
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });
    expect(screen.queryByTestId("search-filter-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("filter-by-select")).not.toBeInTheDocument();
  });

  describe("status chips", () => {
    it("renders the 'In Composite' chip for a component measure", async () => {
      const componentMeasure = {
        ...ownedMeasure,
        id: "mc",
        measureName: "Component Measure",
        version: "1.0.000",
        measureMetaData: { draft: false },
        component: true,
      };
      mockAdminSearchMeasures.mockResolvedValue(
        pageWith([componentMeasure], 1)
      );

      renderAt("/admin/userProfile/test_user");

      expect(await screen.findByText("In Composite")).toBeInTheDocument();
    });

    it("does not render the 'In Composite' chip for a non-component measure", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

      renderAt("/admin/userProfile/test_user");

      await screen.findByTestId("checkbox-m1");
      expect(screen.queryByText("In Composite")).not.toBeInTheDocument();
    });
  });

  describe("delete measure action", () => {
    it("hides the action center when the AdminUserProfile flag is off", async () => {
      mockUseFeatureFlags.mockReturnValue({ AdminUserProfile: false });
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

      renderAt("/admin/userProfile/test_user");

      await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());
      expect(screen.queryByTestId("action-center")).not.toBeInTheDocument();
    });

    it("disables Delete with no selection and shows 'Select measure to delete'", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

      renderAt("/admin/userProfile/test_user");

      const deleteBtn = await screen.findByTestId("delete-action-btn");
      expect(deleteBtn).toBeDisabled();
      userEvent.hover(deleteBtn.parentElement as HTMLElement);
      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "Select measure to delete"
      );
    });

    it("enables Delete for a single top-level draft and shows 'Delete measure'", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-m1"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.hover(deleteBtn);
      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "Delete measure"
      );
    });

    it("deletes a DRAFT via the regular soft-delete endpoint and shows success", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-m1"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.click(deleteBtn);

      const dialog = await screen.findByTestId("delete-dialog");
      expect(within(dialog).getByText("Delete Measure")).toBeInTheDocument();
      expect(within(dialog).getByText(/draft of/)).toBeInTheDocument();
      expect(within(dialog).getByText("Owned Measure A")).toBeInTheDocument();
      expect(
        within(dialog).getByText(/This action cannot be undone/i)
      ).toBeInTheDocument();

      userEvent.click(screen.getByTestId("delete-dialog-continue-button"));

      // Drafts use the regular soft-delete endpoint, not the admin hard delete.
      await waitFor(() => expect(mockDeleteMeasure).toHaveBeenCalledWith("m1"));
      expect(mockAdminDeleteMeasure).not.toHaveBeenCalled();
      expect(
        await screen.findByText("Measure successfully deleted")
      ).toBeInTheDocument();
    });

    it("shows version wording and deletes a versioned measure with the owner harpId", async () => {
      const versioned = {
        ...ownedMeasure,
        id: "mv",
        measureName: "Versioned Measure",
        version: "2.0.000",
        measureMetaData: { draft: false },
        measureSet: { ...ownedMeasure.measureSet, owner: "owner_x" },
      };
      mockAdminSearchMeasures.mockResolvedValue(pageWith([versioned], 1));

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-mv"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.click(deleteBtn);

      const dialog = await screen.findByTestId("delete-dialog");
      expect(
        within(dialog).getByText(/version 2\.0\.000 of/)
      ).toBeInTheDocument();

      userEvent.click(screen.getByTestId("delete-dialog-continue-button"));
      await waitFor(() =>
        expect(mockAdminDeleteMeasure).toHaveBeenCalledWith("mv", "owner_x")
      );
    });

    it("deletes a DRAFT composite measure via the regular soft-delete endpoint", async () => {
      const draftComposite = {
        ...ownedMeasure,
        id: "mdc",
        measureName: "Draft Composite",
        measureMetaData: { draft: true, composite: true },
      };
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftComposite], 1));

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-mdc"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.click(deleteBtn);

      const dialog = await screen.findByTestId("delete-dialog");
      expect(within(dialog).getByText(/draft of/)).toBeInTheDocument();
      expect(within(dialog).getByText("Draft Composite")).toBeInTheDocument();

      userEvent.click(screen.getByTestId("delete-dialog-continue-button"));
      await waitFor(() =>
        expect(mockDeleteMeasure).toHaveBeenCalledWith("mdc")
      );
      expect(mockAdminDeleteMeasure).not.toHaveBeenCalled();
    });

    it("shows an error toast when the delete fails", async () => {
      const draftMeasure = {
        ...ownedMeasure,
        id: "mdf",
        measureName: "Draft Fail",
        measureMetaData: { draft: true },
      };
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      mockDeleteMeasure.mockRejectedValueOnce(new Error("delete failed"));

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-mdf"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.click(deleteBtn);

      await screen.findByTestId("delete-dialog");
      userEvent.click(screen.getByTestId("delete-dialog-continue-button"));

      await waitFor(() =>
        expect(mockDeleteMeasure).toHaveBeenCalledWith("mdf")
      );
      expect(
        await screen.findByTestId("delete-measure-error-message")
      ).toHaveTextContent("delete failed");
    });

    it("deletes a VERSIONED composite measure via the admin hard-delete endpoint", async () => {
      const versionedComposite = {
        ...ownedMeasure,
        id: "mvc",
        measureName: "Versioned Composite",
        version: "3.0.000",
        measureMetaData: { draft: false, composite: true },
        measureSet: { ...ownedMeasure.measureSet, owner: "owner_z" },
      };
      mockAdminSearchMeasures.mockResolvedValue(
        pageWith([versionedComposite], 1)
      );

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-mvc"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.click(deleteBtn);

      const dialog = await screen.findByTestId("delete-dialog");
      expect(
        within(dialog).getByText(/version 3\.0\.000 of/)
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText("Versioned Composite")
      ).toBeInTheDocument();

      userEvent.click(screen.getByTestId("delete-dialog-continue-button"));
      await waitFor(() =>
        expect(mockAdminDeleteMeasure).toHaveBeenCalledWith("mvc", "owner_z")
      );
      expect(mockDeleteMeasure).not.toHaveBeenCalled();
    });

    it("closes the dialog without deleting when Cancel is clicked", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-m1"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.click(deleteBtn);

      await screen.findByTestId("delete-dialog");
      userEvent.click(screen.getByTestId("delete-dialog-cancel-button"));

      await waitFor(() =>
        expect(screen.queryByTestId("delete-dialog")).not.toBeInTheDocument()
      );
      expect(mockAdminDeleteMeasure).not.toHaveBeenCalled();
    });

    it("disables Delete when more than one measure is selected", async () => {
      const second = {
        ...ownedMeasure,
        id: "m3",
        measureName: "Owned Measure C",
      };
      mockAdminSearchMeasures.mockResolvedValue(
        pageWith([ownedMeasure, second], 2)
      );

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("checkbox-m3"));

      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeDisabled());
    });

    it("disables Delete when only an expanded (non-latest) version is selected", async () => {
      const parentMeasure = {
        ...ownedMeasure,
        hasAssociatedMeasures: true,
        measureSet: { ...ownedMeasure.measureSet, measureSetId: "set-1" },
        measureSetId: "set-1",
      };
      const nestedMeasure = {
        id: "m1-prev",
        measureName: "Owned Measure A v0.9",
        version: "0.9.000",
        model: "QI-Core v4.1.1",
        lastModifiedAt: "2026-04-01T12:00:00Z",
        measureMetaData: { draft: false },
        measureSet: {
          acls: [],
          cmsId: 42,
          owner: "test_user",
          measureSetId: "set-1",
        },
        measureSetId: "set-1",
      };
      mockAdminSearchMeasures.mockResolvedValue(pageWith([parentMeasure], 1));
      mockGetMeasuresByMeasureSetId.mockResolvedValue([
        parentMeasure,
        nestedMeasure,
      ]);

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("expand-toggle-m1"));
      userEvent.click(await screen.findByTestId("checkbox-m1-prev"));

      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeDisabled());
    });

    it("disables Delete with a composite tooltip when a single component measure is selected", async () => {
      const componentMeasure = {
        ...ownedMeasure,
        id: "mc",
        measureName: "Component Measure",
        version: "1.0.000",
        measureMetaData: { draft: false },
        component: true,
      };
      mockAdminSearchMeasures.mockResolvedValue(
        pageWith([componentMeasure], 1)
      );

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-mc"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeDisabled());

      userEvent.hover(deleteBtn.parentElement as HTMLElement);
      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "This measure is used in a composite measure and cannot be deleted until it is removed from any composite measures for which it is a component."
      );
    });

    it("keeps Delete enabled for a single versioned non-component measure", async () => {
      const versionedNonComponent = {
        ...ownedMeasure,
        id: "mvn",
        measureName: "Versioned Non-Component",
        version: "2.0.000",
        measureMetaData: { draft: false },
        component: false,
      };
      mockAdminSearchMeasures.mockResolvedValue(
        pageWith([versionedNonComponent], 1)
      );

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-mvn"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
    });
  });

  describe("export / view HR / history / compare actions", () => {
    const draftMeasure = {
      id: "m1",
      measureName: "Owned Measure A",
      version: "1.0.000",
      model: "QI-Core v4.1.1",
      measureSetId: "set-1",
      lastModifiedAt: "2026-05-01T12:00:00Z",
      measureMetaData: { draft: true },
      measureSet: { acls: [], cmsId: 42, owner: "test_user" },
    };
    const sameSetSibling = {
      ...draftMeasure,
      id: "m1b",
      measureName: "Owned Measure A v0.9",
      version: "0.9.000",
      measureSetId: "set-1",
      measureMetaData: { draft: false },
    };
    const lastExportSeverity = () => {
      const call = mockExportMeasure.mock.calls[0];
      return call[call.length - 1];
    };

    it("shows the four action icons when the flag is on", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      renderAt("/admin/userProfile/test_user");
      expect(
        await screen.findByTestId("export-action-btn")
      ).toBeInTheDocument();
      expect(screen.getByTestId("view-hr-action-btn")).toBeInTheDocument();
      expect(screen.getByTestId("history-action-btn")).toBeInTheDocument();
      expect(
        screen.getByTestId("compare-versions-action-btn")
      ).toBeInTheDocument();
    });

    // Icon behavior is unit-tested in @madie/madie-util; these cover only
    // the admin wiring.

    it("exports the full package via the 'Export' option (Info severity)", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("export-action-btn"));
      userEvent.click(await screen.findByTestId("export-option"));
      await waitFor(() => expect(mockFetchMeasure).toHaveBeenCalledWith("m1"));
      await waitFor(() => expect(mockExportMeasure).toHaveBeenCalled());
      expect(lastExportSeverity()).toBe("Info");
    });

    it("exports without warnings via the 'Export for Publishing' option (Error severity)", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("export-action-btn"));
      userEvent.click(await screen.findByTestId("export-publishing-option"));
      await waitFor(() => expect(mockExportMeasure).toHaveBeenCalled());
      expect(lastExportSeverity()).toBe("Error");
    });

    it("opens the View Human Readable dialog", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("view-hr-action-btn"));
      expect(
        await screen.findByTestId("view-human-readable-modal")
      ).toBeInTheDocument();
    });

    it("opens the View History dialog", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("history-action-btn"));
      expect(
        await screen.findByTestId("view-measure-history-dialog")
      ).toBeInTheDocument();
    });

    it("opens the Compare dialog for two selected instances", async () => {
      mockAdminSearchMeasures.mockResolvedValue(
        pageWith([draftMeasure, sameSetSibling], 2)
      );
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("checkbox-m1b"));
      userEvent.click(await screen.findByTestId("compare-versions-action-btn"));
      expect(
        await screen.findByTestId("compare-versions-dialog")
      ).toBeInTheDocument();
    });

    it("shows a failure when the export measure fetch rejects", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      mockFetchMeasure.mockRejectedValueOnce(new Error("failed"));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("export-action-btn"));
      userEvent.click(await screen.findByTestId("export-option"));
      await waitFor(() => expect(mockFetchMeasure).toHaveBeenCalledWith("m1"));
      // fetch failed, so the download flow is never reached
      await waitFor(() => expect(mockExportMeasure).not.toHaveBeenCalled());
    });

    it("closes the export dialog when Continue is clicked", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      mockExportMeasure.mockImplementation(
        (_setFailure: any, setDownloadState: any) => {
          setDownloadState("failure");
          return Promise.resolve();
        }
      );
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("export-action-btn"));
      userEvent.click(await screen.findByTestId("export-option"));
      userEvent.click(await screen.findByTestId("export-continue-btn"));
      await waitFor(() =>
        expect(screen.queryByTestId("export-dialog")).not.toBeInTheDocument()
      );
    });

    it("aborts and closes the export dialog when Cancel is clicked", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      mockExportMeasure.mockImplementation(
        (_setFailure: any, setDownloadState: any) => {
          setDownloadState("failure");
          return Promise.resolve();
        }
      );
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("export-action-btn"));
      userEvent.click(await screen.findByTestId("export-option"));
      userEvent.click(await screen.findByTestId("export-cancel-btn"));
      await waitFor(() =>
        expect(screen.queryByTestId("export-dialog")).not.toBeInTheDocument()
      );
    });

    it("closes the View Human Readable dialog", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("view-hr-action-btn"));
      userEvent.click(await screen.findByTestId("view-hr-close-btn"));
      await waitFor(() =>
        expect(
          screen.queryByTestId("view-human-readable-modal")
        ).not.toBeInTheDocument()
      );
    });

    it("closes the View History dialog", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([draftMeasure], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("history-action-btn"));
      userEvent.click(await screen.findByTestId("view-history-close-btn"));
      await waitFor(() =>
        expect(
          screen.queryByTestId("view-measure-history-dialog")
        ).not.toBeInTheDocument()
      );
    });

    it("closes the Compare dialog", async () => {
      mockAdminSearchMeasures.mockResolvedValue(
        pageWith([draftMeasure, sameSetSibling], 2)
      );
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("checkbox-m1b"));
      userEvent.click(await screen.findByTestId("compare-versions-action-btn"));
      userEvent.click(await screen.findByTestId("compare-close-btn"));
      await waitFor(() =>
        expect(
          screen.queryByTestId("compare-versions-dialog")
        ).not.toBeInTheDocument()
      );
    });
  });

  describe("share / unshare actions", () => {
    const ownedMeasureRow = {
      id: "m1",
      measureName: "Owned Measure A",
      version: "1.0.000",
      model: "QI-Core v4.1.1",
      measureSetId: "set-1",
      lastModifiedAt: "2026-05-01T12:00:00Z",
      measureMetaData: { draft: true },
      measureSet: { acls: [], cmsId: 42, owner: "test_user" },
    };

    // Share behavior is unit-tested in @madie/madie-util; these cover only
    // the admin wiring (option per tab, save refresh).

    it("shows the Share/Unshare icon on the Owned tab when the flag is on", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasureRow], 1));
      renderAt("/admin/userProfile/test_user");
      expect(await screen.findByTestId("share-action-btn")).toBeInTheDocument();
    });

    it("does not render the Share/Unshare icon when the flag is off", async () => {
      mockUseFeatureFlags.mockReturnValue({ AdminUserProfile: false });
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasureRow], 1));
      renderAt("/admin/userProfile/test_user");
      expect(await screen.findByTestId("user-profile")).toBeInTheDocument();
      expect(screen.queryByTestId("share-action-btn")).not.toBeInTheDocument();
    });

    it("opens the share dialog with the 'Share With' option from the Owned tab", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasureRow], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("share-action-btn"));
      userEvent.click(await screen.findByTestId("share-option-share-with"));
      expect(await screen.findByTestId("share-dialog")).toHaveAttribute(
        "data-option",
        "Share With"
      );
    });

    it("opens the share dialog with the 'Unshare' option from the Owned tab", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasureRow], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("share-action-btn"));
      userEvent.click(await screen.findByTestId("share-option-unshare"));
      expect(await screen.findByTestId("share-dialog")).toHaveAttribute(
        "data-option",
        "Unshare"
      );
    });

    it("opens the 'UnshareFromMe' confirmation from the Shared tab", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasureRow], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("shared-measures-tab"));
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("share-action-btn"));
      userEvent.click(await screen.findByTestId("share-option-unshare"));
      expect(await screen.findByTestId("share-dialog")).toHaveAttribute(
        "data-option",
        "UnshareFromMe"
      );
    });

    it("refreshes the measure list after the share dialog saves", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasureRow], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("share-action-btn"));
      userEvent.click(await screen.findByTestId("share-option-share-with"));
      const callsBefore = mockAdminSearchMeasures.mock.calls.length;
      userEvent.click(await screen.findByTestId("share-save-btn"));
      await waitFor(() =>
        expect(mockAdminSearchMeasures.mock.calls.length).toBeGreaterThan(
          callsBefore
        )
      );
    });

    it("closes the share dialog on cancel", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasureRow], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("share-action-btn"));
      userEvent.click(await screen.findByTestId("share-option-share-with"));
      userEvent.click(await screen.findByTestId("share-close-btn"));
      await waitFor(() =>
        expect(screen.queryByTestId("share-dialog")).not.toBeInTheDocument()
      );
    });

    it("dismisses the toast via its close button", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasureRow], 1));
      renderAt("/admin/userProfile/test_user");
      userEvent.click(await screen.findByTestId("checkbox-m1"));
      userEvent.click(await screen.findByTestId("share-action-btn"));
      userEvent.click(await screen.findByTestId("share-option-share-with"));
      userEvent.click(await screen.findByTestId("share-save-btn"));
      userEvent.click(await screen.findByTestId("close-toast-button"));
      await waitFor(() =>
        expect(
          screen.queryByTestId("close-toast-button")
        ).not.toBeInTheDocument()
      );
    });
  });
});
