import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export class UserExportServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  /**
   * Requests the full user export report from the admin service.
   * The backend is responsible for generating the workbook (headers now,
   * data in a later story) and returning it as an `.xlsx` binary payload.
   */
  async exportFullUserList(signal?: AbortSignal): Promise<Blob> {
    try {
      const response = await axios.get<Blob>(
        `${this.baseUrl}/admin/users/export`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            Accept: XLSX_CONTENT_TYPE,
          },
          responseType: "blob",
          signal,
        }
      );
      return response.data;
    } catch (err) {
      console.error("Unable to export the full user list", err);
      throw new Error("Unable to export the full user list.");
    }
  }
}

export default function useUserExportServiceApi(): UserExportServiceApi {
  const serviceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const baseUrl = serviceConfig?.adminService?.baseUrl ?? "";
  return new UserExportServiceApi(baseUrl, getAccessToken);
}
