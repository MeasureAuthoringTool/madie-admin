declare module "@madie/madie-util" {
  export function useDocumentTitle(title: string): void;
  export function useUserRoles(): { roles: string[]; isAdmin: boolean } | null;
  export function useOktaTokens(): {
    getAccessToken: () => string;
    getUserName: () => string;
  };
  export const wafIntercept: (error: any) => Promise<any>;

  export class UserServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    fetchUsers(signal?: AbortSignal): Promise<any[]>;
  }

  export function useUserServiceApi(): UserServiceApi;
}
