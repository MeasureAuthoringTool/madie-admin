import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Select, TextField } from "@madie/madie-design-system/dist/react";
import { InputAdornment, IconButton, MenuItem } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { UserDetails, UserStatus } from "@madie/madie-models";
import { useUserServiceApi } from "@madie/madie-util";
import "./UserManagement.scss";

const filterByOptions = ["Name", "Harp ID", "Email Address", "Status"];

const getStatusLabel = (status: UserStatus): string => {
  return status || "";
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterBy, setFilterBy] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [hoveredHeader, setHoveredHeader] = useState<string>("");

  const userServiceApi = useUserServiceApi();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    userServiceApi
      .fetchUsers(controller.signal)
      .then((data) => {
        setUsers(data);
        setError("");
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setError("Unable to fetch users.");
          setUsers([]);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // Counts
  const totalCount = users.length;
  const activeCount = useMemo(
    () => users.filter((u) => u.status === UserStatus.ACTIVE).length,
    [users]
  );
  const deactivatedCount = totalCount - activeCount;

  // Filter
  const filteredUsers = useMemo(() => {
    if (!searchText.trim()) return users;
    const lowerSearch = searchText.toLowerCase();

    return users.filter((u) => {
      if (!filterBy || filterBy === "") {
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        const harpId = (u.harpId || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const status = getStatusLabel(u.status).toLowerCase();
        return (
          name.includes(lowerSearch) ||
          harpId.includes(lowerSearch) ||
          email.includes(lowerSearch) ||
          status.includes(lowerSearch)
        );
      }

      const fieldMap: Record<string, (u: UserDetails) => string> = {
        Name: (u) => `${u.firstName} ${u.lastName}`,
        "Harp ID": (u) => u.harpId || "",
        "Email Address": (u) => u.email || "",
        Status: (u) => getStatusLabel(u.status),
      };
      const getter = fieldMap[filterBy];
      if (!getter) return true;
      return getter(u).toLowerCase().includes(lowerSearch);
    });
  }, [users, searchText, filterBy]);

  const handleClear = () => {
    setSearchText("");
    setFilterBy("");
  };

  // Columns
  const columns = useMemo<ColumnDef<UserDetails>[]>(
    () => [
      {
        header: "Name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: "name",
        size: 25,
      },
      {
        header: "Harp ID",
        accessorKey: "harpId",
        size: 20,
      },
      {
        header: "Email Address",
        accessorKey: "email",
        size: 25,
      },
      {
        header: "Status",
        accessorKey: "status",
        size: 15,
        cell: (info) => {
          const status = info.getValue() as UserStatus;
          const label = getStatusLabel(status);
          return (
            <span
              className={
                status === UserStatus.ACTIVE
                  ? "status-active"
                  : "status-deactivated"
              }
            >
              {label}
            </span>
          );
        },
      },
      {
        header: "Last Login",
        accessorKey: "lastLoginAt",
        size: 15,
        cell: (info) => {
          const val = info.getValue() as string;
          return val ? new Date(val).toLocaleDateString() : "-";
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="user-management" data-testid="user-management">
      {/* User counts */}
      <div className="user-count-section" data-testid="user-count">
        <p className="user-count-total" data-testid="user-count-total">
          {totalCount} users
        </p>
        <p className="user-count-breakdown" data-testid="user-count-breakdown">
          ({activeCount} active, {deactivatedCount} deactivated)
        </p>
      </div>

      {/* Search / Filter row */}
      <div className="user-search-row">
        <div className="user-search-inner">
          <div className="filter-by-wrapper">
            <Select
              label="Filter By"
              id="user-filter-by-select"
              data-testid="user-filter-by-select"
              inputProps={{ "data-testid": "user-filter-by-input" }}
              placeHolder={{ name: "Filter By", value: "" }}
              SelectDisplayProps={{ "aria-required": "true" }}
              size="small"
              name="filterBy"
              value={filterBy}
              onChange={(e) => {
                setFilterBy(e.target.value);
              }}
              options={[
                <MenuItem key="-" value="" data-testid="user-filter-by--">
                  -
                </MenuItem>,
                ...filterByOptions.map((option) => (
                  <MenuItem
                    key={option}
                    value={option}
                    data-testid={`user-filter-by-${option}`}
                  >
                    {option}
                  </MenuItem>
                )),
              ]}
            />
          </div>
          <div className="search-wrapper">
            <TextField
              id="user-search"
              label="Search"
              placeholder="Search"
              fullWidth
              inputProps={{ "data-testid": "user-search-input" }}
              data-testid="user-search"
              name="searchValue"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      data-testid="user-trigger-search"
                      style={{ cursor: "pointer" }}
                    >
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchText ? (
                    <InputAdornment
                      data-testid="user-clear-search"
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

      {/* Table */}
      {loading ? (
        <p data-testid="loading-message" className="loading-message">
          Loading users...
        </p>
      ) : error ? (
        <p data-testid="error-message" className="error-message">
          {error}
        </p>
      ) : table.getRowModel().rows.length > 0 ? (
        <div className="user-table-container">
          <table
            data-testid="user-management-table"
            className="user-management-table"
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isHovered = hoveredHeader === header.id;
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        onClick={header.column.getToggleSortingHandler()}
                        onMouseEnter={() => setHoveredHeader(header.id)}
                        onMouseLeave={() => setHoveredHeader("")}
                        style={{ width: `${header.column.getSize()}%` }}
                        className="header-cell"
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            className={
                              header.column.getCanSort()
                                ? "header-button sortable"
                                : "header-button"
                            }
                            title={
                              header.column.getCanSort()
                                ? header.column.getNextSortingOrder() === "asc"
                                  ? "Sort ascending"
                                  : header.column.getNextSortingOrder() ===
                                    "desc"
                                  ? "Sort descending"
                                  : "Clear sort"
                                : undefined
                            }
                          >
                            <span className="sort-icon">
                              {header.column.getCanSort() &&
                                isHovered &&
                                !header.column.getIsSorted() && (
                                  <UnfoldMoreIcon fontSize="small" />
                                )}
                              {{
                                asc: <KeyboardArrowUpIcon fontSize="small" />,
                                desc: (
                                  <KeyboardArrowDownIcon fontSize="small" />
                                ),
                              }[header.column.getIsSorted() as string] ?? null}
                            </span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} data-testid="user-row-item">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} data-testid={`user-cell-${cell.id}`}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p data-testid="no-users-message" className="no-users-message">
          No users found.
        </p>
      )}
    </div>
  );
};

export default UserManagement;
