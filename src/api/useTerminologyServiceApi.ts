import axios from "./axios-instance";
import { useOktaTokens, useServiceConfig } from "@madie/madie-util";

export class TerminologyServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

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
    } catch (error) {
      let message =
        "An error occurred while updating Value Sets. Please try again. If the error persists, please contact the help desk.";
      if (error.response?.data?.message) {
        message = `${message}: ${error.response.data.message}`;
      }
      throw new Error(message);
    }
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
