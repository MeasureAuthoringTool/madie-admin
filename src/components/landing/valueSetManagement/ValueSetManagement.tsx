import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Toast,
  Pagination,
  MadieDeleteDialog,
  MadieTable,
  TextField,
} from "@madie/madie-design-system/dist/react";
import {
  type ValueSetDisplayForAdmin,
  useTerminologyServiceApi,
} from "@madie/madie-util";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import CheckIcon from "@mui/icons-material/Check";
import "twin.macro";
import "styled-components/macro";
import "./ValueSetManagement.scss";
import VSEDialog, { EditValueSetFormValues } from "./VSEDialog";
import AddValueSetDialog, {
  type AddValueSetFormValues,
} from "./AddValueSetDialog";
import { InputAdornment, IconButton } from "@mui/material";
import { Trash2 } from "lucide-react";
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
  const [limit, setLimit] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [reloadCounter, setReloadCounter] = useState<number>(0);

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

  const [targetValueSet, setTargetValueSet] =
    useState<ValueSetDisplayForAdmin | null>(null);
  const [isAddValueSetDialogOpen, setIsAddValueSetDialogOpen] =
    useState<boolean>(false);

  const [valueSetToDelete, setValueSetToDelete] =
    useState<ValueSetDisplayForAdmin | null>();

  const handleDeleteValueSet = async (valueSetId: string) => {
    try {
      const { status } = await terminologyServiceApi.deleteValueSet(valueSetId);

      if (status === 204) {
        setToastType("success");
        setToastMessage("Value set deleted successfully.");
        setToastOpen(true);

        setReloadCounter((current) => current + 1);
      }
    } catch (err) {
      console.error("Error deleting value set:", err);

      setToastType("danger");
      setToastMessage("An error occurred while deleting the value set.");
      setToastOpen(true);
    }
  };

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
    reloadCounter,
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
            data-testid={`open-vs-${row.original.id}`}
            onClick={() => {
              setTargetValueSet(row.original);
            }}
          >
            Edit Value Set
          </Button>
        ),
      },
      {
        header: "Delete",
        accessorKey: "delete",
        enableSorting: false,
        cell: ({ row }) => (
          <IconButton
            size="small"
            onClick={() => setValueSetToDelete(row.original)}
            data-testid={`delete-component-${row.original.id}`}
          >
            <Trash2 size={20} color="#D92F2F" />
          </IconButton>
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

  const handleAddValueSet = async ({
    url,
    version,
    valueSet,
  }: AddValueSetFormValues) => {
    setToastOpen(false);

    try {
      await terminologyServiceApi.addValueSet({
        url,
        version: version || undefined,
        valueSet,
        lastUpdated: new Date().toISOString(),
        manuallyModified: true,
      });

      setIsAddValueSetDialogOpen(false);
      setToastType("success");
      setToastMessage("Value set added successfully.");
      setToastOpen(true);
      setPage(1);
      setReloadCounter((currentValue) => currentValue + 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while adding the value set.";

      setToastType("danger");
      setToastMessage(errorMessage);
      setToastOpen(true);
    }
  };

  const handleEditValueSet = async ({
    id,
    url,
    version,
    valueSet,
  }: EditValueSetFormValues) => {
    setToastOpen(false);

    try {
      await terminologyServiceApi.updateValueSet({
        id,
        url,
        version: version || undefined,
        valueSet,
        lastUpdated: new Date().toISOString(),
        manuallyModified: true,
      });

      setTargetValueSet(null);
      setToastType("success");
      setToastMessage("Value set updated successfully.");
      setToastOpen(true);
      setReloadCounter((currentValue) => currentValue + 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while updating the value set.";

      setToastType("danger");
      setToastMessage(errorMessage);
      setToastOpen(true);
    }
  };

  return (
    <div className="value-set-management" data-testid="value-set-management">
      <div className="value-set-management-card">
        <Button
          data-testid="open-add-value-set-modal-button"
          onClick={() => {
            setIsAddValueSetDialogOpen(true);
          }}
        >
          Add New Valueset Data
        </Button>
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
            No results found.
          </p>
        )}
        <VSEDialog
          open={!!targetValueSet}
          onClose={() => {
            setTargetValueSet(null);
          }}
          targetValueSet={targetValueSet}
          onSubmit={handleEditValueSet}
        />

        <AddValueSetDialog
          open={isAddValueSetDialogOpen}
          onClose={() => {
            setIsAddValueSetDialogOpen(false);
          }}
          onSubmit={handleAddValueSet}
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
          autoHideDuration={toastType === "danger" ? null : 6000}
        />
      </div>
      <MadieDeleteDialog
        open={!!valueSetToDelete}
        onClose={() => setValueSetToDelete(null)}
        onContinue={() => {
          handleDeleteValueSet(valueSetToDelete.id);
          setValueSetToDelete(null);
        }}
        dialogTitle="Delete Component Measure"
        hideWarning
        customDialogBody={
          <>
            Are you sure you want to delete URL: {valueSetToDelete?.url}{" "}
            Version:{" "}
            {valueSetToDelete?.version ? valueSetToDelete?.version : "N/A"}
          </>
        }
      />
    </div>
  );
}
