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
        message =
          "Update Code System is already running. We have NOT started the job again";
      }

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
