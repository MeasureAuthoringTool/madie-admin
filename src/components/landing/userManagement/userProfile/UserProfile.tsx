import React, { HTMLProps, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useUserServiceApi, adminUserStore } from "@madie/madie-util";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  MadieTable,
  Pagination,
  Tab,
  Tabs,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import { Button, Chip } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { formatCmsId } from "../../../../utils/cmsIdFormatter";
import "./UserProfile.scss";

const isAbortError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: string };
  return e.name === "AbortError" || e.code === "ERR_CANCELED";
};

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

type MeasureRow = {
  id: string;
  measureName: string;
  version: string;
  model: string;
  actions: any;
};

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

  const [activeTab, setActiveTab] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentLimit, setCurrentLimit] = useState<number>(10);

  const measureList: any[] = [];
  const ownedCount = 0;
  const sharedCount = 0;

  // Until the backend wiring lands, these are static placeholders so the
  // pagination control still mirrors the Measures landing page layout.
  const totalItems = 0;
  const visibleItems = 0;
  const totalPages = 0;
  const offset = 0;

  useEffect(() => {
    const controller = new AbortController();
    userServiceApi
      .getUser(harpId, controller.signal)
      .then((user) => {
        adminUserStore.updateUser(user);
      })
      .catch((err: unknown) => {
        if (!isAbortError(err)) {
          adminUserStore.updateUser(null);
        }
      });
    return () => {
      controller.abort();
    };
  }, [harpId, userServiceApi]);

  const data = useMemo<MeasureRow[]>(
    () =>
      measureList.map((m) => ({
        id: m?.id,
        measureName: m?.measureName,
        version: m?.version,
        model: m?.model,
        actions: m,
      })),
    [measureList]
  );

  const columns = useMemo<ColumnDef<MeasureRow>[]>(() => {
    const cols: ColumnDef<MeasureRow>[] = [
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
        enableSorting: false,
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
    ];

    cols.push({
      header: "Shared",
      accessorKey: "measureSet.acls",
      enableSorting: false,
      cell: (info) => (
        <div
          data-testid={`measure-shared-${info.row.original.id}`}
          aria-label={
            info.row.original.actions?.measureSet?.acls?.length > 0
              ? "Shared"
              : "Not shared"
          }
        >
          {info.row.original.actions?.measureSet?.acls?.length > 0 && (
            <CheckCircleOutlineIcon sx={{ color: "#4CAF50" }} />
          )}
        </div>
      ),
    });

    cols.push({
      header: "CMS ID",
      accessorKey: "measureSet.cmsId",
      enableSorting: false,
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
    });

    cols.push({
      header: "Updated",
      accessorKey: "lastModifiedAt",
      enableSorting: false,
      cell: (info) => (
        <span data-testid={`measure-updated-${info.row.original.id}`}>
          {info.row.original.actions?.lastModifiedAt
            ? new Date(
                info.row.original.actions.lastModifiedAt
              ).toLocaleDateString()
            : ""}
        </span>
      ),
    });

    cols.push({
      id: "action",
      header: "",
      enableSorting: false,
      cell: (info) => (
        <Button
          variant="outlined"
          size="small"
          data-testid={`measure-action-view-${info.row.original.id}`}
          aria-label={`View Measure ${info.row.original.measureName}`}
        >
          View
        </Button>
      ),
    });

    return cols;
  }, []);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    table.toggleAllRowsSelected(false);
  }, [activeTab, table]);

  const handleTabChange = (_e: any, nextTab: number) => {
    setActiveTab(nextTab);
    setCurrentPage(1);
  };

  const handlePageChange = (_e: any, page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (e: any) => {
    setCurrentLimit(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="user-profile" data-testid="user-profile">
      <div className="user-profile-header">
        <div className="user-measure-table">
          <section className="tabs-section">
            <Tabs value={activeTab} onChange={handleTabChange} type="B">
              <Tab
                type="B"
                label={`Owned Measures (${ownedCount})`}
                data-testid="owned-measures-tab"
              />
              <Tab
                type="B"
                label={`Shared Measures (${sharedCount})`}
                data-testid="shared-measures-tab"
              />
            </Tabs>
          </section>

          <div className="table">
            <MadieTable
              table={table}
              currentSort=""
              currentDirection=""
              handleSort={() => undefined}
              id="userProfileMeasuresTable"
              dataTestId="user-profile-measures-tbl"
            />

            <div className="pagination-container">
              <Pagination
                totalItems={totalItems}
                visibleItems={visibleItems}
                limitOptions={[10, 25, 50]}
                offset={offset}
                handlePageChange={handlePageChange}
                handleLimitChange={handleLimitChange}
                page={currentPage}
                limit={currentLimit}
                count={totalPages}
                shape="rounded"
                hideNextButton={currentPage >= totalPages}
                hidePrevButton={currentPage <= 1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
