declare module "@madie/madie-util" {
  import { UserDetails } from "@madie/madie-models";

  export interface FeatureFlags {
    AdminShareMeasures: boolean;
    AdminTransferMeasure: boolean;
    AdminTransferLibrary: boolean;
    AdminShareLibrary: boolean;
    AdminUserList: boolean;
  }

  export function useFeatureFlags(): FeatureFlags;
  export function useDocumentTitle(title: string): void;
  export function useUserRoles(): { roles: string[]; isAdmin: boolean } | null;
  export function useOktaTokens(): {
    getAccessToken: () => string;
    getUserName: () => string;
  };
  export const wafIntercept: (error: any) => Promise<any>;

  export class UserServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    fetchUsers(signal?: AbortSignal): Promise<UserDetails[]>;
  }

  export function useUserServiceApi(): UserServiceApi;
}
