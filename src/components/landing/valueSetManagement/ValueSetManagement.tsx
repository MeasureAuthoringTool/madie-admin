import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Toast,
  Pagination,
  MadieTable,
  TextField,
} from "@madie/madie-design-system/dist/react";
import useTerminologyServiceApi, {
  type ValueSetDisplayForAdmin,
} from "../../../api/useTerminologyServiceApi";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import CheckIcon from "@mui/icons-material/Check";
import "twin.macro";
import "styled-components/macro";
import "./ValueSetManagement.scss";
import VSEDialog from "./VSEDialog";
import { InputAdornment, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

export default function ValueSetManagement() {
  const terminologyServiceApi = useRef(useTerminologyServiceApi()).current;

  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastType, setToastType] = useState<string>("success");
  const [toastMessage, setToastMessage] = useState<string>("");

  const [valueSets, setValueSets] = useState<ValueSetDisplayForAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);

  // future search/filter implementation
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");

  const onSearchTrigger = () => {
    setAppliedSearchText(searchText.trim());
    setPage(1);
  };
  // MadieTable sorting
  const [currentSort, setCurrentSort] = useState<string>("url");
  const [currentDirection, setCurrentDirection] = useState<string>("ASC");

  const [targetVSE, setTargetVSE] = useState<null | string>(null);

  useEffect(() => {
    const loadValueSets = async () => {
      try {
        setLoading(true);

        const sortInfo = currentSort
          ? `${currentSort},${currentDirection === "DESC"}`
          : undefined;

        const response = await terminologyServiceApi.getValueSets(
          page - 1,
          limit,
          sortInfo,
          appliedSearchText
        );

        setValueSets(response.content);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalElements);
        setVisibleItems(response.numberOfElements);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An error occurred while loading value sets.";

        setToastType("danger");
        setToastMessage(errorMessage);
        setToastOpen(true);
      } finally {
        setLoading(false);
      }
    };

    loadValueSets().catch((error) => {
      console.error(error);
    });
  }, [
    terminologyServiceApi,
    page,
    limit,
    currentSort,
    currentDirection,
    appliedSearchText,
  ]);
  const handleSort = (sort: string) => {
    let sortChange = "";
    let directionChange = "";

    if (sort === currentSort) {
      if (currentDirection === "ASC") {
        sortChange = sort;
        directionChange = "DESC";
      }
    } else {
      sortChange = sort;
      directionChange = "ASC";
    }

    setCurrentSort(sortChange);
    setCurrentDirection(directionChange);
    setPage(1);
  };

  const columns = useMemo<ColumnDef<ValueSetDisplayForAdmin>[]>(
    () => [
      {
        header: "URL",
        accessorKey: "url",
      },
      {
        header: "Last Updated",
        accessorKey: "lastUpdated",
        cell: (info) => {
          const value = info.getValue() as string;
          return value ? new Date(value).toLocaleString() : "-";
        },
      },
      {
        header: "Manually Modified",
        accessorKey: "manuallyModified",
        cell: (info) =>
          info.getValue() ? (
            <CheckIcon data-testid="manual-modified-check" />
          ) : (
            "-"
          ),
      },
      {
        header: "Action",
        accessorKey: "action",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="outline-secondary"
            data-testId={`open-vs-${row.original.id}`}
            onClick={() => {
              setTargetVSE(row.original.valueSet);
            }}
          >
            View Expansions
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: valueSets,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const handleUpdateValueSets = async () => {
    setToastOpen(false);
    try {
      await terminologyServiceApi.updateValueSets();
      setToastType("success");
      setToastMessage("VSES update has started");
      setToastOpen(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while updating VSES.";
      setToastType("danger");
      setToastMessage(errorMessage);
      setToastOpen(true);
    }
  };

  const onToastClose = () => {
    setToastOpen(false);
  };

  return (
    <div className="value-set-management" data-testid="value-set-management">
      <div className="value-set-management-card">
        <Button
          data-testid="update-vses-data-button"
          onClick={handleUpdateValueSets}
        >
          Update VSES Data
        </Button>
      </div>
      {/* to put in later likely when sticky styling is required. */}
      {/* <div style={{ overflow: "auto", maxHeight: "800px" }}> */}
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 16,
            backgroundColor: "#fff",
            alignItems: "end",
            position: "sticky",
            top: 0,
            zIndex: 20,
            maxWidth: "500px",
          }}
        >
          <TextField
            id="search"
            label="Search"
            placeholder="Search"
            inputProps={{
              "data-testid": `vs-list-search-input`,
            }}
            data-testid="vs-search"
            name="searchField"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearchTrigger();
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment
                    position="start"
                    data-testid={`vs-trigger-search`}
                    onClick={onSearchTrigger}
                    style={{ cursor: "pointer" }}
                  >
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment
                    data-testid={`vs-clear-search`}
                    position="end"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSearchText("");
                      setAppliedSearchText("");
                      setPage(1);
                    }}
                  >
                    <IconButton>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </div>

        {loading ? (
          <p data-testid="loading-message" className="loading-message">
            Loading value sets...
          </p>
        ) : table.getRowModel().rows.length > 0 ? (
          <>
            <div
              style={{
                overflow: "auto",
              }}
            >
              <MadieTable
                table={table}
                currentSort={currentSort}
                currentDirection={currentDirection}
                handleSort={handleSort}
                id="valueSetTable"
                dataTestId="value-set-table"
              />
            </div>

            <Pagination
              totalItems={totalItems}
              visibleItems={visibleItems}
              limitOptions={[10, 25, 50]}
              offset={(page - 1) * limit}
              page={page}
              limit={limit}
              count={totalPages}
              shape="rounded"
              hideNextButton={page >= totalPages}
              hidePrevButton={page <= 1}
              handlePageChange={(_, value) => {
                setPage(value);
              }}
              handleLimitChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            />
          </>
        ) : (
          <p
            data-testid="no-value-sets-message"
            className="no-value-sets-message"
          >
            No value sets found.
          </p>
        )}
        <VSEDialog
          open={!!targetVSE}
          onClose={() => {
            setTargetVSE(null);
          }}
          targetVSE={targetVSE}
        />

        <Toast
          toastKey="value-set-management-toast"
          aria-live="polite"
          toastType={toastType}
          testId={
            toastType === "danger"
              ? "update-vses-error-message"
              : "update-vses-success-message"
          }
          closeButtonProps={{
            "data-testid": "close-toast-button",
          }}
          open={toastOpen}
          message={toastMessage}
          onClose={onToastClose}
          autoHideDuration={6000}
        />
      </div>
    </div>
  );
}
