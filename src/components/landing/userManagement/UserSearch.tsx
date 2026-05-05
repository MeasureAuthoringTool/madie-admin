import React, { Dispatch, SetStateAction } from "react";
import { IconButton, MenuItem } from "@mui/material";
import _ from "lodash";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { useFormik } from "formik";
import "twin.macro";
import "styled-components/macro";
import { Select, TextField } from "@madie/madie-design-system/dist/react";

export interface UserSearchCriteria {
  searchField: string;
  optionalSearchProperties: string[];
}

const renderMenuItemsForFilter = (options: string[]) =>
  options.map((option) => (
    <MenuItem
      key={`${option}-option`}
      value={option}
      data-testid={`${option}-option`}
    >
      {option}
    </MenuItem>
  ));

const UserSearch = (props: {
  searchCriteria: UserSearchCriteria;
  setSearchCriteria: Dispatch<SetStateAction<UserSearchCriteria>>;
  handlePageChange?: (e: any, v: number) => void;
}) => {
  const { searchCriteria, setSearchCriteria, handlePageChange } = props;

  const formik = useFormik({
    initialValues: {
      searchField: searchCriteria?.searchField ?? "",
      filterBy: searchCriteria?.optionalSearchProperties?.[0] ?? "",
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSearchCriteria({
        searchField: values?.searchField,
        optionalSearchProperties: values?.filterBy ? [values.filterBy] : [],
      });
      handlePageChange?.(null, 1);
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      style={{ display: "flex", gap: 16, flexBasis: "60%" }}
    >
      <Select
        defaultValue=""
        placeHolder={{ name: "Filter By", value: "" }}
        label="Filter By"
        name="filterBy"
        id="filter-by"
        data-testid="filter-by"
        inputProps={{ "data-testid": "filter-by-input" }}
        {...formik.getFieldProps("filterBy")}
        options={renderMenuItemsForFilter([
          "-",
          "Name",
          "Harp ID",
          "Email Address",
          "Status",
        ])}
      />
      <TextField
        id="user-search-field"
        name="searchField"
        placeholder="Search"
        type="text"
        fullWidth
        data-testid="user-search"
        label="Search"
        variant="outlined"
        {...formik.getFieldProps("searchField")}
        inputProps={{
          "data-testid": "user-search-input",
          "aria-required": "false",
        }}
        slotProps={{
          input: {
            startAdornment: (
              <IconButton
                type="submit"
                data-testid="search-icon"
                aria-label="Search"
                sx={{ marginTop: "0 !important" }}
              >
                <SearchIcon />
              </IconButton>
            ),
            endAdornment: (
              <IconButton
                aria-label="Clear-Search"
                data-testid="clear-search-icon"
                sx={{
                  visibility: _.isEmpty(formik?.values?.searchField)
                    ? "hidden"
                    : "visible",
                }}
                onClick={() =>
                  setSearchCriteria({
                    searchField: "",
                    optionalSearchProperties: [],
                  })
                }
              >
                <ClearIcon />
              </IconButton>
            ),
          },
        }}
      />
    </form>
  );
};

export default UserSearch;
