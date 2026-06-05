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
  adminUserStore,
} from "@madie/madie-util";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Button,
  MadieSpinner,
  MadieTable,
  Pagination,
  Tab,
  Tabs,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import { Chip } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  CollapseIcon,
  ExpandIcon,
} from "../../../../icons/MeasureListTableRightArrowIcons";
import { formatCmsId } from "../../../../utils/cmsIdFormatter";
import "./UserProfile.scss";

type Ownership = "OWNED" | "SHARED";
type Direction = "ASC" | "DESC" | "";

type MeasureRow = {
  id: string;
  measureName: string;
  version: string;
  model: string;
  actions: any;
  hasAssociatedMeasures: boolean;
};

type ListState = {
  measures: any[];
  totalElements: number;
  visibleItems: number;
  totalPages: number;
  offset: number;
};

const DEFAULT_SEARCH_CRITERIA = {
  searchField: "",
  optionalSearchProperties: [],
};

const EMPTY_LIST_STATE: ListState = {
  measures: [],
  totalElements: 0,
  visibleItems: 0,
  totalPages: 0,
  offset: 0,
};

const ownershipForTab = (tab: number): Ownership =>
  tab === 1 ? "SHARED" : "OWNED";

const isAbortError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: string };
  return e.name === "AbortError" || e.code === "ERR_CANCELED";
};

const transformRow = (m: any): MeasureRow => ({
  id: m?.id,
  measureName: m?.measureName,
  version: m?.version,
  model: m?.model,
  actions: m,
  hasAssociatedMeasures: !!m?.hasAssociatedMeasures,
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
  </div>
);

const UserProfile = () => {
  const { harpId } = useParams<{ harpId: string }>() as { harpId: string };
  const userServiceApi = useRef(useUserServiceApi()).current;
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(10);
  const [currentSort, setCurrentSort] = useState("");
  const [currentDirection, setCurrentDirection] = useState<Direction>("");

  const [list, setList] = useState<ListState>(EMPTY_LIST_STATE);
  const [counts, setCounts] = useState<Record<Ownership, number>>({
    OWNED: 0,
    SHARED: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [expandedMeasureSetId, setExpandedMeasureSetId] = useState<
    string | null
  >(null);
  const [expandedRows, setExpandedRows] = useState<MeasureRow[]>([]);
  const [selectedExpandedRowIds, setSelectedExpandedRowIds] = useState<
    string[]
  >([]);
  const expandedMeasureSetIdRef = useRef<string | null>(null);
  useEffect(() => {
    expandedMeasureSetIdRef.current = expandedMeasureSetId;
  }, [expandedMeasureSetId]);

  const clearExpansion = useCallback(() => {
    setExpandedMeasureSetId(null);
    setExpandedRows([]);
    setSelectedExpandedRowIds([]);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    userServiceApi
      .getUser(harpId, controller.signal)
      .then((user) => adminUserStore.updateUser(user))
      .catch((err: unknown) => {
        if (!isAbortError(err)) adminUserStore.updateUser(null);
      });
    return () => controller.abort();
  }, [harpId, userServiceApi]);

  const requestIdRef = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    const active = ownershipForTab(activeTab);
    const inactive: Ownership = active === "OWNED" ? "SHARED" : "OWNED";
    setLoading(true);
    setErrMsg("");

    const dataPromise = measureServiceApi.adminSearchMeasuresForUser(
      harpId,
      [active],
      currentLimit,
      currentPage - 1,
      currentSort || "lastModifiedAt",
      currentDirection || "DESC",
      DEFAULT_SEARCH_CRITERIA,
      controller
    );
    const countPromise = measureServiceApi.adminSearchMeasuresForUser(
      harpId,
      [inactive],
      1,
      0,
      "lastModifiedAt",
      "DESC",
      DEFAULT_SEARCH_CRITERIA,
      controller
    );

    Promise.allSettled([dataPromise, countPromise]).then((results) => {
      if (requestId !== requestIdRef.current) return;

      const [dataRes, countRes] = results;
      let activeTotal = 0;

      if (dataRes.status === "fulfilled") {
        const d = dataRes.value;
        activeTotal = d?.totalElements ?? 0;
        setList({
          measures: d?.content ?? [],
          totalElements: activeTotal,
          totalPages: d?.totalPages ?? 0,
          visibleItems: d?.numberOfElements ?? 0,
          offset: d?.pageable?.offset ?? 0,
        });
      } else if (!isAbortError(dataRes.reason)) {
        setErrMsg(dataRes.reason?.message || "Unable to load measures");
        setList(EMPTY_LIST_STATE);
      }

      const inactiveTotal =
        countRes.status === "fulfilled"
          ? countRes.value?.totalElements ?? 0
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
    activeTab,
    currentPage,
    currentLimit,
    currentSort,
    currentDirection,
    measureServiceApi,
  ]);

  const data = useMemo<MeasureRow[]>(
    () => list.measures.map(transformRow),
    [list.measures]
  );

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
              {shared && <CheckCircleOutlineIcon sx={{ color: "#4CAF50" }} />}
            </div>
          );
        },
      },
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
        cell: (info) => (
          <Button
            variant="outline-filled"
            data-testid={`measure-action-${info.row.original.id}`}
            aria-label={`View Measure ${info.row.original.measureName} ${info.row.original.version}`}
            tabIndex={0}
            role="button"
          >
            View
          </Button>
        ),
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
    [expandedMeasureSetId, toggleExpansion]
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleTabChange = useCallback(
    (_e: any, nextTab: number) => {
      setActiveTab(nextTab);
      clearExpansion();
      table.toggleAllRowsSelected(false);
      setCurrentPage(1);
    },
    [clearExpansion, table]
  );

  const handlePageChange = useCallback(
    (_e: any, page: number) => {
      table.toggleAllRowsSelected(false);
      setSelectedExpandedRowIds([]);
      setCurrentPage(page);
    },
    [table]
  );

  const handleLimitChange = useCallback(
    (e: any) => {
      setCurrentLimit(Number(e.target.value));
      table.toggleAllRowsSelected(false);
      setCurrentPage(1);
    },
    [table]
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
      table.toggleAllRowsSelected(false);
    },
    [currentSort, currentDirection, table]
  );

  const toggleExpandedRowSelection = useCallback(
    (id: string, checked: boolean) => {
      setSelectedExpandedRowIds((prev) =>
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

  return (
    <div className="user-profile" data-testid="user-profile">
      <div className="user-profile-header">
        <div className="user-measure-table">
          <section className="tabs-section">
            <Tabs value={activeTab} onChange={handleTabChange} type="B">
              <Tab
                type="B"
                label={`Owned Measures (${counts.OWNED})`}
                data-testid="owned-measures-tab"
              />
              <Tab
                type="B"
                label={`Shared Measures (${counts.SHARED})`}
                data-testid="shared-measures-tab"
              />
            </Tabs>
          </section>

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
                table={table}
                currentSort={currentSort}
                currentDirection={currentDirection}
                handleSort={handleSort}
                id="userProfileMeasuresTable"
                dataTestId="user-profile-measures-tbl"
                renderExpandedRow={renderExpandedRow}
              />
            </div>

            <div className="pagination-container">
              <Pagination
                totalItems={list.totalElements}
                visibleItems={list.visibleItems}
                limitOptions={[10, 25, 50]}
                offset={list.offset}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                page={currentPage}
                limit={currentLimit}
                count={list.totalPages}
                shape="rounded"
                hideNextButton={currentPage >= list.totalPages}
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
    </div>
  );
};

export default UserProfile;
