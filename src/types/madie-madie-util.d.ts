declare module "@madie/madie-util" {
  export function useDocumentTitle(title: string): void;
  export function useUserRoles(): { roles: string[]; isAdmin: boolean } | null;
}
