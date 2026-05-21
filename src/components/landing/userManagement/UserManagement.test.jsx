"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
require("@testing-library/jest-dom");
var react_1 = require("@testing-library/react");
var UserManagement_1 = require("./UserManagement");
// @ts-ignore
var madie_util_1 = require("@madie/madie-util");
var mockFetchUsers = jest.fn();
jest.mock("@madie/madie-util", function () {
  return {
    useDocumentTitle: jest.fn(),
    useUserRoles: jest
      .fn()
      .mockReturnValue({ roles: ["MADiE-Admin"], isAdmin: true }),
    useOktaTokens: jest.fn().mockReturnValue({
      getAccessToken: function () {
        return "test-token";
      },
      getUserName: function () {
        return "testUser";
      },
    }),
    useUserServiceApi: jest.fn(),
  };
});
var mockUsers = [
  {
    id: "1",
    harpId: "harp1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    status: "ACTIVE",
    lastLoginAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "2",
    harpId: "harp2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    status: "DEACTIVATED",
    lastLoginAt: null,
  },
  {
    id: "3",
    harpId: "harp3",
    firstName: "Bob",
    lastName: "Brown",
    email: "bob@example.com",
    status: "ACTIVE",
    lastLoginAt: "2026-03-20T08:30:00Z",
  },
];
describe("UserManagement", function () {
  beforeEach(function () {
    mockFetchUsers.mockReset();
    madie_util_1.useUserServiceApi.mockReturnValue({
      fetchUsers: mockFetchUsers,
    });
  });
  it("shows loading state initially", function () {
    mockFetchUsers.mockReturnValue(new Promise(function () {})); // never resolves
    (0, react_1.render)(<UserManagement_1.default />);
    expect(react_1.screen.getByTestId("loading-message")).toBeInTheDocument();
    expect(react_1.screen.getByText("Loading users...")).toBeInTheDocument();
  });
  it("shows error message when fetch fails", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockRejectedValue(new Error("Server error"));
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("error-message")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            expect(
              react_1.screen.getByText("Unable to fetch users.")
            ).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("does not show error for AbortError", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var abortError;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            abortError = new Error("Aborted");
            abortError.name = "AbortError";
            mockFetchUsers.mockRejectedValue(abortError);
            (0, react_1.render)(<UserManagement_1.default />);
            // Should not show error message, just stay loading or empty
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.queryByTestId("error-message")
                ).not.toBeInTheDocument();
              }),
            ];
          case 1:
            // Should not show error message, just stay loading or empty
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("shows no users message when fetch returns empty", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue([]);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("no-users-message")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            expect(
              react_1.screen.getByText("No users found.")
            ).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("renders user table with data", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var rows;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            // Check user count
            expect(
              react_1.screen.getByTestId("user-count-total")
            ).toHaveTextContent("3 users");
            expect(
              react_1.screen.getByTestId("user-count-breakdown")
            ).toHaveTextContent("(2 active, 1 deactivated)");
            rows = react_1.screen.getAllByTestId("user-row-item");
            expect(rows).toHaveLength(3);
            // Check name column
            expect(react_1.screen.getByText("John Doe")).toBeInTheDocument();
            expect(react_1.screen.getByText("Jane Smith")).toBeInTheDocument();
            expect(react_1.screen.getByText("Bob Brown")).toBeInTheDocument();
            // Check harpId
            expect(react_1.screen.getByText("harp1")).toBeInTheDocument();
            // Check email
            expect(
              react_1.screen.getByText("john@example.com")
            ).toBeInTheDocument();
            // Check status chips
            expect(
              react_1.screen.getAllByTestId("status-chip-ACTIVE")
            ).toHaveLength(2);
            expect(react_1.screen.getAllByText("Active")).toHaveLength(2);
            expect(
              react_1.screen.getByTestId("status-chip-DEACTIVATED")
            ).toBeInTheDocument();
            expect(react_1.screen.getByText("Deactivated")).toBeInTheDocument();
            // Check last login - formatted date or dash
            expect(react_1.screen.getByText("-")).toBeInTheDocument(); // Jane has no lastLoginAt
            return [2 /*return*/];
        }
      });
    });
  });
  it("filters users by search text across all fields", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var searchInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            searchInput = react_1.screen.getByTestId("user-search-input");
            react_1.fireEvent.change(searchInput, {
              target: { value: "jane" },
            });
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                var rows = react_1.screen.getAllByTestId("user-row-item");
                expect(rows).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("Jane Smith")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("filters by harp ID when filter is set", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var filterSelect, searchInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            filterSelect = react_1.screen.getByTestId("user-filter-by-input");
            react_1.fireEvent.change(filterSelect, {
              target: { value: "Harp ID" },
            });
            searchInput = react_1.screen.getByTestId("user-search-input");
            react_1.fireEvent.change(searchInput, {
              target: { value: "harp3" },
            });
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                var rows = react_1.screen.getAllByTestId("user-row-item");
                expect(rows).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("Bob Brown")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("filters by Name", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var filterSelect, searchInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            filterSelect = react_1.screen.getByTestId("user-filter-by-input");
            react_1.fireEvent.change(filterSelect, {
              target: { value: "Name" },
            });
            searchInput = react_1.screen.getByTestId("user-search-input");
            react_1.fireEvent.change(searchInput, { target: { value: "doe" } });
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                var rows = react_1.screen.getAllByTestId("user-row-item");
                expect(rows).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("John Doe")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("filters by Email Address", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var filterSelect, searchInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            filterSelect = react_1.screen.getByTestId("user-filter-by-input");
            react_1.fireEvent.change(filterSelect, {
              target: { value: "Email Address" },
            });
            searchInput = react_1.screen.getByTestId("user-search-input");
            react_1.fireEvent.change(searchInput, {
              target: { value: "bob@" },
            });
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                var rows = react_1.screen.getAllByTestId("user-row-item");
                expect(rows).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("Bob Brown")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("filters by Status", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var filterSelect, searchInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            filterSelect = react_1.screen.getByTestId("user-filter-by-input");
            react_1.fireEvent.change(filterSelect, {
              target: { value: "Status" },
            });
            searchInput = react_1.screen.getByTestId("user-search-input");
            react_1.fireEvent.change(searchInput, {
              target: { value: "deactivated" },
            });
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                var rows = react_1.screen.getAllByTestId("user-row-item");
                expect(rows).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("Jane Smith")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("clears search and filter when clear button is clicked", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var searchInput, clearBtn;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            searchInput = react_1.screen.getByTestId("user-search-input");
            react_1.fireEvent.change(searchInput, {
              target: { value: "jane" },
            });
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            clearBtn = react_1.screen.getByTestId("user-clear-search");
            react_1.fireEvent.click(clearBtn);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(3);
              }),
            ];
          case 3:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("shows 'No results were found.' when search yields no results", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var searchInput;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            searchInput = react_1.screen.getByTestId("user-search-input");
            react_1.fireEvent.change(searchInput, {
              target: { value: "nonexistent_xyz" },
            });
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("no-results-message")
                ).toBeInTheDocument();
              }),
            ];
          case 2:
            _a.sent();
            expect(
              react_1.screen.getByText("No results were found.")
            ).toBeInTheDocument();
            // original "no users" message should NOT appear
            expect(
              react_1.screen.queryByTestId("no-users-message")
            ).not.toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("shows 'No users found.' (not the search message) when users list is empty with no search", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue([]);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("no-users-message")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            expect(
              react_1.screen.getByText("No users found.")
            ).toBeInTheDocument();
            expect(
              react_1.screen.queryByTestId("no-results-message")
            ).not.toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("displays users sorted alphabetically by name by default", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var rows;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            rows = react_1.screen.getAllByTestId("user-row-item");
            expect(rows[0]).toHaveTextContent("Bob Brown");
            expect(rows[1]).toHaveTextContent("Jane Smith");
            expect(rows[2]).toHaveTextContent("John Doe");
            return [2 /*return*/];
        }
      });
    });
  });
  it("sorts columns when header is clicked", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var nameHeader;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            nameHeader = react_1.screen.getByText("Name").closest("th");
            if (!nameHeader) {
              throw new Error("Name header not found");
            }
            react_1.fireEvent.click(nameHeader);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                var rows = react_1.screen.getAllByTestId("user-row-item");
                expect(rows[0]).toHaveTextContent("John Doe");
              }),
            ];
          case 2:
            _a.sent();
            // Click again for descending
            react_1.fireEvent.click(nameHeader);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                var rows = react_1.screen.getAllByTestId("user-row-item");
                expect(rows[0]).toHaveTextContent("Bob Brown");
              }),
            ];
          case 3:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  it("shows sort icon on hover", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var nameHeader;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            nameHeader = react_1.screen.getByText("Name").closest("th");
            if (!nameHeader) {
              throw new Error("Name header not found");
            }
            react_1.fireEvent.mouseEnter(nameHeader);
            // UnfoldMoreIcon should appear (via SVG)
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(nameHeader.querySelector("svg")).toBeInTheDocument();
              }),
            ];
          case 2:
            // UnfoldMoreIcon should appear (via SVG)
            _a.sent();
            react_1.fireEvent.mouseLeave(nameHeader);
            return [2 /*return*/];
        }
      });
    });
  });
  it("handles Enter key in search without submitting", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var searchInput, preventDefaultMock;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            searchInput = react_1.screen.getByTestId("user-search-input");
            preventDefaultMock = jest.fn();
            react_1.fireEvent.keyPress(searchInput, {
              key: "Enter",
              code: "Enter",
              charCode: 13,
              preventDefault: preventDefaultMock,
            });
            return [2 /*return*/];
        }
      });
    });
  });
  // ─── AC: No filter selected — search across ALL columns ───────────────────
  it("searches across all columns when no filter is selected — matches by harpId", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "harp2" },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("Jane Smith")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("searches across all columns when no filter is selected — matches by email", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "bob@example" },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("Bob Brown")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("searches across all columns when no filter is selected — matches by status label", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "Deactivated" },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("Jane Smith")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("searches across all columns when no filter is selected — matches multiple rows", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            // "Active" status label matches two users
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "Active" },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(2);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("John Doe")).toBeInTheDocument();
            expect(react_1.screen.getByText("Bob Brown")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  // ─── AC: Filter selected — search only in that column ─────────────────────
  it("searching by Name filter only matches name column, not email", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-filter-by-input"),
              {
                target: { value: "Name" },
              }
            );
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "example.com" }, // exists in emails but NOT names
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("no-results-message")
                ).toBeInTheDocument();
              }),
            ];
          case 2:
            _a.sent();
            expect(
              react_1.screen.getByText("No results were found.")
            ).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("searching by Harp ID filter only matches harpId column, not name", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-filter-by-input"),
              {
                target: { value: "Harp ID" },
              }
            );
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "John" }, // exists in name but NOT harpId
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("no-results-message")
                ).toBeInTheDocument();
              }),
            ];
          case 2:
            _a.sent();
            expect(
              react_1.screen.getByText("No results were found.")
            ).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("searching by Email Address filter only matches email column, not name", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-filter-by-input"),
              {
                target: { value: "Email Address" },
              }
            );
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "Brown" }, // name only
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("no-results-message")
                ).toBeInTheDocument();
              }),
            ];
          case 2:
            _a.sent();
            expect(
              react_1.screen.getByText("No results were found.")
            ).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("searching by Status filter only matches status label, not name", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-filter-by-input"),
              {
                target: { value: "Status" },
              }
            );
            // "harp" only appears in harpId, not status
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "harp" },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getByTestId("no-results-message")
                ).toBeInTheDocument();
              }),
            ];
          case 2:
            _a.sent();
            expect(
              react_1.screen.getByText("No results were found.")
            ).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  // ─── AC: Click X clears both Search AND Filter By ─────────────────────────
  it("clicking clear X resets both search text and Filter By to defaults", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            // Set filter
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-filter-by-input"),
              {
                target: { value: "Name" },
              }
            );
            // Set search
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "doe" },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            // Click clear
            react_1.fireEvent.click(
              react_1.screen.getByTestId("user-clear-search")
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                // All users restored
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(3);
              }),
            ];
          case 3:
            _a.sent();
            // Search input is empty
            expect(react_1.screen.getByTestId("user-search-input")).toHaveValue(
              ""
            );
            // Filter By is empty/default (no results message gone)
            expect(
              react_1.screen.queryByTestId("no-results-message")
            ).not.toBeInTheDocument();
            // Clear button should no longer be visible
            expect(
              react_1.screen.queryByTestId("user-clear-search")
            ).not.toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  // ─── AC: Whitespace-only search should not filter ─────────────────────────
  it("whitespace-only search text does not filter results", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "   " },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                // All 3 users still shown
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(3);
              }),
            ];
          case 2:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  // ─── AC: Search is case-insensitive ───────────────────────────────────────
  it("search is case-insensitive across all columns", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "JOHN" },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("John Doe")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
  it("filter-by search is case-insensitive", function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            mockFetchUsers.mockResolvedValue(mockUsers);
            (0, react_1.render)(<UserManagement_1.default />);
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                return expect(
                  react_1.screen.getByTestId("user-management-table")
                ).toBeInTheDocument();
              }),
            ];
          case 1:
            _a.sent();
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-filter-by-input"),
              {
                target: { value: "Email Address" },
              }
            );
            react_1.fireEvent.change(
              react_1.screen.getByTestId("user-search-input"),
              {
                target: { value: "JANE@EXAMPLE" },
              }
            );
            return [
              4 /*yield*/,
              (0, react_1.waitFor)(function () {
                expect(
                  react_1.screen.getAllByTestId("user-row-item")
                ).toHaveLength(1);
              }),
            ];
          case 2:
            _a.sent();
            expect(react_1.screen.getByText("Jane Smith")).toBeInTheDocument();
            return [2 /*return*/];
        }
      });
    });
  });
});
