declare module "@madie/madie-util" {
  import type { UserDetails } from "@madie/madie-models";
  import type { AxiosError } from "axios";

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
  export function wafIntercept(error: AxiosError): Promise<never>;

  export class UserServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    fetchUsers(signal?: AbortSignal): Promise<UserDetails[]>;
    getUser(_harpId: string, signal?: AbortSignal): Promise<UserDetails>;
  }

  export function useUserServiceApi(): UserServiceApi;

  export const adminUserStore: {
    subscribe: (_setUserState: (_user: UserDetails | null) => void) => {
      unsubscribe: () => void;
    };
    updateUser: (_user: UserDetails | null) => void;
    initialState: null;
    state: UserDetails | null;
  };
}
