import axios from "./axios-instance";
import useTerminologyServiceApi, {
  TerminologyServiceApi,
} from "./useTerminologyServiceApi";
import { useOktaTokens, useServiceConfig } from "@madie/madie-util";

jest.mock("./axios-instance");

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(),
  useServiceConfig: jest.fn(),
}));

describe("TerminologyServiceApi", () => {
  let terminologyService: TerminologyServiceApi;
  const getAccessToken = jest.fn().mockReturnValue("test-token");

  beforeEach(() => {
    jest.clearAllMocks();
    getAccessToken.mockReturnValue("test-token");
    terminologyService = new TerminologyServiceApi(
      "http://test.url",
      getAccessToken
    );
  });

  describe("updateValueSets", () => {
    it("calls the update endpoint with no ig/version params", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({ status: 202 });

      await terminologyService.updateValueSets();

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/implementation-guides/update-value-sets",
        {
          headers: { Authorization: "Bearer test-token" },
          params: { ig: undefined, version: undefined },
        }
      );
    });

    it("passes ig and version when provided", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({ status: 202 });

      await terminologyService.updateValueSets("QICore", "4.1.1");

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/implementation-guides/update-value-sets",
        {
          headers: { Authorization: "Bearer test-token" },
          params: { ig: "QICore", version: "4.1.1" },
        }
      );
    });

    it("passes only ig when version is omitted", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({ status: 202 });

      await terminologyService.updateValueSets("QICore");

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/implementation-guides/update-value-sets",
        {
          headers: { Authorization: "Bearer test-token" },
          params: { ig: "QICore", version: undefined },
        }
      );
    });

    it("uses the latest access token on each call", async () => {
      const tokenFn = jest
        .fn()
        .mockReturnValueOnce("token-1")
        .mockReturnValueOnce("token-2");
      const service = new TerminologyServiceApi("http://test.url", tokenFn);
      (axios.get as jest.Mock).mockResolvedValue({ status: 202 });

      await service.updateValueSets();
      await service.updateValueSets();

      expect(axios.get).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: "Bearer token-1" },
        })
      );
      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: "Bearer token-2" },
        })
      );
    });

    it("throws a friendly error when the request fails without a server message", async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce({ response: {} });

      await expect(terminologyService.updateValueSets()).rejects.toThrow(
        "An error occurred while updating Value Sets. Please try again. If the error persists, please contact the help desk."
      );
    });

    it("appends the server message when the request fails with one", async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: "Service unavailable" } },
      });

      await expect(terminologyService.updateValueSets()).rejects.toThrow(
        "An error occurred while updating Value Sets. Please try again. If the error persists, please contact the help desk.: Service unavailable"
      );
    });

    it("falls back to the default message when error has no response", async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error("Network down"));

      await expect(terminologyService.updateValueSets()).rejects.toThrow(
        "An error occurred while updating Value Sets. Please try again. If the error persists, please contact the help desk."
      );
    });
  });
  describe("triggerUpdateCodeSystems", () => {
    it("calls the trigger endpoint with correct headers", async () => {
      (axios.post as jest.Mock).mockResolvedValueOnce({ status: 200 });

      await terminologyService.triggerUpdateCodeSystems();

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/trigger-code-system-refresh",
        {},
        {
          headers: { Authorization: "Bearer test-token" },
        }
      );
    });

    it("uses the latest access token on each call", async () => {
      const tokenFn = jest
        .fn()
        .mockReturnValueOnce("token-1")
        .mockReturnValueOnce("token-2");

      const service = new TerminologyServiceApi("http://test.url", tokenFn);

      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      await service.triggerUpdateCodeSystems();
      await service.triggerUpdateCodeSystems();

      expect(axios.post).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        {},
        expect.objectContaining({
          headers: { Authorization: "Bearer token-1" },
        })
      );

      expect(axios.post).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        {},
        expect.objectContaining({
          headers: { Authorization: "Bearer token-2" },
        })
      );
    });

    it("throws conflict message when status is 409", async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce({
        status: 409,

        response: {
          data: "Update Code System is already running. We have NOT started the job again",
        },
      });

      await expect(
        terminologyService.triggerUpdateCodeSystems()
      ).rejects.toThrow(
        "Update Code System is already running. We have NOT started the job again"
      );
    });

    it("throws default error message when request fails without server message", async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce({
        response: {},
      });

      await expect(
        terminologyService.triggerUpdateCodeSystems()
      ).rejects.toThrow(
        "An error occurred while triggering the code system refresh. Please try again. If the error persists, please contact the help desk."
      );
    });

    it("appends server message when present", async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: "Service unavailable" } },
      });

      await expect(
        terminologyService.triggerUpdateCodeSystems()
      ).rejects.toThrow(
        "An error occurred while triggering the code system refresh. Please try again. If the error persists, please contact the help desk.: Service unavailable"
      );
    });

    it("falls back to default message when no response exists", async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(
        terminologyService.triggerUpdateCodeSystems()
      ).rejects.toThrow(
        "An error occurred while triggering the code system refresh. Please try again. If the error persists, please contact the help desk."
      );
    });
  });
});

describe("useTerminologyServiceApi hook", () => {
  beforeEach(() => {
    (useOktaTokens as jest.Mock).mockReturnValue({
      getAccessToken: () => "hook-token",
    });
  });

  it("constructs an api instance with the configured terminology baseUrl", () => {
    (useServiceConfig as jest.Mock).mockReturnValue({
      terminologyService: { baseUrl: "http://terminology.example" },
    });

    const api = useTerminologyServiceApi();

    expect(api).toBeInstanceOf(TerminologyServiceApi);
    expect((api as any).baseUrl).toBe("http://terminology.example");
    expect((api as any).getAccessToken()).toBe("hook-token");
  });

  it("falls back to empty baseUrl when service config is null", () => {
    (useServiceConfig as jest.Mock).mockReturnValue(null);

    const api = useTerminologyServiceApi();

    expect((api as any).baseUrl).toBe("");
  });

  it("falls back to empty baseUrl when terminologyService is undefined", () => {
    (useServiceConfig as jest.Mock).mockReturnValue({});

    const api = useTerminologyServiceApi();

    expect((api as any).baseUrl).toBe("");
  });
});
