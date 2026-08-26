import * as mockLibraryActionStubs from "../../../../../__mocks__/libraryActionStubs";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import LibraryActionCenter from "./LibraryActionCenter";
import { CqlLibrary } from "@madie/madie-models";

jest.mock("@madie/madie-util", () => ({
  ...mockLibraryActionStubs,
  LibraryShareAction: (props: any) => (
    <button
      data-testid="share-action-btn"
      onClick={() => props.onClick?.("Share With")}
    >
      Share
    </button>
  ),
}));

const makeLibrary = (overrides: Partial<CqlLibrary> = {}): CqlLibrary =>
  ({
    id: "lib-1",
    cqlLibraryName: "TestLibrary",
    version: "1.0.000",
    draft: false,
    librarySetId: "set-1",
    librarySet: { owner: "owner-1", acls: [] },
    ...overrides,
  } as CqlLibrary);

const defaultProps = {
  libraries: [] as CqlLibrary[],
  canDelete: false,
  activeTab: 0,
  onDelete: jest.fn(),
  onShare: jest.fn(),
  userName: "test-user",
};

const renderActionCenter = (props: any = {}) =>
  render(<LibraryActionCenter {...defaultProps} {...props} />);

describe("LibraryActionCenter", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not render the history or compare icons without their handlers", () => {
    renderActionCenter();
    expect(
      screen.queryByTestId("library-history-action-btn")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("compare-versions-action-btn")
    ).not.toBeInTheDocument();
  });

  it("renders the history and compare icons when handlers are supplied", () => {
    renderActionCenter({
      onViewHistory: jest.fn(),
      onCompareVersions: jest.fn(),
    });
    expect(
      screen.getByTestId("library-history-action-btn")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("compare-versions-action-btn")
    ).toBeInTheDocument();
  });

  describe("View History", () => {
    it("is disabled when no library is selected", () => {
      renderActionCenter({ onViewHistory: jest.fn() });
      expect(screen.getByTestId("library-history-action-btn")).toBeDisabled();
    });

    it("is disabled when more than one library is selected", () => {
      renderActionCenter({
        libraries: [makeLibrary(), makeLibrary({ id: "lib-2" })],
        onViewHistory: jest.fn(),
      });
      expect(screen.getByTestId("library-history-action-btn")).toBeDisabled();
    });

    it("is enabled for exactly one library and fires its handler", async () => {
      const onViewHistory = jest.fn();
      renderActionCenter({ libraries: [makeLibrary()], onViewHistory });

      const button = screen.getByTestId("library-history-action-btn");
      expect(button).not.toBeDisabled();

      await userEvent.click(button);
      expect(onViewHistory).toHaveBeenCalled();
    });
  });

  describe("Compare Library Versions", () => {
    it("is disabled when no library is selected", () => {
      renderActionCenter({ onCompareVersions: jest.fn() });
      expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    });

    it("is disabled for a single library", () => {
      renderActionCenter({
        libraries: [makeLibrary()],
        onCompareVersions: jest.fn(),
      });
      expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    });

    it("is disabled for two libraries in different library sets", () => {
      renderActionCenter({
        libraries: [
          makeLibrary(),
          makeLibrary({ id: "lib-2", librarySetId: "set-2" }),
        ],
        onCompareVersions: jest.fn(),
      });
      expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    });

    it("is disabled for three instances in the same library set", () => {
      renderActionCenter({
        libraries: [
          makeLibrary(),
          makeLibrary({ id: "lib-2" }),
          makeLibrary({ id: "lib-3" }),
        ],
        onCompareVersions: jest.fn(),
      });
      expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    });

    it("is enabled for two instances in the same library set and fires its handler", async () => {
      const onCompareVersions = jest.fn();
      renderActionCenter({
        libraries: [makeLibrary(), makeLibrary({ id: "lib-2" })],
        onCompareVersions,
      });

      const button = screen.getByTestId("compare-versions-action-btn");
      expect(button).not.toBeDisabled();

      await userEvent.click(button);
      expect(onCompareVersions).toHaveBeenCalled();
    });
  });
});
