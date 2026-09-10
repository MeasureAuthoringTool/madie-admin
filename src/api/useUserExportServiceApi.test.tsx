import * as React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import useUserExportServiceApi, {
  UserExportServiceApi,
} from "./useUserExportServiceApi";
import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";

jest.mock("./axios-instance", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));
jest.mock("./useServiceConfig");

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const mockedGet = axios.get as jest.Mock;
const mockedUseServiceConfig = useServiceConfig as jest.Mock;

describe("UserExportServiceApi", () => {
  const getAccessToken = () => "test-token";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests the export endpoint and returns the blob on success", async () => {
    const blob = new Blob(["excel"], { type: XLSX_CONTENT_TYPE });
    mockedGet.mockResolvedValue({ data: blob });

    const api = new UserExportServiceApi(
      "https://admin.example.com",
      getAccessToken
    );
    const result = await api.exportFullUserList();

    expect(result).toBe(blob);
    expect(mockedGet).toHaveBeenCalledWith(
      "https://admin.example.com/admin/users/export",
      {
        headers: {
          Authorization: "Bearer test-token",
          Accept: XLSX_CONTENT_TYPE,
        },
        responseType: "blob",
        signal: undefined,
      }
    );
  });

  it("forwards the abort signal when provided", async () => {
    mockedGet.mockResolvedValue({ data: new Blob() });
    const controller = new AbortController();

    const api = new UserExportServiceApi(
      "https://admin.example.com",
      getAccessToken
    );
    await api.exportFullUserList(controller.signal);

    expect(mockedGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    );
  });

  it("throws a friendly error and logs when the request fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockedGet.mockRejectedValue(new Error("network down"));

    const api = new UserExportServiceApi(
      "https://admin.example.com",
      getAccessToken
    );

    await expect(api.exportFullUserList()).rejects.toThrow(
      "Unable to export the full user list."
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Unable to export the full user list",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe("useUserExportServiceApi hook", () => {
  const TestComponent = () => {
    const api = useUserExportServiceApi();
    return (
      <button
        data-testid="do-export"
        onClick={() => {
          api.exportFullUserList();
        }}
      >
        export
      </button>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue({ data: new Blob() });
  });

  it("builds the service using adminService.baseUrl from config", async () => {
    mockedUseServiceConfig.mockReturnValue({
      adminService: { baseUrl: "https://admin.example.com" },
    });

    render(<TestComponent />);
    fireEvent.click(screen.getByTestId("do-export"));

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        "https://admin.example.com/admin/users/export",
        expect.anything()
      )
    );
  });

  it("falls back to an empty base URL when the config is missing", async () => {
    mockedUseServiceConfig.mockReturnValue(null);

    render(<TestComponent />);
    fireEvent.click(screen.getByTestId("do-export"));

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith(
        "/admin/users/export",
        expect.anything()
      )
    );
  });
});
