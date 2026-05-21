declare module "@madie/madie-util" {
  import { UserDetails } from "@madie/madie-models";
  import { AxiosError } from "axios";

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
    getUser(harpId: string, signal?: AbortSignal): Promise<UserDetails>;
  }

  export function useUserServiceApi(): UserServiceApi;

  export const adminUserStore: {
    subscribe: (setUserState: (user: UserDetails | null) => void) => {
      unsubscribe: () => void;
    };
    updateUser: (user: UserDetails | null) => void;
    initialState: null;
    state: UserDetails | null;
  };
}
