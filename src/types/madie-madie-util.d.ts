/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "@madie/madie-util" {
  export interface ValueSet {
    resourceType: string;
    id: string;
    url: string;
    status: string;
    errorMsg: string;
  }

  export interface ValueSetDisplayForAdmin {
    id: string;
    url: string;
    version?: string;
    lastUpdated: string;
    manuallyModified: boolean;
    valueSet: string;
  }

  export interface ValueSetSearchResult {
    resultBundle: string;
    valueSets: ValueSetForSearch[];
  }

  export interface ValueSetForSearch {
    codeSystem?: string;
    name?: string;
    author?: string;
    composedOf?: string;
    effectiveDate?: string;
    lastReviewDate?: string;
    lastUpdated?: string;
    publisher?: string;
    purpose?: string;
    oid?: string;
    status?: string;
    steward?: string;
    title?: string;
    url?: string;
    version?: string;
  }

  export interface CustomCqlCodeSystem {
    name?: string;
    id?: string;
    version?: string;
    valid?: boolean;
    errorMessage?: string;
  }

  export interface CustomCqlCode {
    code?: string;
    display?: string;
    codeSystem: CustomCqlCodeSystem;
    valid?: boolean;
    errorMessage?: string;
  }

  export interface AddValueSetForAdmin {
    url: string;
    version: string;
    valueSet: string;
    manuallyModified?: boolean;
    lastUpdated?: string;
  }

  export interface UpdateValueSetForAdmin {
    id: string;
    url: string;
    version: string;
    valueSet: string;
    lastUpdated?: string;
    manuallyModified?: boolean;
  }

  export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    numberOfElements: number;
  }
  export interface CodeSystem {
    id: string;
    fullUrl: string;
    title?: string;
    name: string;
    version: Version;
    versionId?: string;
    oid: string;
    lastUpdated?: string;
    lastUpdatedUpstream?: string;
    isLatestVersion: boolean;
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

  export interface Version {
    fhirVersion: string;
    vsacVersion?: string;
  }

  export interface ValueSetDisplayForAdmin {
    id: string;
    url: string;
    version?: string;
    lastUpdated: string;
    manuallyModified: boolean;
    valueSet: string;
  }
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

  export class TerminologyServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);

    checkLogin(): Promise<Boolean>;
    loginUMLS(apiKey: string): Promise<string>;
    logoutUMLS(): Promise<Boolean>;

    getValueSet(
      oid: string,
      locator: string,
      loggedInUMLS: boolean
    ): Promise<ValueSet>;

    getValueSets(
      page?: number,
      limit?: number,
      sortInfo?: string,
      searchTerm?: string
    ): Promise<Page<ValueSetDisplayForAdmin>>;

    searchValueSets(values: Record<string, any>): Promise<ValueSetSearchResult>;

    validateCodes(
      customCqlCodes: CustomCqlCode[],
      loggedInUMLS: boolean,
      model: string
    ): Promise<CustomCqlCode[]>;

    adminDeleteValueSet(id: string): Promise<Response>;

    addValueSet(
      valueSet: AddValueSetForAdmin
    ): Promise<ValueSetDisplayForAdmin>;

    updateValueSet(
      valueSet: UpdateValueSetForAdmin
    ): Promise<ValueSetDisplayForAdmin>;

    createCodeSystem(codeSystem: CreateCodeSystemRequest): Promise<CodeSystem>;

    updateCodeSystem(
      id: string,
      codeSystem: CreateCodeSystemRequest
    ): Promise<CodeSystem>;

    updateValueSets(ig?: string, version?: string): Promise<void>;

    getCodeSystems(
      page: number,
      limit: number,
      sortInfo?: string,
      filterField?: string,
      searchText?: string
    ): Promise<Page<CodeSystem>>;

    triggerUpdateCodeSystems(): Promise<void>;
    deleteValueSet(id: string): Promise<Response>;
  }
  export function useTerminologyServiceApi(): TerminologyServiceApi;

  export function checkUserCanEdit(
    createdBy: string,
    acls: any[],
    draft?: boolean
  ): boolean;

  export class UserServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    fetchUsers(signal?: AbortSignal): Promise<UserDetails[]>;
    getUser(harpId: string, signal?: AbortSignal): Promise<UserDetails>;
    getBulkUserDetails(harpIds: string[]): Promise<Record<string, UserDetails>>;
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
    transferMeasures(
      measureIds: string[],
      harpId: string,
      retainShareAccess: boolean
    ): Promise<any>;
  }

  export function useMeasureServiceApi(): MeasureServiceApi;

  export class CqlLibraryServiceApi {
    constructor(baseUrl: string, getAccessToken: () => string);
    fetchCqlLibraries(
      ownershipType: string,
      limit?: string | number,
      page?: number,
      searchCriteria?: any,
      sortInfo?: string,
      signal?: AbortSignal
    ): Promise<any>;
    adminSearchCqlLibrariesForUser(
      harpId: string,
      ownershipType: string,
      limit?: string | number,
      page?: number,
      searchCriteria?: any,
      sortInfo?: string,
      signal?: AbortSignal
    ): Promise<any>;
    getSharedLibraries(libraryIds: string[]): Promise<any>;
    getRecentLibrariesByLibrarySetId(librarySetIds: string[]): Promise<any>;
    getLibrariesByLibrarySetId(
      librarySetId: string,
      sortByLatestVersion?: boolean,
      librarySearchCriteria?: any
    ): Promise<any[]>;
    deleteLibrary(id: string, harpId: string): Promise<any>[];
    deleteDraft(id: string): Promise<any>[];
    getSharedAccessReportForLibraries(ids: string[]): Promise<any>[];
    unshareLibraries(libraryUserIdMap: Map<string, string[]>): Promise<any>;
    shareLibraries(libraries: Map<string, string[]>): Promise<any>;
  }

  export function useCqlLibraryServiceApi(): CqlLibraryServiceApi;

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
  export function TransferAction(props: {
    measures: any[];
    onClick: () => void;
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
    unshareFromUser?: string;
  }): JSX.Element | null;
  export function TransferDialog(props: {
    measures: any[];
    open: boolean;
    onClose: (...args: any[]) => void;
    setStatusHandler: (...args: any[]) => void;
    isAdminTransfer?: boolean;
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

  export function LibraryShareAction(props: {
    libraries: any[];
    canEdit: boolean;
    userName: string;
    isSharedWithUser: boolean;
    activeTab: number;
    owners: string[];

    onClick: (option: string) => void;
  }): JSX.Element | null;
  export function LibraryShareDialog(props: {
    libraries: any[];
    open: boolean;
    option: string;
    onClose: () => void;
  }): JSX.Element | null;
  export function LibraryHistoryAction(props: {
    libraries: any[];
    onClick: () => void;
  }): JSX.Element | null;
  export function LibraryCompareVersionsAction(props: {
    libraries: any[];
    onClick: () => void;
  }): JSX.Element | null;
  export function LibraryHistoryDialog(props: {
    libraries: any[];
    open: boolean;
    onClose: () => void;
  }): JSX.Element | null;
  export function LibraryCompareVersionsDialog(props: {
    libraries: any[];
    open: boolean;
    onClose: () => void;
  }): JSX.Element | null;
  export function LibraryTransferAction(props: {
    libraries: any[];
    onClick: () => void;
    activeTab: number;
  }): JSX.Element | null;
  export function LibraryTransferDialog(props: {
    libraries: any[];
    open: boolean;
    onClose: (...args: any[]) => void;
    setStatusHandler: (...args: any[]) => void;
  }): JSX.Element | null;
}
