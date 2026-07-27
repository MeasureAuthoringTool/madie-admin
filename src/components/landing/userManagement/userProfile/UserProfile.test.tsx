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
import UserProfile, { ownershipForTab } from "./UserProfile";

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockAdminSearchMeasures = jest.fn();
const mockGetMeasuresByMeasureSetId = jest.fn();
const mockAdminDeleteMeasure = jest.fn();
const mockDeleteMeasure = jest.fn();
const mockFetchCqlLibraries = jest.fn();
const mockGetLibrariesByLibrarySetId = jest.fn();
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
    adminDeleteMeasure: (...args: unknown[]) => mockAdminDeleteMeasure(...args),
    deleteMeasure: (...args: unknown[]) => mockDeleteMeasure(...args),
  })),
  useCqlLibraryServiceApi: jest.fn(() => ({
    fetchCqlLibraries: (...args: unknown[]) => mockFetchCqlLibraries(...args),
    getLibrariesByLibrarySetId: (...args: unknown[]) =>
      mockGetLibrariesByLibrarySetId(...args),
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

const ownedLibrary = {
  id: "lib1",
  cqlLibraryName: "Owned Library A",
  version: "1.0.000",
  model: "QI-Core v4.1.1",
  draft: true,
  lastModifiedAt: "2026-05-11T12:00:00Z",
  librarySet: {
    librarySetId: "library-set-1",
    acls: [{ userId: "x", roles: ["SHARED"] }],
  },
  librarySetId: "library-set-1",
  hasAssociatedLibraries: true,
};

const sharedLibrary = {
  id: "lib2",
  cqlLibraryName: "Shared Library B",
  version: "2.0.000",
  model: "QDM v5.6",
  draft: false,
  ownerDisplayName: "Library Owner",
  lastModifiedAt: "2026-05-09T12:00:00Z",
  librarySet: {
    librarySetId: "library-set-2",
    acls: [],
  },
  librarySetId: "library-set-2",
  hasAssociatedLibraries: true,
};

const pageWith = (rows: any[], totalElements: number = rows.length) => ({
  content: rows,
  totalPages: 1,
  totalElements,
  numberOfElements: rows.length,
  pageable: { offset: 0 },
});

describe("UserProfile", () => {
  it("falls back to OWNED_MEASURE for unknown tab index", () => {
    expect(ownershipForTab(99)).toBe("OWNED_MEASURE");
  });

  beforeEach(() => {
    mockGetUser.mockReset();
    mockUpdateUser.mockReset();
    mockAdminSearchMeasures.mockReset();
    mockGetMeasuresByMeasureSetId.mockReset();
    mockAdminDeleteMeasure.mockReset();
    mockDeleteMeasure.mockReset();
    mockFetchCqlLibraries.mockReset();
    mockGetLibrariesByLibrarySetId.mockReset();
    mockUseFeatureFlags.mockReset();
    mockUseFeatureFlags.mockReturnValue({ AdminUserProfile: true });
    mockGetUser.mockResolvedValue(null);
    mockAdminSearchMeasures.mockResolvedValue(emptyPage);
    mockGetMeasuresByMeasureSetId.mockResolvedValue([]);
    mockFetchCqlLibraries.mockResolvedValue(emptyPage);
    mockGetLibrariesByLibrarySetId.mockResolvedValue([]);
    mockAdminDeleteMeasure.mockResolvedValue({ status: 200 });
    mockDeleteMeasure.mockResolvedValue({ status: 200 });
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

  it("renders Owned Libraries tab with the library set count", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries
      .mockResolvedValueOnce(pageWith([], 5))
      .mockResolvedValueOnce(pageWith([], 2));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "OWNED",
        1,
        0,
        { searchField: "", optionalSearchProperties: [] },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
    });
    expect(screen.getByTestId("owned-libraries-tab")).toHaveTextContent(
      "Owned Libraries (5)"
    );
    expect(screen.getByTestId("shared-libraries-tab")).toHaveTextContent(
      "Shared Libraries (2)"
    );
  });

  it("loads owned libraries on tab click using Updated DESC as default sort", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockResolvedValue(pageWith([ownedLibrary], 3));

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    mockFetchCqlLibraries.mockClear();
    userEvent.click(screen.getByTestId("owned-libraries-tab"));

    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "OWNED",
        10,
        0,
        { searchField: "", optionalSearchProperties: [] },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
    });

    expect(
      await screen.findByTestId("library-name-lib1-content")
    ).toHaveTextContent("Owned Library A");
    expect(screen.getByTestId("library-action-lib1")).toBeInTheDocument();
  });

  it("expands a library row and loads nested versions from library set hierarchy", async () => {
    const nestedLibrary = {
      ...ownedLibrary,
      id: "lib1-prev",
      version: "0.9.000",
      draft: false,
      hasAssociatedLibraries: false,
    };
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockResolvedValue(pageWith([ownedLibrary], 1));
    mockGetLibrariesByLibrarySetId.mockResolvedValue([
      ownedLibrary,
      nestedLibrary,
    ]);

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));
    userEvent.click(await screen.findByTestId("expand-library-toggle-lib1"));

    await waitFor(() => {
      expect(mockGetLibrariesByLibrarySetId).toHaveBeenCalledWith(
        "library-set-1",
        true,
        { searchField: "", optionalSearchProperties: [] }
      );
    });

    expect(
      await screen.findByTestId("expanded-library-row-lib1-prev")
    ).toBeInTheDocument();
  });

  it("loads shared libraries on tab click using Updated DESC as default sort", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries
      .mockResolvedValueOnce(pageWith([], 5))
      .mockResolvedValueOnce(pageWith([], 4))
      .mockResolvedValueOnce(pageWith([sharedLibrary], 4));

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    mockFetchCqlLibraries.mockClear();
    userEvent.click(screen.getByTestId("shared-libraries-tab"));

    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "SHARED",
        10,
        0,
        { searchField: "", optionalSearchProperties: [] },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
    });

    expect(
      await screen.findByTestId("library-name-lib2-content")
    ).toHaveTextContent("Shared Library B");
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Library Owner")).toBeInTheDocument();
    expect(screen.queryByText("Shared")).not.toBeInTheDocument();
    expect(screen.getByTestId("library-action-lib2")).toBeInTheDocument();
  });

  it("sorts libraries by Library column ASC then DESC and reverts to Updated default", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries
      .mockResolvedValueOnce(pageWith([], 5))
      .mockResolvedValueOnce(pageWith([], 2))
      .mockResolvedValue(pageWith([ownedLibrary], 3));

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));
    await screen.findByTestId("library-name-lib1-content");

    mockFetchCqlLibraries.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "OWNED",
        10,
        0,
        { searchField: "", optionalSearchProperties: [] },
        "cqlLibraryName,false",
        expect.any(AbortSignal)
      );
    });

    mockFetchCqlLibraries.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "OWNED",
        10,
        0,
        { searchField: "", optionalSearchProperties: [] },
        "cqlLibraryName,true",
        expect.any(AbortSignal)
      );
    });

    mockFetchCqlLibraries.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "OWNED",
        10,
        0,
        { searchField: "", optionalSearchProperties: [] },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
    });
  });

  it("does not display library load error when library tab fetch is aborted", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";

    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries
      .mockResolvedValueOnce(pageWith([], 5))
      .mockResolvedValueOnce(pageWith([], 2))
      .mockRejectedValueOnce(abortError);

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));

    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "OWNED",
        10,
        0,
        { searchField: "", optionalSearchProperties: [] },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
    });
    expect(
      screen.queryByTestId("measures-error-message")
    ).not.toBeInTheDocument();
  });

  it("logs an error when loading library counts fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries
      .mockRejectedValueOnce(new Error("count failure"))
      .mockResolvedValueOnce(pageWith([], 0));

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Unable to load library counts",
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("shows a fallback error when library loading fails without an error message", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries
      .mockResolvedValueOnce(pageWith([], 1))
      .mockResolvedValueOnce(pageWith([], 1))
      .mockRejectedValueOnce({});

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));

    await waitFor(() => {
      expect(screen.getByTestId("measures-error-message")).toHaveTextContent(
        "Unable to load libraries"
      );
    });
  });

  it("expands a shared library row and loads nested versions from library set hierarchy", async () => {
    const nestedSharedLibrary = {
      ...sharedLibrary,
      id: "lib2-prev",
      version: "1.9.000",
      hasAssociatedLibraries: false,
    };
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries
      .mockResolvedValueOnce(pageWith([], 5))
      .mockResolvedValueOnce(pageWith([], 4))
      .mockResolvedValueOnce(pageWith([sharedLibrary], 1));
    mockGetLibrariesByLibrarySetId.mockResolvedValue([
      sharedLibrary,
      nestedSharedLibrary,
    ]);

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("shared-libraries-tab"));
    userEvent.click(await screen.findByTestId("expand-library-toggle-lib2"));

    await waitFor(() => {
      expect(mockGetLibrariesByLibrarySetId).toHaveBeenCalledWith(
        "library-set-2",
        true,
        { searchField: "", optionalSearchProperties: [] }
      );
    });

    expect(
      await screen.findByTestId("expanded-library-row-lib2-prev")
    ).toBeInTheDocument();
  });

  it("shows an error message when the nested-libraries fetch fails", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries
      .mockResolvedValueOnce(pageWith([], 5))
      .mockResolvedValueOnce(pageWith([], 2))
      .mockResolvedValueOnce(pageWith([ownedLibrary], 1));
    mockGetLibrariesByLibrarySetId.mockRejectedValue(
      new Error("nested library fetch failed")
    );

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));
    userEvent.click(await screen.findByTestId("expand-library-toggle-lib1"));

    await waitFor(() => {
      expect(screen.getByTestId("measures-error-message")).toHaveTextContent(
        "Unable to load related nested libraries"
      );
    });
    expect(
      screen.queryByTestId("expanded-library-row-lib1-prev")
    ).not.toBeInTheDocument();
  });

  it("searches owned libraries across all library fields when no filter is selected", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockImplementation(
      (ownership: string, _limit: number, _page: number, criteria: any) => {
        if (ownership === "SHARED") return Promise.resolve(pageWith([], 0));
        if (criteria?.searchField === "Owned") {
          return Promise.resolve(pageWith([ownedLibrary], 1));
        }
        return Promise.resolve(pageWith([ownedLibrary], 1));
      }
    );

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));
    await screen.findByTestId("library-name-lib1-content");

    mockFetchCqlLibraries.mockClear();
    userEvent.type(
      screen.getByTestId("user-profile-measures-list-search-input"),
      "Owned"
    );
    userEvent.click(screen.getByTestId("user-profile-measures-trigger-search"));

    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "OWNED",
        10,
        0,
        {
          searchField: "Owned",
          optionalSearchProperties: ["library", "version", "model", "cmsId"],
        },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
    });
  });

  it("searches owned libraries by selected filter", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockImplementation(
      (ownership: string, _limit: number, _page: number, criteria: any) => {
        if (ownership === "SHARED") return Promise.resolve(pageWith([], 0));
        if (
          criteria?.searchField === "QI-Core" &&
          criteria?.optionalSearchProperties?.[0] === "model"
        ) {
          return Promise.resolve(pageWith([ownedLibrary], 1));
        }
        return Promise.resolve(pageWith([ownedLibrary], 1));
      }
    );

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));
    await screen.findByTestId("library-name-lib1-content");

    const filterBy = screen.getByTestId("filter-by-select");
    const filterByDropDown = within(filterBy).getByRole("combobox", {
      hidden: true,
    });
    userEvent.click(filterByDropDown);
    userEvent.click(screen.getByTestId("filter-by-Model"));

    mockFetchCqlLibraries.mockClear();
    userEvent.type(
      screen.getByTestId("user-profile-measures-list-search-input"),
      "QI-Core"
    );
    userEvent.click(screen.getByTestId("user-profile-measures-trigger-search"));

    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "OWNED",
        10,
        0,
        {
          searchField: "QI-Core",
          optionalSearchProperties: ["model"],
        },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
    });
  });

  it("shows no-results message on shared libraries search miss", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockImplementation(
      (ownership: string, _limit: number, _page: number, criteria: any) => {
        if (ownership === "OWNED") return Promise.resolve(pageWith([], 1));
        if (criteria?.searchField === "zzzz") return Promise.resolve(emptyPage);
        return Promise.resolve(pageWith([sharedLibrary], 1));
      }
    );

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("shared-libraries-tab"));
    await screen.findByTestId("library-name-lib2-content");

    mockFetchCqlLibraries.mockClear();
    userEvent.type(
      screen.getByTestId("user-profile-measures-list-search-input"),
      "zzzz"
    );
    userEvent.click(screen.getByTestId("user-profile-measures-trigger-search"));

    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "SHARED",
        10,
        0,
        {
          searchField: "zzzz",
          optionalSearchProperties: ["library", "version", "model", "cmsId"],
        },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
      expect(screen.getByText("No results were found")).toBeInTheDocument();
    });
  });

  it("clears shared libraries filter and search when clear X is clicked", async () => {
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockImplementation(
      (ownership: string, _limit: number, _page: number, criteria: any) => {
        if (ownership === "OWNED") return Promise.resolve(pageWith([], 1));
        if (criteria?.searchField === "miss") return Promise.resolve(emptyPage);
        return Promise.resolve(pageWith([sharedLibrary], 1));
      }
    );

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("shared-libraries-tab"));
    await screen.findByTestId("library-name-lib2-content");

    const filterBy = screen.getByTestId("filter-by-select");
    const filterByDropDown = within(filterBy).getByRole("combobox", {
      hidden: true,
    });
    userEvent.click(filterByDropDown);
    userEvent.click(screen.getByTestId("filter-by-Model"));

    userEvent.type(
      screen.getByTestId("user-profile-measures-list-search-input"),
      "miss"
    );
    userEvent.click(screen.getByTestId("user-profile-measures-trigger-search"));
    await waitFor(() => {
      expect(screen.getByText("No results were found")).toBeInTheDocument();
    });

    mockFetchCqlLibraries.mockClear();
    userEvent.click(screen.getByTestId("user-profile-measures-clear-search"));

    await waitFor(() => {
      expect(mockFetchCqlLibraries).toHaveBeenCalledWith(
        "SHARED",
        10,
        0,
        { searchField: "", optionalSearchProperties: [] },
        "lastModifiedAt,false",
        expect.any(AbortSignal)
      );
    });
    expect(
      await screen.findByTestId("library-name-lib2-content")
    ).toBeInTheDocument();
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

  it("uses fallback message when measure search rejects without an Error object", async () => {
    mockAdminSearchMeasures.mockRejectedValue("bad-request");

    renderAt("/admin/userProfile/test_user");

    await waitFor(() => {
      expect(screen.getByTestId("measures-error-message")).toHaveTextContent(
        "Unable to load measures"
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

  it("collapses an expanded library row when the toggle is clicked again", async () => {
    const nestedLibrary = {
      ...ownedLibrary,
      id: "lib1-prev",
      version: "0.9.000",
      draft: false,
      hasAssociatedLibraries: false,
    };
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockResolvedValue(pageWith([ownedLibrary], 1));
    mockGetLibrariesByLibrarySetId.mockResolvedValue([
      ownedLibrary,
      nestedLibrary,
    ]);

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));
    userEvent.click(await screen.findByTestId("expand-library-toggle-lib1"));
    expect(
      await screen.findByTestId("expanded-library-row-lib1-prev")
    ).toBeInTheDocument();

    mockGetLibrariesByLibrarySetId.mockClear();
    userEvent.click(await screen.findByTestId("expand-library-toggle-lib1"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("expanded-library-row-lib1-prev")
      ).not.toBeInTheDocument();
    });
    expect(mockGetLibrariesByLibrarySetId).not.toHaveBeenCalled();
  });

  it("does not call nested-library API when expanded row has no librarySetId", async () => {
    const missingSetIdLibrary = {
      ...ownedLibrary,
      id: "lib-no-set",
      librarySetId: undefined,
      hasAssociatedLibraries: true,
    };
    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockResolvedValue(pageWith([missingSetIdLibrary], 1));

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));
    userEvent.click(
      await screen.findByTestId("expand-library-toggle-lib-no-set")
    );

    expect(mockGetLibrariesByLibrarySetId).not.toHaveBeenCalled();
  });

  it("does not show nested-library error when nested fetch is aborted", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";

    mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
    mockFetchCqlLibraries.mockResolvedValue(pageWith([ownedLibrary], 1));
    mockGetLibrariesByLibrarySetId.mockRejectedValue(abortError);

    renderAt("/admin/userProfile/test_user");
    await waitFor(() => expect(mockAdminSearchMeasures).toHaveBeenCalled());

    userEvent.click(screen.getByTestId("owned-libraries-tab"));
    userEvent.click(await screen.findByTestId("expand-library-toggle-lib1"));

    await waitFor(() => {
      expect(mockGetLibrariesByLibrarySetId).toHaveBeenCalled();
    });
    expect(
      screen.queryByText("Unable to load related nested libraries")
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

    it("closes the success toast when the close button is clicked", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-m1"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.click(deleteBtn);

      await screen.findByTestId("delete-dialog");
      userEvent.click(screen.getByTestId("delete-dialog-continue-button"));

      await screen.findByTestId("delete-measure-success-message");
      userEvent.click(screen.getByTestId("close-toast-button"));

      await waitFor(() => {
        expect(
          screen.queryByTestId("delete-measure-success-message")
        ).not.toBeInTheDocument();
      });
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

    it("shows a fallback delete error toast when delete fails without an error message", async () => {
      mockAdminSearchMeasures.mockResolvedValue(pageWith([ownedMeasure], 1));
      mockDeleteMeasure.mockRejectedValue({});

      renderAt("/admin/userProfile/test_user");

      userEvent.click(await screen.findByTestId("checkbox-m1"));
      const deleteBtn = await screen.findByTestId("delete-action-btn");
      await waitFor(() => expect(deleteBtn).toBeEnabled());
      userEvent.click(deleteBtn);

      await screen.findByTestId("delete-dialog");
      userEvent.click(screen.getByTestId("delete-dialog-continue-button"));

      await waitFor(() => {
        expect(
          screen.getByTestId("delete-measure-error-message")
        ).toHaveTextContent("Unable to delete measure");
      });
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
});
