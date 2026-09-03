import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  MadieDeleteDialog,
  Toast,
  Pagination,
  MadieTable,
  Select,
  TextField,
} from "@madie/madie-design-system/dist/react";
import "./CodeSystemManagement.scss";
import useTerminologyServiceApi from "../../../api/useTerminologyServiceApi";
import { CodeSystem } from "./CodeSystem";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import CheckIcon from "@mui/icons-material/Check";
import { IconButton, InputAdornment, MenuItem } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CodeSystemDialog, {
  type NewCodeSystemFormData,
} from "./CodeSystemDialog";

const filterByOptions = ["Title", "Name", "Version", "Full URL"];

export default function CodeSystemManagement() {
  const terminologyServiceApi = useRef(useTerminologyServiceApi()).current;
  const [codeSystems, setCodeSystems] = useState<CodeSystem[]>([]);
  const [filterBy, setFilterBy] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastType, setToastType] = useState<string>("success");
  const [toastMessage, setToastMessage] = useState<string>("");
  const [isAddCodeSystemDialogOpen, setIsAddCodeSystemDialogOpen] =
    useState<boolean>(false);
  const [isEditCodeSystemDialogOpen, setIsEditCodeSystemDialogOpen] =
    useState<boolean>(false);
  const [editingCodeSystemId, setEditingCodeSystemId] = useState<string | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deletingCodeSystem, setDeletingCodeSystem] =
    useState<CodeSystem | null>(null);
  const [newCodeSystemFormData, setNewCodeSystemFormData] =
    useState<NewCodeSystemFormData>({
      title: "",
      name: "",
      fhirVersion: "",
      vsacVersion: "",
      fullUrl: "",
      oid: "",
      isLatestVersion: false,
    });

  const [loading, setLoading] = useState<boolean>(false);

  // pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);

  // MadieTable sorting
  const [currentSort, setCurrentSort] = useState<string>("title");
  const [currentDirection, setCurrentDirection] = useState<string>("ASC");

  const handleUpdateCodeSystems = async () => {
    try {
      await terminologyServiceApi.triggerUpdateCodeSystems();
      setToastType("success");
      setToastMessage("Update Code Systems job has been started");
      setToastOpen(true);
    } catch (err: any) {
      setToastType("danger");
      setToastMessage(err.message);
      setToastOpen(true);
    }
  };

  const loadCodeSystems = async () => {
    try {
      setLoading(true);

      const sortInfo = currentSort
        ? `${currentSort},${currentDirection === "DESC"}`
        : undefined;

      const response = await terminologyServiceApi.getCodeSystems(
        page - 1,
        limit,
        sortInfo,
        filterBy,
        appliedSearchText
      );

      setCodeSystems(response.content);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalElements);
      setVisibleItems(response.numberOfElements);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while loading code systems.";

      setToastType("danger");
      setToastMessage(errorMessage);
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const resetNewCodeSystemFormData = () => {
    setNewCodeSystemFormData({
      title: "",
      name: "",
      fhirVersion: "",
      vsacVersion: "",
      fullUrl: "",
      oid: "",
      isLatestVersion: false,
    });
  };

  const handleAddCodeSystem = () => {
    setIsAddCodeSystemDialogOpen(true);
  };

  const handleCloseAddCodeSystemDialog = () => {
    setIsAddCodeSystemDialogOpen(false);
    resetNewCodeSystemFormData();
  };

  const handleEditCodeSystem = (codeSystem: CodeSystem) => {
    setEditingCodeSystemId(codeSystem.id);
    setNewCodeSystemFormData({
      title: codeSystem.title ?? "",
      name: codeSystem.name,
      fhirVersion: codeSystem.version?.fhirVersion ?? "",
      vsacVersion: codeSystem.version?.vsacVersion ?? "",
      fullUrl: codeSystem.fullUrl,
      oid: codeSystem.oid,
      isLatestVersion: codeSystem.isLatestVersion,
    });
    setIsEditCodeSystemDialogOpen(true);
  };

  const handleCloseEditCodeSystemDialog = () => {
    setIsEditCodeSystemDialogOpen(false);
    setEditingCodeSystemId(null);
    resetNewCodeSystemFormData();
  };

  const handleOpenDeleteCodeSystemDialog = (codeSystem: CodeSystem) => {
    setDeletingCodeSystem(codeSystem);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteCodeSystemDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingCodeSystem(null);
  };

  const handleDeleteCodeSystem = async (): Promise<void> => {
    if (!deletingCodeSystem) {
      return;
    }

    try {
      await terminologyServiceApi.deleteCodeSystem(deletingCodeSystem.id);
      await loadCodeSystems();
      setToastType("success");
      setToastMessage("Code system successfully deleted");
      setToastOpen(true);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ??
        err.message ??
        "An error occurred while deleting the code system.";
      setToastType("danger");
      setToastMessage(errorMessage);
      setToastOpen(true);
    } finally {
      handleCloseDeleteCodeSystemDialog();
    }
  };

  const handleNewCodeSystemFieldChange = (
    field: keyof NewCodeSystemFormData,
    value: string | boolean
  ) => {
    setNewCodeSystemFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveCodeSystem = async (
    formData: NewCodeSystemFormData
  ): Promise<void> => {
    const isEditing = Boolean(editingCodeSystemId);
    try {
      const payload = {
        title: formData.title.trim(),
        name: formData.name.trim(),
        fullUrl: formData.fullUrl.trim(),
        oid: formData.oid.trim(),
        isLatestVersion: formData.isLatestVersion,
        version: {
          fhirVersion: formData.fhirVersion.trim(),
          vsacVersion: formData.vsacVersion.trim(),
        },
      };

      if (isEditing) {
        await terminologyServiceApi.updateCodeSystem(
          editingCodeSystemId as string,
          payload
        );
      } else {
        await terminologyServiceApi.createCodeSystem(payload);
      }

      await loadCodeSystems(); // Refresh table data

      setToastType("success");
      setToastMessage(
        isEditing
          ? "Code System updated successfully"
          : "Code System created successfully"
      );
      setToastOpen(true);
      if (isEditing) {
        handleCloseEditCodeSystemDialog();
      } else {
        handleCloseAddCodeSystemDialog();
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ??
        `An error occurred while ${
          isEditing ? "updating" : "creating"
        } the code system.`;
      setToastType("danger");
      setToastMessage(errorMessage);
      setToastOpen(true);
    }
  };

  const onToastClose = () => {
    setToastOpen(false);
  };

  useEffect(() => {
    loadCodeSystems().catch((error) => {
      console.error(error);
    });
  }, [
    terminologyServiceApi,
    page,
    limit,
    currentSort,
    currentDirection,
    appliedSearchText,
    filterBy,
  ]);

  const onSearchTrigger = () => {
    setAppliedSearchText(searchText.trim());
    setPage(1);
  };

  const handleClear = () => {
    setSearchText("");
    setAppliedSearchText("");
    setFilterBy("");
    setPage(1);
  };

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

  const columns = useMemo<ColumnDef<CodeSystem>[]>(
    () => [
      {
        header: "Title",
        accessorKey: "title",
      },
      {
        header: "Name",
        accessorKey: "name",
      },
      {
        header: "FHIR Version",
        accessorFn: (row) => row.version.fhirVersion,
      },
      {
        header: "Full URL",
        accessorKey: "fullUrl",
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
        header: "Latest Version?",
        accessorKey: "isLatestVersion",
        cell: (info) => (info.getValue() ? <CheckIcon /> : "-"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <div style={{ display: "flex" }}>
            <IconButton
              aria-label="Edit code system"
              data-testid={`edit-code-system-${info.row.original.id}`}
              onClick={() => handleEditCodeSystem(info.row.original)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              aria-label="Delete code system"
              data-testid={`delete-code-system-${info.row.original.id}`}
              onClick={() =>
                handleOpenDeleteCodeSystemDialog(info.row.original)
              }
            >
              <DeleteIcon />
            </IconButton>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: codeSystems,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div
      className="code-system-management"
      data-testid="code-system-management"
    >
      {/* to put in later likely when sticky styling is required. */}
      {/* <div style={{ overflow: "auto", maxHeight: "800px" }}> */}
      <div
        className="code-system-management-table"
        data-testid="code-system-management-table"
      >
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
          }}
        ></div>

        {/* Search / Filter row */}
        <div
          className="code-system-search-row"
          style={{ paddingBottom: "16px" }}
        >
          <div
            className="code-system-search-inner"
            style={{
              display: "flex",
              gap: 16,
              width: "50%",
            }}
          >
            <div className="filter-by-wrapper" style={{ width: "50%" }}>
              <Select
                label="Filter By"
                id="code-system-filter-by-select"
                data-testid="code-system-filter-by-select"
                inputProps={{ "data-testid": "code-system-filter-by-input" }}
                placeHolder={{ name: "Filter By", value: "" }}
                SelectDisplayProps={{ "aria-required": "true" }}
                size="small"
                name="filterBy"
                value={filterBy}
                onChange={(e) => {
                  setFilterBy(e.target.value);
                }}
                options={[
                  <MenuItem
                    key="-"
                    value=""
                    data-testid="code-system-filter-by--"
                  >
                    -
                  </MenuItem>,
                  ...filterByOptions.map((option) => (
                    <MenuItem
                      key={option}
                      value={option}
                      data-testid={`code-system-filter-by-${option}`}
                    >
                      {option}
                    </MenuItem>
                  )),
                ]}
              />
            </div>
            <div className="search-wrapper" style={{ width: "50%" }}>
              <TextField
                id="code-system-search"
                label="Search"
                placeholder="Search"
                fullWidth
                inputProps={{ "data-testid": "code-system-search-input" }}
                data-testid="code-system-search"
                name="searchValue"
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
                        data-testid="code-system-trigger-search"
                        style={{ cursor: "pointer" }}
                        onClick={onSearchTrigger}
                      >
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchText ? (
                      <InputAdornment
                        data-testid="code-system-clear-search"
                        position="end"
                        style={{ cursor: "pointer" }}
                        onClick={handleClear}
                      >
                        <IconButton>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p data-testid="loading-message" className="loading-message">
            Loading code systems...
          </p>
        ) : (
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
                id="codeSystemTable"
                dataTestId="code-system-table"
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
        )}

        <Toast
          toastKey="code-system-management-toast"
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
      <div
        className="code-system-management-card"
        data-testid="code-system-management-card"
      >
        <Button
          data-testid="add-code-system-button"
          onClick={handleAddCodeSystem}
        >
          Add New Code System
        </Button>
        <Button
          data-testid="update-code-systems-button"
          onClick={handleUpdateCodeSystems}
        >
          Update Code Systems
        </Button>
        <div>
          <p>
            This is a synchronous job that should only be used in specific
            scenarios where we cannot wait for the job to run that evening. This
            could potentially effect the users as it is running and it will take
            5-10 min to run. Please continue to have a nice day!
          </p>
        </div>
      </div>

      <CodeSystemDialog
        open={isAddCodeSystemDialogOpen}
        formData={newCodeSystemFormData}
        onClose={handleCloseAddCodeSystemDialog}
        onSave={handleSaveCodeSystem}
        onFieldChange={handleNewCodeSystemFieldChange}
      />

      <CodeSystemDialog
        open={isEditCodeSystemDialogOpen}
        formData={newCodeSystemFormData}
        onClose={handleCloseEditCodeSystemDialog}
        onSave={handleSaveCodeSystem}
        onFieldChange={handleNewCodeSystemFieldChange}
        title="Edit Codesystem Data"
      />

      <MadieDeleteDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteCodeSystemDialog}
        onContinue={handleDeleteCodeSystem}
        dialogTitle="Delete Code system"
        statement
        customDialogBody={
          <>
            Are you sure you want to delete
            <br />
            Title:{" "}
            <span className="strong">{deletingCodeSystem?.title || "-"}</span>
            <br />
            Name:{" "}
            <span className="strong">{deletingCodeSystem?.name || "-"}</span>
            <br />
            FHIR Version:{" "}
            <span className="strong">
              {deletingCodeSystem?.version?.fhirVersion || "-"}
            </span>
            <br />
            Full URL:{" "}
            <span className="strong">{deletingCodeSystem?.fullUrl || "-"}</span>
            <br />
            Latest Version:{" "}
            <span className="strong">
              {deletingCodeSystem?.isLatestVersion ? "Yes" : "No"}
            </span>
          </>
        }
      />
    </div>
  );
}
