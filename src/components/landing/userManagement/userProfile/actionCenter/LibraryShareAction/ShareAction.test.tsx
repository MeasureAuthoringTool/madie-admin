import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ShareAction, {
  NOTHING_SELECTED,
  VALID_SHARE_LIBRARY,
  SHARED_TAB_NOTHING_SELECTED,
  SharedOptions,
} from "./LibraryShareAction";

const mockLibrary = {
  id: "1",
  librarySetId: "1-2-3-4",
} as any;

describe("LibraryShareAction", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("disables the share button when no libraries are selected", () => {
    render(<ShareAction libraries={[]} onClick={jest.fn()} activeTab={2} />);

    expect(screen.getByTestId("share-action-btn")).toBeDisabled();

    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("enables the share button when at least one library is selected", () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={jest.fn()}
        activeTab={2}
      />
    );

    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();

    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_LIBRARY
    );
  });

  it("enables the share button when multiple libraries are selected", () => {
    render(
      <ShareAction
        libraries={[mockLibrary, { ...mockLibrary, id: "2" }]}
        onClick={jest.fn()}
        activeTab={2}
      />
    );

    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
  });

  it("shows shared-library tooltip when no libraries are selected on shared libraries tab", () => {
    render(<ShareAction libraries={[]} onClick={jest.fn()} activeTab={3} />);

    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_NOTHING_SELECTED
    );
  });

  it("renders Share With and Unshare options on owned libraries tab", async () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={jest.fn()}
        activeTab={2}
      />
    );

    await userEvent.click(screen.getByTestId("share-action-btn"));

    expect(
      screen.getByTestId(`${SharedOptions.SHARE_WITH}-option`)
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(`${SharedOptions.UNSHARE}-option`)
    ).toBeInTheDocument();
  });

  it("renders only Unshare option on shared libraries tab", async () => {
    render(
      <ShareAction
        libraries={[mockLibrary]}
        onClick={jest.fn()}
        activeTab={3}
      />
    );

    await userEvent.click(screen.getByTestId("share-action-btn"));

    expect(
      screen.queryByTestId(`${SharedOptions.SHARE_WITH}-option`)
    ).not.toBeInTheDocument();

    expect(
      screen.getByTestId(`${SharedOptions.UNSHARE}-option`)
    ).toBeInTheDocument();
  });

  it("calls onClick with Share With", async () => {
    const onClick = jest.fn();

    render(
      <ShareAction libraries={[mockLibrary]} onClick={onClick} activeTab={2} />
    );

    await userEvent.click(screen.getByTestId("share-action-btn"));
    await userEvent.click(
      screen.getByRole("menuitem", { name: SharedOptions.SHARE_WITH })
    );

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(SharedOptions.SHARE_WITH);
  });

  it("calls onClick with Unshare from owned libraries tab", async () => {
    const onClick = jest.fn();

    render(
      <ShareAction libraries={[mockLibrary]} onClick={onClick} activeTab={2} />
    );

    await userEvent.click(screen.getByTestId("share-action-btn"));
    await userEvent.click(
      screen.getByRole("menuitem", { name: SharedOptions.UNSHARE })
    );

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(SharedOptions.UNSHARE);
  });

  it("calls onClick with Unshare from shared libraries tab", async () => {
    const onClick = jest.fn();

    render(
      <ShareAction libraries={[mockLibrary]} onClick={onClick} activeTab={3} />
    );

    await userEvent.click(screen.getByTestId("share-action-btn"));
    await userEvent.click(
      screen.getByRole("menuitem", { name: SharedOptions.UNSHARE })
    );

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(SharedOptions.UNSHARE);
  });
});
