import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UserProfile from "./UserProfile";

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockAdminSearchMeasures = jest.fn();

jest.mock("@madie/madie-util", () => ({
  useUserServiceApi: jest.fn(() => ({
    getUser: (...args: unknown[]) => mockGetUser(...args),
  })),
  useMeasureServiceApi: jest.fn(() => ({
    adminSearchMeasuresForUser: (...args: unknown[]) =>
      mockAdminSearchMeasures(...args),
  })),
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
    mockGetUser.mockResolvedValue(null);
    mockAdminSearchMeasures.mockResolvedValue(emptyPage);
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
      harpId: "lila_kensington",
      firstName: "Lila",
      lastName: "Kensington",
      email: "l.kensington@cms.hhs.gov",
      status: "ACTIVE",
    };
    mockGetUser.mockResolvedValue(user);

    renderAt("/admin/userProfile/lila_kensington");

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith(
        "lila_kensington",
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

    renderAt("/admin/userProfile/lila_kensington");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "lila_kensington",
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

    renderAt("/admin/userProfile/lila_kensington");

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalled();
    });

    mockAdminSearchMeasures.mockClear();
    mockAdminSearchMeasures.mockResolvedValue(pageWith([sharedMeasure], 2));

    fireEvent.click(screen.getByTestId("shared-measures-tab"));

    await waitFor(() => {
      expect(mockAdminSearchMeasures).toHaveBeenCalledWith(
        "lila_kensington",
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

    renderAt("/admin/userProfile/lila_kensington");

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

    renderAt("/admin/userProfile/lila_kensington");

    await waitFor(() => {
      expect(screen.getByTestId("measures-error-message")).toHaveTextContent(
        "boom"
      );
    });
  });
});
