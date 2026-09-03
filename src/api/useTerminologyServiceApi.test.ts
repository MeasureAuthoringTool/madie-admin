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
  describe("getValueSets", () => {
    it("calls valuesets endpoint with default paging params", async () => {
      const responseData = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 10,
        numberOfElements: 0,
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: responseData,
      });

      const result = await terminologyService.getValueSets();

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/valuesets",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 0,
            limit: 10,
          },
        }
      );

      expect(result).toEqual(responseData);
    });

    it("calls valuesets endpoint with custom page and limit", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 2,
          size: 25,
          numberOfElements: 0,
        },
      });

      await terminologyService.getValueSets(2, 25);

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/valuesets",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 2,
            limit: 25,
          },
        }
      );
    });

    it("includes sortInfo when provided", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
        },
      });

      await terminologyService.getValueSets(1, 20, "lastUpdated,true");

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/valuesets",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 1,
            limit: 20,
            sortInfo: "lastUpdated,true",
          },
        }
      );
    });

    it("includes sortInfo when provided, and searchTermSupplied", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
        },
      });

      await terminologyService.getValueSets(1, 20, "lastUpdated,true", "test");

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/valuesets",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 1,
            searchTerm: "test",
            limit: 20,
            sortInfo: "lastUpdated,true",
          },
        }
      );
    });

    it("does not include sortInfo when not provided", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
        },
      });

      await terminologyService.getValueSets(1, 20);

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/valuesets",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 1,
            limit: 20,
          },
        }
      );
    });

    it("returns the page data from the response", async () => {
      const responseData = {
        content: [
          {
            id: "vs-1",
            url: "http://example.com/valueset",
            lastUpdated: "2025-01-01T00:00:00Z",
            manuallyModified: true,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        numberOfElements: 1,
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: responseData,
      });

      const result = await terminologyService.getValueSets();

      expect(result).toEqual(responseData);
      expect(result.content[0].id).toBe("vs-1");
    });

    it("uses the latest access token on each call", async () => {
      const tokenFn = jest
        .fn()
        .mockReturnValueOnce("token-1")
        .mockReturnValueOnce("token-2");

      const service = new TerminologyServiceApi("http://test.url", tokenFn);

      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
        },
      });

      await service.getValueSets();
      await service.getValueSets();

      expect(axios.get).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer token-1",
          },
        })
      );

      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer token-2",
          },
        })
      );
    });
  });

  describe("createCodeSystem", () => {
    const request = {
      title: "Example Title",
      name: "example",
      fullUrl: "http://example.com",
      oid: "1.2.3",
      isLatestVersion: true,
      version: { fhirVersion: "4.0.1", vsacVersion: "2024" },
    };

    it("posts to the code-system endpoint and returns the created resource", async () => {
      const created = {
        id: "cs-new",
        ...request,
        lastUpdated: "2025-01-01T00:00:00Z",
      };
      (axios.post as jest.Mock).mockResolvedValueOnce({ data: created });

      const result = await terminologyService.createCodeSystem(request);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/code-system",
        request,
        { headers: { Authorization: "Bearer test-token" } }
      );
      expect(result).toEqual(created);
    });

    it("uses the latest access token on each call", async () => {
      const tokenFn = jest
        .fn()
        .mockReturnValueOnce("token-1")
        .mockReturnValueOnce("token-2");
      const service = new TerminologyServiceApi("http://test.url", tokenFn);
      (axios.post as jest.Mock).mockResolvedValue({ data: { id: "cs-x" } });

      await service.createCodeSystem(request);
      await service.createCodeSystem(request);

      expect(axios.post).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.anything(),
        expect.objectContaining({
          headers: { Authorization: "Bearer token-1" },
        })
      );
      expect(axios.post).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.anything(),
        expect.objectContaining({
          headers: { Authorization: "Bearer token-2" },
        })
      );
    });
  });

  describe("deleteCodeSystem", () => {
    it("calls the delete endpoint with correct headers", async () => {
      (axios.delete as jest.Mock).mockResolvedValueOnce({ status: 204 });

      await terminologyService.deleteCodeSystem("cs-1");

      expect(axios.delete).toHaveBeenCalledTimes(1);
      expect(axios.delete).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/code-system/cs-1",
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
      (axios.delete as jest.Mock).mockResolvedValue({ status: 204 });

      await service.deleteCodeSystem("cs-1");
      await service.deleteCodeSystem("cs-2");

      expect(axios.delete).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: "Bearer token-1" },
        })
      );
      expect(axios.delete).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: "Bearer token-2" },
        })
      );
    });
  });

  describe("addValueSet", () => {
    const validValueSet = {
      url: "http://example.org/fhir/ValueSet/test",
      version: "1.0.0",
      lastUpdated: "2026-08-13T16:54:04.022Z",
      manuallyModified: true,
      valueSet: '{"resourceType":"ValueSet"}',
    };

    it("posts the value set to the value-set endpoint and returns the data", async () => {
      const created = { id: "vs-1", ...validValueSet };
      (axios.post as jest.Mock).mockResolvedValueOnce({ data: created });

      const result = await terminologyService.addValueSet(validValueSet);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/value-set",
        validValueSet,
        {
          headers: { Authorization: "Bearer test-token" },
        }
      );
      expect(result).toEqual(created);
    });

    it("throws only the validationErrors['/api'] message when present", async () => {
      const apiMessage =
        "The URL in the expansion JSON [http://example.org/fhir/ValueSet/test-1] does not match the provided URL [http://example.org/fhir/ValueSet/test].";
      (axios.post as jest.Mock).mockRejectedValueOnce({
        response: {
          data: {
            message: "Some other generic message",
            validationErrors: {
              "/api": apiMessage,
            },
          },
        },
      });

      await expect(
        terminologyService.addValueSet(validValueSet)
      ).rejects.toThrow(apiMessage);
    });

    it("appends the server message when there is no validationErrors['/api']", async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: "Value set already exists" } },
      });

      await expect(
        terminologyService.addValueSet(validValueSet)
      ).rejects.toThrow(
        "An error occurred while adding the value set. Please try again. If the error persists, please contact the help desk.: Value set already exists"
      );
    });

    it("throws the generic message when the response has no message or validationErrors", async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce({ response: {} });

      await expect(
        terminologyService.addValueSet(validValueSet)
      ).rejects.toThrow(
        "An error occurred while adding the value set. Please try again. If the error persists, please contact the help desk."
      );
    });

    it("falls back to the generic message when there is no response", async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(
        new Error("Network down")
      );

      await expect(
        terminologyService.addValueSet(validValueSet)
      ).rejects.toThrow(
        "An error occurred while adding the value set. Please try again. If the error persists, please contact the help desk."
      );
    });

    it("uses the latest access token on the request", async () => {
      const tokenFn = jest.fn().mockReturnValue("fresh-token");
      const service = new TerminologyServiceApi("http://test.url", tokenFn);
      (axios.post as jest.Mock).mockResolvedValueOnce({ data: {} });

      await service.addValueSet(validValueSet);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        validValueSet,
        expect.objectContaining({
          headers: { Authorization: "Bearer fresh-token" },
        })
      );
    });
  });

  describe("updateValueSet", () => {
    const validValueSet = {
      id: "vs-1",
      url: "http://example.org/fhir/ValueSet/test",
      version: "1.0.0",
      lastUpdated: "2026-08-13T16:54:04.022Z",
      manuallyModified: true,
      valueSet: '{"resourceType":"ValueSet"}',
    };

    it("puts the value set to the value-set endpoint and returns the data", async () => {
      const updated = { ...validValueSet };
      (axios.put as jest.Mock).mockResolvedValueOnce({ data: updated });

      const result = await terminologyService.updateValueSet(validValueSet);

      expect(axios.put).toHaveBeenCalledTimes(1);
      expect(axios.put).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/value-set",
        validValueSet,
        {
          headers: { Authorization: "Bearer test-token" },
        }
      );
      expect(result).toEqual(updated);
    });

    it("throws only the validationErrors['/api'] message when present", async () => {
      const apiMessage = "The updated value set failed validation.";
      (axios.put as jest.Mock).mockRejectedValueOnce({
        response: {
          data: {
            message: "Some other generic message",
            validationErrors: {
              "/api": apiMessage,
            },
          },
        },
      });

      await expect(
        terminologyService.updateValueSet(validValueSet)
      ).rejects.toThrow(apiMessage);
    });

    it("appends the server message when there is no validationErrors['/api']", async () => {
      (axios.put as jest.Mock).mockRejectedValueOnce({
        response: { data: { message: "Value set already exists" } },
      });

      await expect(
        terminologyService.updateValueSet(validValueSet)
      ).rejects.toThrow(
        "An error occurred while updating the value set. Please try again. If the error persists, please contact the help desk.: Value set already exists"
      );
    });

    it("throws the generic message when the response has no message or validationErrors", async () => {
      (axios.put as jest.Mock).mockRejectedValueOnce({ response: {} });

      await expect(
        terminologyService.updateValueSet(validValueSet)
      ).rejects.toThrow(
        "An error occurred while updating the value set. Please try again. If the error persists, please contact the help desk."
      );
    });

    it("falls back to the generic message when there is no response", async () => {
      (axios.put as jest.Mock).mockRejectedValueOnce(new Error("Network down"));

      await expect(
        terminologyService.updateValueSet(validValueSet)
      ).rejects.toThrow(
        "An error occurred while updating the value set. Please try again. If the error persists, please contact the help desk."
      );
    });

    it("uses the latest access token on the request", async () => {
      const tokenFn = jest.fn().mockReturnValue("fresh-token");
      const service = new TerminologyServiceApi("http://test.url", tokenFn);
      (axios.put as jest.Mock).mockResolvedValueOnce({ data: {} });

      await service.updateValueSet(validValueSet);

      expect(axios.put).toHaveBeenCalledWith(
        expect.any(String),
        validValueSet,
        expect.objectContaining({
          headers: { Authorization: "Bearer fresh-token" },
        })
      );
    });
  });

  describe("getCodeSystems", () => {
    it("calls codesystems endpoint with default paging params", async () => {
      const responseData = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 10,
        numberOfElements: 0,
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: responseData,
      });

      const result = await terminologyService.getCodeSystems();

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/codesystems",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 0,
            limit: 10,
          },
        }
      );

      expect(result).toEqual(responseData);
    });

    it("calls codesystems endpoint with custom page and limit", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 2,
          size: 25,
          numberOfElements: 0,
        },
      });

      await terminologyService.getCodeSystems(2, 25);

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/codesystems",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 2,
            limit: 25,
          },
        }
      );
    });

    it("includes sortInfo when provided", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
        },
      });

      await terminologyService.getCodeSystems(1, 20, "lastUpdated,true");

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/codesystems",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 1,
            limit: 20,
            sortInfo: "lastUpdated,true",
          },
        }
      );
    });

    it("does not include sortInfo when not provided", async () => {
      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
        },
      });

      await terminologyService.getCodeSystems(1, 20);

      expect(axios.get).toHaveBeenCalledWith(
        "http://test.url/terminology/admin/codesystems",
        {
          headers: {
            Authorization: "Bearer test-token",
          },
          params: {
            page: 1,
            limit: 20,
          },
        }
      );
    });

    it("returns the page data from the response", async () => {
      const responseData = {
        content: [
          {
            id: "cs-1",
            title: "Example Title",
            name: "example",
            version: { fhirVersion: "4.0.1" },
            fullUrl: "http://example.com",
            lastUpdated: new Date().toISOString(),
            isLatestVersion: true,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        numberOfElements: 1,
      };

      (axios.get as jest.Mock).mockResolvedValueOnce({
        data: responseData,
      });

      const result = await terminologyService.getCodeSystems();

      expect(result).toEqual(responseData);
      expect(result.content[0].id).toBe("cs-1");
    });

    it("uses the latest access token on each call", async () => {
      const tokenFn = jest
        .fn()
        .mockReturnValueOnce("token-1")
        .mockReturnValueOnce("token-2");

      const service = new TerminologyServiceApi("http://test.url", tokenFn);

      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
        },
      });

      await service.getCodeSystems();
      await service.getCodeSystems();

      expect(axios.get).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer token-1",
          },
        })
      );

      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer token-2",
          },
        })
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
