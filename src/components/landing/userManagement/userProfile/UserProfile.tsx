import React, {
  HTMLProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import {
  useUserServiceApi,
  useMeasureServiceApi,
  useCqlLibraryServiceApi,
  adminUserStore,
  useFeatureFlags,
  ExportDialog,
  LibraryShareDialog,
  LibraryHistoryDialog,
  LibraryCompareVersionsDialog,
  LibraryTransferDialog,
  ViewHRModal,
  ViewMeasureHistoryDialog,
  CompareVersionsDialog,
  ShareDialog,
  TransferDialog,
  exportMeasure as downloadMeasureExport,
  formatCmsId,
  checkUserCanEdit,
  useOktaTokens,
} from "@madie/madie-util";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Button,
  MadieDeleteDialog,
  MadieSpinner,
  MadieTable,
  Pagination,
  SearchAndFilter,
  Tab,
  Tabs,
  Toast,
  TruncateText,
  useFilterSearch,
} from "@madie/madie-design-system/dist/react";
import { Chip, Tooltip } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  CollapseIcon,
  ExpandIcon,
} from "../../../../icons/MeasureListTableRightArrowIcons";
import ActionCenter from "./actionCenter/ActionCenter";
import "./UserProfile.scss";
import LibraryActionCenter from "./actionCenter/LibraryActionCenter";
import _ from "lodash";

type Ownership =
  | "OWNED_MEASURE"
  | "SHARED_MEASURE"
  | "OWNED_LIBRARY"
  | "SHARED_LIBRARY";
type Direction = "ASC" | "DESC" | "";

type SearchCriteria = {
  searchField: string;
  optionalSearchProperties: string[];
};

type RequestResult<T> = { ok: true; data: T } | { ok: false; reason: any };

const isFailedRequestResult = <T,>(
  result: RequestResult<T>
): result is { ok: false; reason: any } => result.ok === false;

type MeasureRow = {
  id: string;
  measureName: string;
  version: string;
  model: string;
  ownerDisplayName?: string;
  actions: any;
  hasAssociatedMeasures: boolean;
};

type LibraryRow = {
  id: string;
  cqlLibraryName: string;
  version: string;
  model: string;
  ownerDisplayName?: string;
  actions: any;
  hasAssociatedLibraries: boolean;
  draft: boolean;
};

type MeasuresPageState = {
  measures: any[];
  totalElements: number;
  visibleItems: number;
  totalPages: number;
  offset: number;
};

type LibrariesPageState = {
  libraries: any[];
  totalElements: number;
  visibleItems: number;
  totalPages: number;
  offset: number;
};

const DEFAULT_SEARCH_CRITERIA: SearchCriteria = {
  searchField: "",
  optionalSearchProperties: [],
};

const COMPONENT_MEASURE_MSG =
  "This measure is a component of a composite measure";

const COMPONENT_DELETE_DISABLED_MSG =
  "This measure is used in a composite measure and cannot be deleted until it is removed from any composite measures for which it is a component.";

const MEASURE_FILTER_OPTIONS = ["Measure", "Version", "Model", "CMS ID"];
const LIBRARY_FILTER_OPTIONS = ["Library", "Version", "Model"];

const LIBRARY_FILTER_MAP = new Map<string, string>([
  ["Library", "library"],
  ["Version", "version"],
  ["Model", "model"],
]);

const MEASURE_FILTER_MAP = new Map<string, string>([
  ["Measure", "measure"],
  ["Version", "version"],
  ["Model", "model"],
  ["CMS ID", "cmsId"],
]);

const EMPTY_MEASURES_PAGE: MeasuresPageState = {
  measures: [],
  totalElements: 0,
  visibleItems: 0,
  totalPages: 0,
  offset: 0,
};

const EMPTY_LIBRARIES_PAGE: LibrariesPageState = {
  libraries: [],
  totalElements: 0,
  visibleItems: 0,
  totalPages: 0,
  offset: 0,
};

export const ownershipForTab = (tab: number): Ownership => {
  switch (tab) {
    case 0:
      return "OWNED_MEASURE";
    case 1:
      return "SHARED_MEASURE";
    case 2:
      return "OWNED_LIBRARY";
    case 3:
      return "SHARED_LIBRARY";
    default:
      return "OWNED_MEASURE";
  }
};

const isLibraryOwnership = (ownership: Ownership): boolean =>
  ownership === "OWNED_LIBRARY" || ownership === "SHARED_LIBRARY";

const measureOwnershipForTab = (ownership: Ownership): "OWNED" | "SHARED" =>
  ownership === "SHARED_MEASURE" ? "SHARED" : "OWNED";

const cqlLibraryOwnershipForTab = (ownership: Ownership): "OWNED" | "SHARED" =>
  ownership === "SHARED_LIBRARY" ? "SHARED" : "OWNED";

const isAbortError = (err: any): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: string };
  return e.name === "AbortError" || e.code === "ERR_CANCELED";
};

const lockedBy = (item: any): string | undefined =>
  item?.measureLock?.lockedBy || item?.cqlLibraryLock?.lockedBy;

const getErrorMessage = (err: any, fallback: string): string => {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: any }).message || fallback);
  }
  return fallback;
};

const transformRow = (m: any): MeasureRow => ({
  id: m?.id,
  measureName: m?.measureName,
  version: m?.version,
  model: m?.model,
  ownerDisplayName: m?.ownerDisplayName,
  actions: m,
  hasAssociatedMeasures: !!m?.hasAssociatedMeasures,
});

const transformLibraryRow = (library: any): LibraryRow => ({
  id: library?.id,
  cqlLibraryName: library?.cqlLibraryName,
  version: library?.version,
  model: library?.model,
  ownerDisplayName: library?.ownerDisplayName,
  actions: library,
  hasAssociatedLibraries: !!library?.hasAssociatedLibraries,
  draft: library.draft,
});

function IndeterminateCheckbox({
  indeterminate,
  className = "",
  id,
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === "boolean" && ref.current) {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [indeterminate, rest.checked]);

  return (
    <input
      type="checkbox"
      ref={ref}
      id={id}
      data-testid={`checkbox-${id}`}
      className={`${className} cursor-pointer`}
      {...rest}
    />
  );
}

const LockedByTooltip = ({
  lockedByDisplayName,
  children,
}: {
  lockedByDisplayName: string;
  children: React.ReactElement;
}) => (
  <Tooltip
    title={
      <>
        Locked while being edited by
        <br />
        {lockedByDisplayName}
      </>
    }
    arrow
    slotProps={{
      tooltip: {
        sx: {
          maxWidth: "none",
          whiteSpace: "nowrap",
          zIndex: 99,
          backgroundColor: "#333",
          "& .MuiTooltip-arrow": {
            color: "#333",
          },
        },
      },
    }}
  >
    <span>{children}</span>
  </Tooltip>
);

const MeasureStatusChips = ({ measure }: { measure: any }) => (
  <div
    style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}
    aria-label="Measure status"
  >
    {measure?.measureMetaData?.draft && (
      <Chip
        className="chip-draft"
        label="Draft"
        role="status"
        aria-label="Draft"
      />
    )}
    {measure?.measureMetaData?.composite && (
      <Chip
        className="chip-composite"
        label="Composite"
        role="status"
        aria-label="Composite"
      />
    )}
    {measure?.component && (
      <Chip
        className="chip-in-composite"
        role="status"
        aria-label={`In Composite: ${COMPONENT_MEASURE_MSG}`}
        label={
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            In Composite
            <Tooltip title={`${COMPONENT_MEASURE_MSG}`} arrow>
              <InfoOutlinedIcon
                sx={{ fontSize: 16 }}
                aria-label={`${COMPONENT_MEASURE_MSG}`}
                role="img"
                tabIndex={0}
                focusable="true"
              />
            </Tooltip>
          </span>
        }
      />
    )}
  </div>
);

const UserProfile = () => {
  const { harpId } = useParams<{ harpId: string }>() as { harpId: string };
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const userServiceApi = useRef(useUserServiceApi()).current;
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const featureFlags = useFeatureFlags();

  const {
    filterBy,
    searchField,
    handleFilter,
    handleSearch,
    finalizeSearchCriteria,
    blankSearchCriteria,
  } = useFilterSearch();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(
    DEFAULT_SEARCH_CRITERIA
  );

  const [activeTab, setActiveTab] = useState(0);
  const activeOwnership = ownershipForTab(activeTab);
  const isLibraryTab = isLibraryOwnership(activeOwnership);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(10);
  const [currentSort, setCurrentSort] = useState("");
  const [currentDirection, setCurrentDirection] = useState<Direction>("");

  const [measuresPage, setMeasuresPage] =
    useState<MeasuresPageState>(EMPTY_MEASURES_PAGE);
  const [librariesPage, setLibrariesPage] =
    useState<LibrariesPageState>(EMPTY_LIBRARIES_PAGE);
  const [counts, setCounts] = useState<Record<Ownership, number>>({
    OWNED_MEASURE: 0,
    SHARED_MEASURE: 0,
    OWNED_LIBRARY: 0,
    SHARED_LIBRARY: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Delete measure action state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<"success" | "danger">("success");
  const [toastMessage, setToastMessage] = useState("");

  const [downloadState, setDownloadState] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<
    string | string[] | null
  >(null);
  const abortController = useRef<AbortController | null>(null);
  const targetMeasure = useRef<any>(null);
  const [viewHRModalOpen, setViewHRModalOpen] = useState(false);
  const [viewHistoryDialogOpen, setViewHistoryDialogOpen] = useState(false);
  const [compareVersionsDialogOpen, setCompareVersionsDialogOpen] =
    useState(false);
  const [libraryHistoryDialogOpen, setLibraryHistoryDialogOpen] =
    useState(false);
  const [
    libraryCompareVersionsDialogOpen,
    setLibraryCompareVersionsDialogOpen,
  ] = useState(false);
  const [libraryTransferDialogOpen, setLibraryTransferDialogOpen] =
    useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareOption, setShareOption] = useState("");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // Retriggers useEffects after action performed
  const [refreshToken, setRefreshToken] = useState(0);

  const [expandedMeasureSetId, setExpandedMeasureSetId] = useState<
    string | null
  >(null);
  const [expandedRows, setExpandedRows] = useState<MeasureRow[]>([]);
  const [selectedExpandedRowIds, setSelectedExpandedRowIds] = useState<
    string[]
  >([]);
  const [selectedExpandedLibraryRowIds, setSelectedExpandedLibraryRowIds] =
    useState<string[]>([]);
  const [expandedLibrarySetId, setExpandedLibrarySetId] = useState<
    string | null
  >(null);
  const [expandedLibraryRows, setExpandedLibraryRows] = useState<LibraryRow[]>(
    []
  );
  const expandedLibrarySetIdRef = useRef<string | null>(null);
  useEffect(() => {
    expandedLibrarySetIdRef.current = expandedLibrarySetId;
  }, [expandedLibrarySetId]);

  const expandedMeasureSetIdRef = useRef<string | null>(null);
  useEffect(() => {
    expandedMeasureSetIdRef.current = expandedMeasureSetId;
  }, [expandedMeasureSetId]);

  const clearExpansion = useCallback(() => {
    setExpandedMeasureSetId(null);
    setExpandedRows([]);
    setSelectedExpandedRowIds([]);
  }, []);

  const clearLibraryExpansion = useCallback(() => {
    setExpandedLibrarySetId(null);
    setExpandedLibraryRows([]);
    setSelectedExpandedLibraryRowIds([]);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    userServiceApi
      .getUser(harpId, controller.signal)
      .then((user) => adminUserStore.updateUser(user))
      .catch((err: any) => {
        if (!isAbortError(err)) adminUserStore.updateUser(null);
      });
    return () => controller.abort();
  }, [harpId, userServiceApi]);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      cqlLibraryServiceApi.adminSearchCqlLibrariesForUser(
        harpId,
        "OWNED",
        1,
        0,
        DEFAULT_SEARCH_CRITERIA,
        "lastModifiedAt,false",
        controller.signal
      ),
      cqlLibraryServiceApi.adminSearchCqlLibrariesForUser(
        harpId,
        "SHARED",
        1,
        0,
        DEFAULT_SEARCH_CRITERIA,
        "lastModifiedAt,false",
        controller.signal
      ),
    ])
      .then(([ownedData, sharedData]: any[]) => {
        setCounts((prev) => ({
          ...prev,
          OWNED_LIBRARY: ownedData?.totalElements ?? 0,
          SHARED_LIBRARY: sharedData?.totalElements ?? 0,
        }));
      })
      .catch((err: any) => {
        if (!isAbortError(err)) {
          console.error("Unable to load library counts", err);
        }
      });

    return () => controller.abort();
  }, [harpId, cqlLibraryServiceApi, refreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErrMsg("");

    if (isLibraryTab) {
      const sortInfo = currentSort
        ? `${currentSort},${currentDirection === "DESC"}`
        : "lastModifiedAt,false";

      cqlLibraryServiceApi
        .adminSearchCqlLibrariesForUser(
          harpId,
          cqlLibraryOwnershipForTab(activeOwnership),
          currentLimit,
          currentPage - 1,
          searchCriteria,
          sortInfo,
          controller.signal
        )
        .then((d: any) => {
          if (requestId !== requestIdRef.current) return;

          const totalElements = d?.totalElements ?? 0;
          setLibrariesPage({
            libraries: d?.content ?? [],
            totalElements,
            totalPages: d?.totalPages ?? 0,
            visibleItems: d?.numberOfElements ?? 0,
            offset: d?.pageable?.offset ?? 0,
          });
          setCounts((prev) => ({
            ...prev,
            [activeOwnership]: totalElements,
          }));
          setLoading(false);
        })
        .catch((err: any) => {
          if (requestId !== requestIdRef.current) return;
          if (!isAbortError(err)) {
            setErrMsg(err?.message || "Unable to load libraries");
            setLibrariesPage(EMPTY_LIBRARIES_PAGE);
          }
          setLoading(false);
        });

      return () => controller.abort();
    }

    const active = activeOwnership;
    const inactive: Ownership =
      active === "OWNED_MEASURE" ? "SHARED_MEASURE" : "OWNED_MEASURE";

    const dataPromise: Promise<RequestResult<any>> = measureServiceApi
      .adminSearchMeasuresForUser(
        harpId,
        [measureOwnershipForTab(active)],
        currentLimit,
        currentPage - 1,
        currentSort || "lastModifiedAt",
        currentDirection || "DESC",
        searchCriteria,
        controller
      )
      .then((data): RequestResult<any> => ({ ok: true, data }))
      .catch((reason): RequestResult<any> => ({ ok: false, reason }));

    const countPromise: Promise<RequestResult<any>> = measureServiceApi
      .adminSearchMeasuresForUser(
        harpId,
        [measureOwnershipForTab(inactive)],
        1,
        0,
        "lastModifiedAt",
        "DESC",
        DEFAULT_SEARCH_CRITERIA,
        controller
      )
      .then((data): RequestResult<any> => ({ ok: true, data }))
      .catch((reason): RequestResult<any> => ({ ok: false, reason }));

    Promise.all([dataPromise, countPromise]).then(([dataRes, countRes]) => {
      if (requestId !== requestIdRef.current) return;
      let activeTotal = 0;

      if (dataRes.ok) {
        const d = dataRes.data;
        activeTotal = d?.totalElements ?? 0;
        setMeasuresPage({
          measures: d?.content ?? [],
          totalElements: activeTotal,
          totalPages: d?.totalPages ?? 0,
          visibleItems: d?.numberOfElements ?? 0,
          offset: d?.pageable?.offset ?? 0,
        });
      } else if (
        isFailedRequestResult(dataRes) &&
        !isAbortError(dataRes.reason)
      ) {
        setErrMsg(getErrorMessage(dataRes.reason, "Unable to load measures"));
        setMeasuresPage(EMPTY_MEASURES_PAGE);
      }

      const inactiveTotal = countRes.ok
        ? countRes.data?.totalElements ?? 0
        : undefined;

      setCounts((prev) => ({
        ...prev,
        [active]: activeTotal,
        ...(inactiveTotal !== undefined ? { [inactive]: inactiveTotal } : {}),
      }));
      setLoading(false);
    });

    return () => controller.abort();
  }, [
    harpId,
    activeOwnership,
    isLibraryTab,
    currentPage,
    currentLimit,
    currentSort,
    currentDirection,
    searchCriteria,
    measureServiceApi,
    cqlLibraryServiceApi,
    refreshToken,
  ]);

  const data = useMemo<MeasureRow[]>(
    () => measuresPage.measures.map(transformRow),
    [measuresPage.measures]
  );

  const libraryData = useMemo<LibraryRow[]>(
    () => librariesPage.libraries.map(transformLibraryRow),
    [librariesPage.libraries]
  );

  const [lockedByDisplayNames, setLockedByDisplayNames] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const lockedByHarpIds = Array.from(
      new Set(
        [
          ...measuresPage.measures,
          ...expandedRows.map((row) => row.actions),
          ...librariesPage.libraries,
          ...expandedLibraryRows.map((row) => row.actions),
        ]
          .map((item) => lockedBy(item))
          .filter((id): id is string => !!id)
      )
    );
    if (lockedByHarpIds.length === 0 || !userServiceApi) {
      return;
    }
    userServiceApi
      .getBulkUserDetails(lockedByHarpIds)
      .then((userDetails) => {
        setLockedByDisplayNames((prev) => {
          const next = { ...prev };
          Object.entries(userDetails || {}).forEach(
            ([id, details]: [string, any]) => {
              const name = [details?.firstName, details?.lastName]
                .filter(Boolean)
                .join(" ");
              next[id] = name ? `${name} (${id})` : id;
            }
          );
          return next;
        });
      })
      .catch(() => {
        // fall back to displaying the raw HARP ID if the lookup fails
      });
  }, [
    measuresPage.measures,
    expandedRows,
    librariesPage.libraries,
    expandedLibraryRows,
    userServiceApi,
  ]);

  const toggleExpansion = useCallback(
    async (parent: any) => {
      const measureSetId = parent?.measureSetId;
      if (!measureSetId) return;
      if (expandedMeasureSetIdRef.current === measureSetId) {
        clearExpansion();
        return;
      }
      try {
        const results = await measureServiceApi.getMeasuresByMeasureSetId(
          measureSetId,
          true,
          DEFAULT_SEARCH_CRITERIA
        );
        const nested = (results ?? []).filter((r: any) => r?.id !== parent?.id);
        setExpandedMeasureSetId(measureSetId);
        setExpandedRows(nested.map(transformRow));
      } catch (err) {
        if (isAbortError(err)) return;
        clearExpansion();
        setErrMsg("Unable to load related nested measures");
      }
    },
    [measureServiceApi, clearExpansion]
  );

  const toggleLibraryExpansion = useCallback(
    async (parent: any) => {
      const librarySetId = parent?.librarySetId;
      if (!librarySetId) return;
      if (expandedLibrarySetIdRef.current === librarySetId) {
        clearLibraryExpansion();
        return;
      }
      try {
        const results = await cqlLibraryServiceApi.getLibrariesByLibrarySetId(
          librarySetId,
          true,
          DEFAULT_SEARCH_CRITERIA
        );
        const nested = (results ?? []).filter((r: any) => r?.id !== parent?.id);
        setExpandedLibrarySetId(librarySetId);
        setExpandedLibraryRows(nested.map(transformLibraryRow));
      } catch (err) {
        if (isAbortError(err)) return;
        clearLibraryExpansion();
        setErrMsg("Unable to load related nested libraries");
      }
    },
    [cqlLibraryServiceApi, clearLibraryExpansion]
  );

  const columns = useMemo<ColumnDef<MeasureRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <IndeterminateCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            id="select-all-checkbox"
            aria-label="Select all measures"
          />
        ),
        cell: ({ row }) => (
          <IndeterminateCheckbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
            id={row.original.id}
            aria-label={`Select measure ${row.original.measureName}`}
          />
        ),
      },
      {
        header: "Measure",
        accessorKey: "measureName",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.id}`}
          />
        ),
      },
      {
        header: "Version",
        accessorKey: "version",
        cell: (info) => (
          <TruncateText
            text={info.row.original.version}
            maxLength={60}
            dataTestId={`measure-version-${info.row.original.id}`}
          />
        ),
      },
      {
        header: "Status",
        accessorKey: "measureMetaData.draft",
        cell: (info) => (
          <MeasureStatusChips measure={info.row.original.actions} />
        ),
      },
      {
        header: "Model",
        accessorKey: "model",
        cell: (info) => (
          <TruncateText
            text={info.row.original.model}
            maxLength={120}
            dataTestId={`measure-model-${info.row.original.id}`}
          />
        ),
      },
      ...(activeOwnership === "SHARED_MEASURE"
        ? [
            {
              enableSorting: false,
              header: "Owner",
              accessorKey: "ownerDisplayName",
              cell: (info: any) => {
                return (
                  <span data-testid={`measure-owner-${info.row.original.id}`}>
                    {info.row.original.ownerDisplayName?.trim() || ""}
                  </span>
                );
              },
            },
          ]
        : [
            {
              header: "Shared",
              accessorKey: "measureSet.acls",
              cell: (info) => {
                const shared =
                  info.row.original.actions?.measureSet?.acls?.length > 0;
                return (
                  <div
                    data-testid={`measure-shared-${info.row.original.id}`}
                    aria-label={shared ? "Shared" : "Not shared"}
                  >
                    {shared && (
                      <CheckCircleOutlineIcon sx={{ color: "#4CAF50" }} />
                    )}
                  </div>
                );
              },
            },
          ]),
      {
        header: "CMS ID",
        accessorKey: "measureSet.cmsId",
        cell: (info) => (
          <TruncateText
            text={formatCmsId(
              info.row.original.actions?.measureSet?.cmsId,
              info.row.original.actions?.model
            )}
            maxLength={60}
            dataTestId={`measure-cmsId-${info.row.original.id}`}
          />
        ),
      },
      {
        header: "Updated",
        accessorKey: "lastModifiedAt",
        cell: (info) => {
          const ts = info.row.original.actions?.lastModifiedAt;
          return (
            <span data-testid={`measure-updated-${info.row.original.id}`}>
              {ts ? new Date(ts).toLocaleDateString() : ""}
            </span>
          );
        },
      },
      {
        id: "action",
        header: "",
        enableSorting: false,
        cell: (info) => {
          const measure = info.row.original.actions;
          const canEdit =
            checkUserCanEdit(
              measure?.measureSet?.owner,
              measure?.measureSet?.acls
            ) && measure?.measureMetaData?.draft;
          const lockHolder = lockedBy(measure);
          const isLockedByOther = canEdit && !!lockHolder;
          const lockedByDisplayName = lockHolder
            ? lockedByDisplayNames[lockHolder] || lockHolder
            : "";
          const buttonText = isLockedByOther
            ? "View"
            : canEdit
            ? "Edit"
            : "View";

          const buttonElement = (
            <Button
              variant="outline-filled"
              data-testid={`measure-action-${info.row.original.id}`}
              aria-label={`${buttonText} Measure ${
                info.row.original.measureName
              } ${info.row.original.version}${
                measure?.measureMetaData?.draft ? " Draft" : ""
              }${isLockedByOther ? ` (Locked by ${lockedByDisplayName})` : ""}`}
              tabIndex={0}
              role="button"
              onClick={() => {
                window.location.href = `/measures/${info.row.original.id}/edit/details/`;
              }}
            >
              {isLockedByOther && (
                <LockOutlinedIcon
                  sx={{ fontSize: 16, marginRight: 0.5 }}
                  data-testid={`measure-lock-icon-${info.row.original.id}`}
                />
              )}
              {buttonText}
            </Button>
          );

          if (isLockedByOther) {
            return (
              <LockedByTooltip lockedByDisplayName={lockedByDisplayName}>
                {buttonElement}
              </LockedByTooltip>
            );
          }
          return buttonElement;
        },
      },
      {
        id: "expandArrow",
        enableSorting: false,
        header: () => <span aria-label="expandArrow" />,
        cell: (info) => {
          if (!info.row.original.hasAssociatedMeasures) return null;
          const measure = info.row.original.actions;
          const isOpen = expandedMeasureSetId === measure?.measureSetId;
          const onActivate = () => toggleExpansion(measure);
          return (
            <span
              role="button"
              tabIndex={0}
              aria-label={isOpen ? "Collapse versions" : "Expand versions"}
              data-testid={`expand-toggle-${info.row.original.id}`}
              onClick={onActivate}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onActivate();
              }}
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isOpen ? <CollapseIcon /> : <ExpandIcon />}
            </span>
          );
        },
      },
    ],
    [
      activeOwnership,
      expandedMeasureSetId,
      toggleExpansion,
      lockedByDisplayNames,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const libraryColumns = useMemo<ColumnDef<LibraryRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <IndeterminateCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            id="select-all-checkbox"
          />
        ),
        cell: ({ row }) => {
          return (
            <IndeterminateCheckbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
              id={row.original.id}
              aria-label={`Select library ${row.original.cqlLibraryName}`}
            />
          );
        },
      },
      {
        header: "Library",
        accessorKey: "cqlLibraryName",
        cell: (info) => (
          <TruncateText
            text={info.row.original.cqlLibraryName}
            maxLength={120}
            dataTestId={`library-name-${info.row.original.id}`}
          />
        ),
      },
      {
        header: "Version",
        accessorKey: "version",
        cell: (info) => (
          <TruncateText
            text={info.row.original.version}
            maxLength={60}
            dataTestId={`library-version-${info.row.original.id}`}
          />
        ),
      },
      {
        sortDescFirst: false,
        header: "Status",
        accessorKey: "draft",
        cell: (info) => (
          <div>
            {info.row.original.actions?.draft && (
              <Chip className="chip-draft" label="Draft" />
            )}
          </div>
        ),
      },
      {
        header: "Model",
        accessorKey: "model",
        cell: (info) => (
          <TruncateText
            text={info.row.original.model}
            maxLength={120}
            dataTestId={`library-model-${info.row.original.id}`}
          />
        ),
      },
      ...(activeOwnership === "SHARED_LIBRARY"
        ? [
            {
              enableSorting: false,
              header: "Owner",
              accessorKey: "ownerDisplayName",
              cell: (info: any) => {
                const owner = info.row.original.actions?.ownerDisplayName;
                return <span>{owner?.trim() ? owner.trim() : "-"}</span>;
              },
            },
          ]
        : [
            {
              sortDescFirst: false,
              header: "Shared",
              accessorKey: "librarySet.acls",
              cell: (info: any) => {
                const shared =
                  info.row.original.actions?.librarySet?.acls?.length > 0;
                return (
                  <div
                    data-testid={`library-shared-${info.row.original.id}`}
                    aria-label={shared ? "Shared" : "Not shared"}
                  >
                    {shared && (
                      <CheckCircleOutlineIcon sx={{ color: "#4CAF50" }} />
                    )}
                  </div>
                );
              },
            },
          ]),
      {
        header: "Updated",
        accessorKey: "lastModifiedAt",
        cell: (info) => {
          const ts = info.row.original.actions?.lastModifiedAt;
          return (
            <span data-testid={`library-updated-${info.row.original.id}`}>
              {ts ? new Date(ts).toLocaleDateString() : ""}
            </span>
          );
        },
      },
      {
        id: "action",
        header: "",
        enableSorting: false,
        cell: (info) => {
          const library = info.row.original.actions;
          const canEdit =
            checkUserCanEdit(
              library?.librarySet?.owner,
              library?.librarySet?.acls
            ) && library?.draft;
          const lockHolder = lockedBy(library);
          const isLockedByOther = canEdit && !!lockHolder;
          const lockedByDisplayName = lockHolder
            ? lockedByDisplayNames[lockHolder] || lockHolder
            : "";
          const buttonText = isLockedByOther
            ? "View"
            : canEdit
            ? "Edit"
            : "View";

          const buttonElement = (
            <Button
              variant="outline-filled"
              data-testid={`library-action-${info.row.original.id}`}
              aria-label={`${buttonText} Library ${
                info.row.original.cqlLibraryName
              } ${info.row.original.version}${library?.draft ? " Draft" : ""}${
                isLockedByOther ? ` (Locked by ${lockedByDisplayName})` : ""
              }`}
              tabIndex={0}
              role="button"
              onClick={() => {
                window.location.href = `/cql-libraries/${info.row.original.id}/edit/details`;
              }}
            >
              {isLockedByOther && (
                <LockOutlinedIcon
                  sx={{ fontSize: 16, marginRight: 0.5 }}
                  data-testid={`library-lock-icon-${info.row.original.id}`}
                />
              )}
              {buttonText}
            </Button>
          );

          if (isLockedByOther) {
            return (
              <LockedByTooltip lockedByDisplayName={lockedByDisplayName}>
                {buttonElement}
              </LockedByTooltip>
            );
          }
          return buttonElement;
        },
      },
      {
        id: "expandArrow",
        enableSorting: false,
        header: () => <span aria-label="expandArrow" />,
        cell: (info) => {
          if (!info.row.original.hasAssociatedLibraries) return null;
          const library = info.row.original.actions;
          const isOpen = expandedLibrarySetId === library?.librarySetId;
          const onActivate = () => toggleLibraryExpansion(library);
          return (
            <span
              role="button"
              tabIndex={0}
              aria-label={isOpen ? "Collapse versions" : "Expand versions"}
              data-testid={`expand-library-toggle-${info.row.original.id}`}
              onClick={onActivate}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onActivate();
              }}
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isOpen ? <CollapseIcon /> : <ExpandIcon />}
            </span>
          );
        },
      },
    ],
    [
      activeOwnership,
      expandedLibrarySetId,
      toggleLibraryExpansion,
      lockedByDisplayNames,
    ]
  );

  const libraryTable = useReactTable({
    data: libraryData,
    columns: libraryColumns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleTabChange = useCallback(
    (_e: any, nextTab: number) => {
      setActiveTab(nextTab);
      clearExpansion();
      clearLibraryExpansion();
      table.toggleAllRowsSelected(false);
      libraryTable.toggleAllRowsSelected(false);
      setCurrentPage(1);
    },
    [clearExpansion, clearLibraryExpansion, table]
  );

  const handlePageChange = useCallback(
    (_e: any, page: number) => {
      if (!isLibraryTab) {
        table.toggleAllRowsSelected(false);
        setSelectedExpandedRowIds([]);
      } else {
        libraryTable.toggleAllRowsSelected(false);
        setSelectedExpandedLibraryRowIds([]);
      }
      setCurrentPage(page);
    },
    [isLibraryTab, table, libraryTable]
  );

  const handleSearchTrigger = useCallback(() => {
    finalizeSearchCriteria();

    const activeFilterMap = isLibraryTab
      ? LIBRARY_FILTER_MAP
      : MEASURE_FILTER_MAP;
    const selectedProperty = activeFilterMap.get(filterBy);
    let optionalSearchProperties: string[] = [];

    if (filterBy && selectedProperty) {
      optionalSearchProperties = [selectedProperty];
    } else if (!filterBy && searchField) {
      optionalSearchProperties = isLibraryTab
        ? Array.from(LIBRARY_FILTER_MAP.values())
        : Array.from(MEASURE_FILTER_MAP.values());
    }

    setSearchCriteria({ searchField, optionalSearchProperties });
    handlePageChange(null, 1);
  }, [
    finalizeSearchCriteria,
    filterBy,
    searchField,
    isLibraryTab,
    handlePageChange,
  ]);

  const handleSearchClear = useCallback(() => {
    blankSearchCriteria();
    setSearchCriteria({ searchField: "", optionalSearchProperties: [] });
  }, [blankSearchCriteria]);

  const handleLimitChange = useCallback(
    (e: any) => {
      setCurrentLimit(Number(e.target.value));
      if (!isLibraryTab) {
        table.toggleAllRowsSelected(false);
      }
      setCurrentPage(1);
    },
    [isLibraryTab, table]
  );

  const handleSort = useCallback(
    (sort: string) => {
      let nextSort = sort;
      let nextDirection: Direction = "ASC";
      if (sort === currentSort) {
        if (currentDirection === "ASC") {
          nextDirection = "DESC";
        } else if (currentDirection === "DESC") {
          nextSort = "";
          nextDirection = "";
        }
      }
      setCurrentSort(nextSort);
      setCurrentDirection(nextDirection);
      setCurrentPage(1);
      if (!isLibraryTab) {
        table.toggleAllRowsSelected(false);
      }
    },
    [isLibraryTab, currentSort, currentDirection, table]
  );

  const toggleExpandedRowSelection = useCallback(
    (id: string, checked: boolean) => {
      setSelectedExpandedRowIds((prev) =>
        checked ? [...prev, id] : prev.filter((x) => x !== id)
      );
    },
    []
  );

  const toggleExpandedLibraryRowSelection = useCallback(
    (id: string, checked: boolean) => {
      setSelectedExpandedLibraryRowIds((prev) =>
        checked ? [...prev, id] : prev.filter((x) => x !== id)
      );
    },
    []
  );

  const renderExpandedRow = useCallback(
    (parentRow: any) =>
      expandedMeasureSetId === parentRow.original.actions?.measureSetId &&
      expandedRows.map((subRow) => (
        <tr
          key={subRow.id}
          className="expanded-row"
          data-testid={`expanded-row-${subRow.id}`}
        >
          {table.getAllLeafColumns().map((col) => {
            const key = `${subRow.id}-${col.id}`;
            if (col.id === "expandArrow") return <td key={key} />;
            if (col.id === "select") {
              return (
                <td key={key}>
                  <IndeterminateCheckbox
                    checked={selectedExpandedRowIds.includes(subRow.id)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      toggleExpandedRowSelection(subRow.id, e.target.checked)
                    }
                    id={subRow.id}
                    aria-label={`Select measure ${subRow.measureName}`}
                  />
                </td>
              );
            }
            return (
              <td key={key}>
                {flexRender(col.columnDef.cell, {
                  row: { original: subRow },
                  getValue: () => (subRow as any)[col.id],
                } as any)}
              </td>
            );
          })}
        </tr>
      )),
    [
      expandedMeasureSetId,
      expandedRows,
      selectedExpandedRowIds,
      table,
      toggleExpandedRowSelection,
    ]
  );

  const renderExpandedLibraryRow = useCallback(
    (parentRow: any) =>
      expandedLibrarySetId === parentRow.original.actions?.librarySetId &&
      expandedLibraryRows.map((subRow) => (
        <tr
          key={subRow.id}
          className="expanded-row"
          data-testid={`expanded-library-row-${subRow.id}`}
        >
          {libraryTable.getAllLeafColumns().map((col) => {
            const key = `${subRow.id}-${col.id}`;
            if (col.id === "expandArrow") return <td key={key} />;
            if (col.id === "select") {
              return (
                <td key={key}>
                  <IndeterminateCheckbox
                    checked={selectedExpandedLibraryRowIds.includes(subRow.id)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      toggleExpandedLibraryRowSelection(
                        subRow.id,
                        e.target.checked
                      )
                    }
                    id={subRow.id}
                    aria-label={`Select library ${subRow.cqlLibraryName}`}
                  />
                </td>
              );
            }
            return (
              <td key={key}>
                {flexRender(col.columnDef.cell, {
                  row: { original: subRow },
                  getValue: () => (subRow as any)[col.id],
                } as any)}
              </td>
            );
          })}
        </tr>
      )),
    [
      expandedLibrarySetId,
      expandedLibraryRows,
      libraryTable,
      selectedExpandedLibraryRowIds,
      toggleExpandedLibraryRowSelection,
    ]
  );

  const activeTable = isLibraryTab ? libraryTable : table;
  const activeExpandedRowRenderer = isLibraryTab
    ? renderExpandedLibraryRow
    : renderExpandedRow;
  const activePage = isLibraryTab ? librariesPage : measuresPage;
  const activeTableId = isLibraryTab
    ? "userProfileLibrariesTable"
    : "userProfileMeasuresTable";
  const activeTableTestId = isLibraryTab
    ? "user-profile-libraries-tbl"
    : "user-profile-measures-tbl";

  /*
    Delete is enabled only when exactly one top-level (latest) measure is
    selected. Any expanded sub-row (older version) selection, or more than one
    selection across the two rows disables it. A measure used as a
    component in one or more composite measures also cannot be deleted.
  */
  const selectedTopLevelRows = isLibraryTab
    ? libraryTable.getSelectedRowModel().rows
    : table.getSelectedRowModel().rows;
  const totalSelected =
    selectedTopLevelRows.length +
    (isLibraryTab
      ? selectedExpandedLibraryRowIds.length
      : selectedExpandedRowIds.length);
  const singleTopSelected =
    totalSelected === 1 && selectedTopLevelRows.length === 1;
  const selectedIsComponent =
    singleTopSelected && selectedTopLevelRows[0].original.actions?.component;
  const canDelete = singleTopSelected && !selectedIsComponent;
  const deleteDisabledReason = selectedIsComponent
    ? COMPONENT_DELETE_DISABLED_MSG
    : undefined;

  const draftOrVersionLabel = deleteTarget?.measureMetaData?.draft
    ? "draft"
    : `version ${deleteTarget?.version}`;

  const libraryDraftOrVersionLabel = deleteTarget?.draft
    ? "draft"
    : `version ${deleteTarget?.version}`;

  const openDeleteDialog = useCallback(() => {
    const rows = isLibraryTab
      ? libraryTable.getSelectedRowModel().rows
      : table.getSelectedRowModel().rows;

    const expandedSelectionCount = isLibraryTab
      ? selectedExpandedLibraryRowIds.length
      : selectedExpandedRowIds.length;

    if (rows.length === 1 && expandedSelectionCount === 0) {
      setDeleteTarget(rows[0].original.actions);
      setDeleteDialogOpen(true);
    }
  }, [
    isLibraryTab,
    table,
    libraryTable,
    selectedExpandedRowIds,
    selectedExpandedLibraryRowIds,
  ]);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    const id = deleteTarget.id;
    const isDraft = !!deleteTarget?.measureMetaData?.draft;
    const owner = deleteTarget?.measureSet?.owner;

    try {
      if (isDraft) {
        await measureServiceApi.deleteMeasure(id);
      } else {
        await measureServiceApi.adminDeleteMeasure(id, owner);
      }

      setToastType("success");
      setToastMessage("Measure successfully deleted");
      setToastOpen(true);
      closeDeleteDialog();
      table.toggleAllRowsSelected(false);
      clearExpansion();
      setRefreshToken((t) => t + 1);
    } catch (err: any) {
      setToastType("danger");
      setToastMessage(err?.message || "Unable to delete measure");
      setToastOpen(true);
      closeDeleteDialog();
    }
  }, [
    deleteTarget,
    measureServiceApi,
    closeDeleteDialog,
    clearExpansion,
    table,
  ]);

  const selectedMeasures = useMemo(() => {
    const topLevel = selectedTopLevelRows.map((row) => row.original.actions);
    const expanded = expandedRows
      .filter((row) => selectedExpandedRowIds.includes(row.id))
      .map((row) => row.actions);
    return [...topLevel, ...expanded];
  }, [selectedTopLevelRows, expandedRows, selectedExpandedRowIds]);

  const selectedLibraryRows = libraryTable.getSelectedRowModel().rows;
  const selectedLibraries = useMemo(
    () => [
      ...selectedLibraryRows.map((row) => row.original.actions),

      ...expandedLibraryRows
        .filter((row) => selectedExpandedLibraryRowIds.includes(row.id))
        .map((row) => row.actions),
    ],
    [selectedLibraryRows, expandedLibraryRows, selectedExpandedLibraryRowIds]
  );
  const handleConfirmDeleteLibrary = useCallback(async () => {
    if (!deleteTarget) return;

    const { id, draft } = deleteTarget;

    try {
      if (draft) {
        await cqlLibraryServiceApi.deleteDraft(id);
      } else {
        await cqlLibraryServiceApi.deleteLibrary(id, userName);
      }

      setToastType("success");
      setToastMessage("Library successfully deleted");
      setToastOpen(true);

      closeDeleteDialog();
      libraryTable.toggleAllRowsSelected(false);
      clearLibraryExpansion();
      setRefreshToken((t) => t + 1);
    } catch (error: any) {
      setToastType("danger");
      setToastMessage(error?.message || "Unable to delete library");
      setToastOpen(true);
      closeDeleteDialog();
    }
  }, [
    deleteTarget,
    cqlLibraryServiceApi,
    clearLibraryExpansion,
    closeDeleteDialog,
    libraryTable,
    harpId,
    getUserName,
  ]);
  const handleContinueDialog = useCallback(() => {
    setDownloadState(null);
    setFailureMessage(null);
  }, []);

  const handleCancelDialog = useCallback(() => {
    abortController.current && abortController.current.abort();
    handleContinueDialog();
  }, [handleContinueDialog]);

  const exportMeasure = useCallback(
    async (elmErrorSeverity: string) => {
      setViewHRModalOpen(false);
      try {
        const measure = await measureServiceApi.fetchMeasure(
          targetMeasure.current?.id
        );
        await downloadMeasureExport(
          setFailureMessage,
          setDownloadState,
          abortController,
          measure,
          measureServiceApi,
          setToastOpen,
          setToastType as (type: string) => void,
          setToastMessage,
          elmErrorSeverity
        );
      } catch (error) {
        console.error("Error fetching measure:", error);
        setFailureMessage("Failed to fetch measure");
      }
    },
    [measureServiceApi]
  );

  const handleExport = useCallback(
    (exportType: string) => {
      targetMeasure.current = selectedMeasures[0];
      const elmErrorSeverity =
        exportType === "Publishable Export" ? "Error" : "Info";
      exportMeasure(elmErrorSeverity);
    },
    [selectedMeasures, exportMeasure]
  );

  const handleViewHumanReadable = useCallback(() => {
    targetMeasure.current = selectedMeasures[0];
    setViewHRModalOpen(true);
  }, [selectedMeasures]);

  const handleViewHistory = useCallback(() => {
    setViewHistoryDialogOpen(true);
  }, []);

  const handleCompareVersions = useCallback(() => {
    setCompareVersionsDialogOpen(true);
  }, []);

  const handleViewLibraryHistory = useCallback(() => {
    setLibraryHistoryDialogOpen(true);
  }, []);

  const handleCompareLibraryVersions = useCallback(() => {
    setLibraryCompareVersionsDialogOpen(true);
  }, []);

  const handleLibraryTransfer = useCallback(() => {
    setLibraryTransferDialogOpen(true);
  }, []);

  const handleShare = useCallback(
    (option: string) => {
      const resolvedOption =
        option === "Unshare" && activeTab === 1 ? "UnshareFromMe" : option;
      setShareOption(resolvedOption);
      setShareDialogOpen(true);
    },
    [activeTab]
  );

  const handleShareDialogClose = useCallback(() => {
    setShareDialogOpen(false);
    setShareOption("");
  }, []);

  const handleShareDialogSave = useCallback(
    ({ toastType = "danger", toastMessage = "", toastOpen = false } = {}) => {
      handleShareDialogClose();
      setToastType(toastType as "success" | "danger");
      setToastMessage(toastMessage);
      setToastOpen(toastOpen);
      table.toggleAllRowsSelected(false);
      clearExpansion();
      setRefreshToken((t) => t + 1);
    },
    [handleShareDialogClose, table, clearExpansion]
  );

  const handleTransfer = useCallback(() => {
    setTransferDialogOpen(true);
  }, []);

  // TransferDialog signals both cancel and success/failure via onClose; refresh
  // the list only when a transfer actually happened (when toastType is "success").
  const handleTransferDialogClose = useCallback(
    ({ toastType = "danger", toastMessage = "", toastOpen = false } = {}) => {
      setTransferDialogOpen(false);
      setToastType(toastType as "success" | "danger");
      setToastMessage(toastMessage);
      setToastOpen(toastOpen);
      if (toastType === "success") {
        table.toggleAllRowsSelected(false);
        clearExpansion();
        setRefreshToken((t) => t + 1);
      }
    },
    [table, clearExpansion]
  );

  const [libraryShareDialogOpen, setLibraryShareDialogOpen] = useState(false);

  const [libraryShareOption, setLibraryShareOption] = useState("");

  const handleLibraryShare = useCallback((option: string) => {
    setLibraryShareOption(option);
    setLibraryShareDialogOpen(true);
  }, []);

  const handleLibraryShareDialogClose = useCallback(
    (toastType?: "success" | "danger", toastMessage?: string) => {
      setLibraryShareDialogOpen(false);
      setLibraryShareOption("");

      if (toastMessage) {
        setToastType(toastType ?? "success");
        setToastMessage(toastMessage);
        setToastOpen(true);
      }

      if (toastType === "success") {
        libraryTable.toggleAllRowsSelected(false);
        clearLibraryExpansion();
        setRefreshToken((t) => t + 1);
      }
    },
    [libraryTable, clearLibraryExpansion]
  );

  const handleLibraryTransferDialogClose = useCallback(
    ({ toastType = "danger", toastMessage = "", toastOpen = false } = {}) => {
      setLibraryTransferDialogOpen(false);
      setToastType(toastType as "success" | "danger");
      setToastMessage(toastMessage);
      setToastOpen(toastOpen);
      if (toastType === "success") {
        libraryTable.toggleAllRowsSelected(false);
        clearLibraryExpansion();
        setRefreshToken((t) => t + 1);
      }
    },
    [libraryTable, clearLibraryExpansion]
  );

  return (
    <div className="user-profile" data-testid="user-profile">
      <div className="user-profile-header">
        <div className="user-measure-table">
          <section className="tabs-section">
            <Tabs value={activeTab} onChange={handleTabChange} type="B">
              <Tab
                type="B"
                label={`Owned Measures (${counts.OWNED_MEASURE})`}
                data-testid="owned-measures-tab"
              />
              <Tab
                type="B"
                label={`Shared Measures (${counts.SHARED_MEASURE})`}
                data-testid="shared-measures-tab"
              />
              <Tab
                type="B"
                label={`Owned Libraries (${counts.OWNED_LIBRARY})`}
                data-testid="owned-libraries-tab"
              />
              <Tab
                type="B"
                label={`Shared Libraries (${counts.SHARED_LIBRARY})`}
                data-testid="shared-libraries-tab"
              />
            </Tabs>
          </section>
          {featureFlags?.AdminUserProfile && (
            <div className="search-filter-bar" data-testid="search-filter-bar">
              <SearchAndFilter
                filterBy={filterBy}
                searchField={searchField}
                onFilterChange={handleFilter}
                onSearchChange={handleSearch}
                onSearchTrigger={handleSearchTrigger}
                onSearchClear={handleSearchClear}
                filterByOpts={
                  isLibraryTab ? LIBRARY_FILTER_OPTIONS : MEASURE_FILTER_OPTIONS
                }
                textFieldID="user-profile-measures"
              />
              {!isLibraryTab && (
                <ActionCenter
                  measures={selectedMeasures}
                  canDelete={canDelete}
                  activeTab={activeTab}
                  onDelete={openDeleteDialog}
                  onExport={handleExport}
                  onViewHumanReadable={handleViewHumanReadable}
                  onViewHistory={handleViewHistory}
                  onCompareVersions={handleCompareVersions}
                  onShare={handleShare}
                  onTransfer={handleTransfer}
                  disabledReason={deleteDisabledReason}
                />
              )}
            </div>
          )}
          {featureFlags?.AdminUserProfile && isLibraryTab && (
            <div
              className="search-filter-bar flex-end"
              data-testid="search-filter-bar"
            >
              <LibraryActionCenter
                libraries={selectedLibraries}
                activeTab={activeTab - 2}
                onDelete={openDeleteDialog}
                onShare={handleLibraryShare}
                onTransfer={handleLibraryTransfer}
                onViewHistory={handleViewLibraryHistory}
                onCompareVersions={handleCompareLibraryVersions}
                disabledReason={deleteDisabledReason}
                canDelete={canDelete}
                userName={getUserName()}
              />
            </div>
          )}

          {errMsg && !loading && (
            <p
              className="error-message"
              data-testid="measures-error-message"
              role="alert"
            >
              {errMsg}
            </p>
          )}

          <div style={{ display: loading ? "none" : "block" }}>
            <div className="table">
              <MadieTable
                table={activeTable}
                currentSort={currentSort}
                currentDirection={currentDirection}
                handleSort={handleSort}
                id={activeTableId}
                dataTestId={activeTableTestId}
                renderExpandedRow={activeExpandedRowRenderer}
              />
            </div>

            <div className="pagination-container">
              <Pagination
                totalItems={activePage.totalElements}
                visibleItems={activePage.visibleItems}
                limitOptions={[10, 25, 50]}
                offset={activePage.offset}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                page={currentPage}
                limit={currentLimit}
                count={activePage.totalPages}
                shape="rounded"
                hideNextButton={currentPage >= activePage.totalPages}
                hidePrevButton={currentPage <= 1}
              />
            </div>
          </div>

          {loading && (
            <div
              className="loading-container"
              data-testid="measures-loading-spinner"
            >
              <MadieSpinner style={{ height: 50, width: 50 }} />
            </div>
          )}
        </div>
      </div>

      <MadieDeleteDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onContinue={
          isLibraryTab ? handleConfirmDeleteLibrary : handleConfirmDelete
        }
        dialogTitle={isLibraryTab ? "Delete Library" : "Delete Measure"}
        statement
        customDialogBody={
          <>
            Are you sure you want to delete{" "}
            {isLibraryTab ? (
              <>
                {libraryDraftOrVersionLabel} of{" "}
                <span className="strong">{deleteTarget?.cqlLibraryName}</span>
              </>
            ) : (
              <>
                {draftOrVersionLabel} of{" "}
                <span className="strong">{deleteTarget?.measureName}</span>
              </>
            )}
          </>
        }
      />

      <ExportDialog
        failureMessage={failureMessage}
        measureName={targetMeasure?.current?.measureName}
        downloadState={downloadState}
        open={Boolean(downloadState)}
        handleContinueDialog={handleContinueDialog}
        handleCancelDialog={handleCancelDialog}
      />

      <ViewHRModal
        open={viewHRModalOpen}
        onClose={() => setViewHRModalOpen(false)}
        measureId={targetMeasure?.current?.id}
        exportMeasure={exportMeasure}
      />

      <ViewMeasureHistoryDialog
        measures={selectedMeasures}
        open={viewHistoryDialogOpen}
        onClose={() => setViewHistoryDialogOpen(false)}
      />

      <CompareVersionsDialog
        measures={selectedMeasures}
        open={compareVersionsDialogOpen}
        onClose={() => setCompareVersionsDialogOpen(false)}
      />

      <ShareDialog
        measures={selectedMeasures}
        open={shareDialogOpen}
        option={shareOption}
        onClose={handleShareDialogClose}
        onSave={handleShareDialogSave}
        unshareFromUser={harpId}
        isAdmin
      />
      <LibraryShareDialog
        libraries={selectedLibraries}
        open={libraryShareDialogOpen}
        option={libraryShareOption}
        onClose={handleLibraryShareDialogClose}
      />

      <LibraryHistoryDialog
        libraries={selectedLibraries}
        open={libraryHistoryDialogOpen}
        onClose={() => setLibraryHistoryDialogOpen(false)}
      />

      <LibraryCompareVersionsDialog
        libraries={selectedLibraries}
        open={libraryCompareVersionsDialogOpen}
        onClose={() => setLibraryCompareVersionsDialogOpen(false)}
      />

      <LibraryTransferDialog
        libraries={selectedLibraries}
        open={libraryTransferDialogOpen}
        onClose={handleLibraryTransferDialogClose}
        setStatusHandler={() => {}}
      />

      <TransferDialog
        measures={selectedMeasures}
        open={transferDialogOpen}
        onClose={handleTransferDialogClose}
        setStatusHandler={() => {}}
        isAdminTransfer
      />

      <Toast
        toastKey="user-profile-delete-toast"
        aria-live="polite"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "delete-measure-error-message"
            : "delete-measure-success-message"
        }
        closeButtonProps={{
          "data-testid": "close-toast-button",
        }}
        open={toastOpen}
        message={toastMessage}
        onClose={() => setToastOpen(false)}
        autoHideDuration={6000}
      />
    </div>
  );
};

export default UserProfile;
