import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import UserProfile from "./UserProfile";

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock("@madie/madie-util", () => ({
  useUserServiceApi: jest.fn(() => ({
    getUser: (...args: unknown[]) => mockGetUser(...args),
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

describe("UserProfile", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockUpdateUser.mockReset();
    mockGetUser.mockResolvedValue(null);
  });

  it("renders the user-profile card structure", () => {
    renderAt("/admin/userProfile/some_harp_id");
    expect(screen.getByTestId("user-profile")).toBeInTheDocument();
    expect(
      screen.getByTestId("user-profile").querySelector(".user-profile-header")
    ).toBeInTheDocument();
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

  it("clears adminUserStore when the fetch fails with a non-abort error", async () => {
    mockGetUser.mockRejectedValue(new Error("Network error"));

    renderAt("/admin/userProfile/missing_user");

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith(
        "missing_user",
        expect.any(AbortSignal)
      );
    });
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(null);
    });
  });

  it("does not clear adminUserStore when the fetch is aborted", async () => {
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

  it("does not clear adminUserStore when the fetch is canceled via ERR_CANCELED", async () => {
    const canceled = Object.assign(new Error("canceled"), {
      code: "ERR_CANCELED",
    });
    mockGetUser.mockRejectedValue(canceled);

    renderAt("/admin/userProfile/any_user");

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockUpdateUser).not.toHaveBeenCalledWith(null);
  });

  it("aborts the in-flight user request on unmount", async () => {
    mockGetUser.mockImplementation(
      (_harpId: string, signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );

    const { unmount } = renderAt("/admin/userProfile/lila_kensington");

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    const signal = mockGetUser.mock.calls[0][1] as AbortSignal;
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("renders the Owned and Shared Measures tabs", () => {
    renderAt("/admin/userProfile/lila_kensington");
    expect(screen.getByTestId("owned-measures-tab")).toHaveTextContent(
      "Owned Measures (0)"
    );
    expect(screen.getByTestId("shared-measures-tab")).toHaveTextContent(
      "Shared Measures (0)"
    );
  });

  it("renders the table column headers", () => {
    renderAt("/admin/userProfile/lila_kensington");
    expect(screen.getByText("Measure")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Shared")).toBeInTheDocument();
    expect(screen.getByText("CMS ID")).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();
  });

  it("keeps the Shared column rendered on both tabs to avoid column reflow", () => {
    renderAt("/admin/userProfile/lila_kensington");
    expect(screen.getByText("Shared")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("shared-measures-tab"));

    expect(screen.getByText("Shared")).toBeInTheDocument();
  });
});
