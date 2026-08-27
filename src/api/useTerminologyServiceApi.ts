import axios from "./axios-instance";
import { useOktaTokens, useServiceConfig } from "@madie/madie-util";
import { CodeSystem } from "../components/landing/codeSystemManagement/CodeSystem";

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
}

export interface ValueSetDisplayForAdmin {
  id: string;
  url: string;
  version?: string;
  lastUpdated: string;
  manuallyModified: boolean;
  valueSet: string;
}

export interface AddValueSetForAdmin {
  url: string;
  version?: string;
  lastUpdated: string;
  manuallyModified: boolean;
  valueSet: string;
}

export interface UpdateValueSetForAdmin extends AddValueSetForAdmin {
  id: string;
}

export interface CreateCodeSystemRequest {
  title?: string;
  name: string;
  fullUrl: string;
  oid?: string;
  isLatestVersion: boolean;
  version: {
    fhirVersion: string;
    vsacVersion?: string;
  };
}

export class TerminologyServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getValueSets(
    page = 0,
    limit = 10,
    sortInfo?: string,
    searchTerm?: string
  ): Promise<Page<ValueSetDisplayForAdmin>> {
    const params: Record<string, string | number> = {
      page,
      limit,
    };

    if (sortInfo) {
      params.sortInfo = sortInfo;
    }

    if (searchTerm) {
      params.searchTerm = searchTerm;
    }

    const response = await axios.get(
      `${this.baseUrl}/terminology/admin/valuesets`,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        params,
      }
    );

    return response.data;
  }
  async updateValueSets(ig?: string, version?: string): Promise<void> {
    try {
      await axios.get(
        `${this.baseUrl}/terminology/admin/implementation-guides/update-value-sets`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: { ig, version },
        }
      );
    } catch (error: any) {
      let message =
        "An error occurred while updating Value Sets. Please try again. If the error persists, please contact the help desk.";
      if (error.response?.data?.message) {
        message = `${message}: ${error.response.data.message}`;
      }
      throw new Error(message);
    }
  }

  async addValueSet(
    valueSet: AddValueSetForAdmin
  ): Promise<ValueSetDisplayForAdmin> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/terminology/admin/value-set`,
        valueSet,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      const apiValidationError =
        error.response?.data?.validationErrors?.["/api"];
      if (apiValidationError) {
        throw new Error(apiValidationError);
      }

      let message =
        "An error occurred while adding the value set. Please try again. If the error persists, please contact the help desk.";

      if (error.response?.data?.message) {
        message = `${message}: ${error.response.data.message}`;
      }

      throw new Error(message);
    }
  }

  async updateValueSet(
    valueSet: UpdateValueSetForAdmin
  ): Promise<ValueSetDisplayForAdmin> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/terminology/admin/value-set`,
        valueSet,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      const apiValidationError =
        error.response?.data?.validationErrors?.["/api"];
      if (apiValidationError) {
        throw new Error(apiValidationError);
      }

      let message =
        "An error occurred while updating the value set. Please try again. If the error persists, please contact the help desk.";

      if (error.response?.data?.message) {
        message = `${message}: ${error.response.data.message}`;
      }

      throw new Error(message);
    }
  }

  async triggerUpdateCodeSystems(): Promise<void> {
    try {
      return await axios.post(
        `${this.baseUrl}/terminology/admin/trigger-code-system-refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
    } catch (error: any) {
      let message =
        "An error occurred while triggering the code system refresh. Please try again. If the error persists, please contact the help desk.";
      if (error.status === 409) {
        throw new Error(error.response.data);
      }

      if (error.response?.data?.message) {
        message = `${message}: ${error.response.data.message}`;
      }

      throw new Error(message);
    }
  }
  async getCodeSystems(
    page = 0,
    limit = 10,
    sortInfo?: string,
    filterField?: string,
    searchText?: string
  ): Promise<Page<CodeSystem>> {
    const params: Record<string, string | number> = {
      page,
      limit,
    };

    if (sortInfo) {
      params.sortInfo = sortInfo;
    }

    if (filterField) {
      params.filterField = filterField;
    }

    if (searchText) {
      params.searchText = searchText;
    }

    const response = await axios.get(
      `${this.baseUrl}/terminology/admin/codesystems`,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        params,
      }
    );

    return response.data;
  }

  async createCodeSystem(
    codeSystem: CreateCodeSystemRequest
  ): Promise<CodeSystem> {
    const response = await axios.post(
      `${this.baseUrl}/terminology/admin/code-system`,
      codeSystem,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    return response.data;
  }

  async updateCodeSystem(
    id: string,
    codeSystem: CreateCodeSystemRequest
  ): Promise<CodeSystem> {
    const response = await axios.put(
      `${this.baseUrl}/terminology/admin/code-system/${id}`,
      codeSystem,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
    return response.data;
  }
}

export default function useTerminologyServiceApi(): TerminologyServiceApi {
  const serviceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  return new TerminologyServiceApi(
    serviceConfig?.terminologyService?.baseUrl ?? "",
    getAccessToken
  );
}
