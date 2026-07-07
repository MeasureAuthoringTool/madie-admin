import * as React from "react";
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
const mockUseFeatureFlags = jest.fn(() => ({ AdminUserProfile: true }));

jest.mock("@madie/madie-util", () => ({
  useUserServiceApi: jest.fn(() => ({
    getUser: (...args: unknown[]) => mockGetUser(...args),
  })),
  useMeasureServiceApi: jest.fn(() => ({
    adminSearchMeasuresForUser: (...args: unknown[]) =>
      mockAdminSearchMeasures(...args),
    getMeasuresByMeasureSetId: (...args: unknown[]) =>
      mockGetMeasuresByMeasureSetId(...args),
  })),
  useFeatureFlags: () => mockUseFeatureFlags(),
  adminUserStore: {
    state: null,
    updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  },
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
  measureSet: { acls: [{ userId: "x" }], cmsId: 42 },
};

const sharedMeasure = {
  id: "m2",
  measureName: "Shared Measure B",
  version: "2.1.000",
  model: "QDM v5.6",
  lastModifiedAt: "2026-04-15T08:00:00Z",
  measureMetaData: { draft: false },
  measureSet: { acls: [], cmsId: 7 },
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
    mockUseFeatureFlags.mockReset();
    mockUseFeatureFlags.mockReturnValue({ AdminUserProfile: true });
    mockGetUser.mockResolvedValue(null);
    mockAdminSearchMeasures.mockResolvedValue(emptyPage);
    mockGetMeasuresByMeasureSetId.mockResolvedValue([]);
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
    mockAdminSearchMeasures.mockRejectedValue(new Error("boom"));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(screen.getByTestId("measures-error-message")).toHaveTextContent(
        "boom"
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
});
