/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "@madie/madie-util" {
  export function padCmsId(cmsId: number | string | null | undefined): string;
  export function formatCmsId(
    cmsId: number | string | null | undefined,
    model: string | null | undefined
  ): string;

  import type { AxiosError } from "axios";

  export interface FeatureFlags {
    AdminShareMeasures: boolean;
    AdminTransferMeasure: boolean;
    AdminTransferLibrary: boolean;
    AdminShareLibrary: boolean;
    AdminUserList: boolean;
    AdminUserProfile: boolean;
  }

  export interface HarpRole {
    roleType?: string;
    role?: string;
  }

  export interface UserDetails {
    id?: string;
    harpId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: string;
    roles?: HarpRole[];
    lastLoginAt?: string;
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

  export interface MeasureSearchCriteria {
    searchField?: string;
    optionalSearchProperties?: string[];
    model?: string;
    draft?: boolean;
    excludeByMeasureIds?: string[];
  }

  export interface MeasurePage {
    content: any[];
    totalElements: number;
    totalPages: number;
    numberOfElements: number;
    pageable?: { offset: number };
  }

  export class MeasureServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    adminSearchMeasuresForUser(
      harpId: string,
      ownershipTypes: string[],
      limit?: string | number,
      page?: number,
      sort?: string,
      direction?: string,
      searchCriteria?: MeasureSearchCriteria,
      abortController?: AbortController
    ): Promise<MeasurePage>;
    getMeasuresByMeasureSetId(
      measureSetId: string,
      sortByLatestVersion?: boolean,
      searchCriteria?: MeasureSearchCriteria
    ): Promise<any[]>;
    fetchMeasure(id: string): Promise<any>;
    deleteMeasure(id: string): Promise<Response>;
    adminDeleteMeasure(id: string, ownerHarpId: string): Promise<Response>;
  }

  export function useMeasureServiceApi(): MeasureServiceApi;

  export interface ServiceConfig {
    terminologyService?: {
      baseUrl: string;
    };
    userService?: {
      baseUrl: string;
    };
    measureService?: {
      baseUrl: string;
    };
  }

  export function useServiceConfig(): ServiceConfig;

  export interface AdminUserStoreSubscription {
    unsubscribe(): void;
  }

  export interface AdminUserStore {
    subscribe(
      callback: (user: UserDetails | null) => void
    ): AdminUserStoreSubscription;
    updateUser(user: UserDetails | null): void;
    initialState: null;
    state: UserDetails | null;
  }

  export const adminUserStore: AdminUserStore;

  export function ExportAction(props: {
    measures: any[];
    onClick: (exportType: string) => void;
  }): JSX.Element;
  export function ViewHRAction(props: {
    measures: any[];
    onClick: () => void;
  }): JSX.Element;
  export function HistoryAction(props: {
    measures: any[];
    onClick: () => void;
  }): JSX.Element;
  export function CompareVersionsAction(props: {
    measures: any[];
    onClick: () => void;
  }): JSX.Element;
  export function ShareAction(props: {
    measures: any[];
    onClick: (option: string) => void;
    isOwner?: boolean;
    isSharedWithUser?: boolean;
    activeTab: number;
  }): JSX.Element;

  export function ExportDialog(props: {
    downloadState?: string | null;
    failureMessage?: string | string[] | null;
    measureName?: string;
    open: boolean;
    handleContinueDialog?: () => void;
    handleCancelDialog?: () => void;
  }): JSX.Element | null;
  export function ViewHRModal(props: {
    open: boolean;
    onClose: () => void;
    exportMeasure?: (elmErrorSeverity: string) => void;
    measureId: string;
  }): JSX.Element | null;
  export function ViewMeasureHistoryDialog(props: {
    measures: any[];
    open: boolean;
    onClose: () => void;
  }): JSX.Element | null;
  export function CompareVersionsDialog(props: {
    measures: any[] | null | undefined;
    open: boolean;
    onClose: () => void;
  }): JSX.Element | null;
  export function ShareDialog(props: {
    measures: any[];
    open: boolean;
    option: string;
    onClose: (...args: any[]) => void;
    onSave: (...args: any[]) => void;
    isAdmin?: boolean;
  }): JSX.Element | null;
  export function exportMeasure(
    setFailureMessage: (msg: string | string[] | null) => void,
    setDownloadState: (state: string | null) => void,
    abortController: { current: AbortController | null },
    measure: any,
    measureServiceApi: MeasureServiceApi,
    setToastOpen: (open: boolean) => void,
    setToastType: (type: string) => void,
    setToastMessage: (message: string) => void,
    elmErrorSeverity: string
  ): Promise<void>;
}
