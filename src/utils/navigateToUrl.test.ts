import { navigateToUrl } from "./navigateToUrl";

describe("navigateToUrl", () => {
  const originalUrl = window.location.href;

  afterEach(() => {
    window.history.replaceState(null, "", originalUrl);
  });

  it("assigns the provided URL to window.location.href", () => {
    const destination = new URL(originalUrl);
    destination.hash = "measure-details";

    // Same-document navigation is supported by jsdom without mocking Location.
    navigateToUrl(destination.href);

    expect(window.location.href).toBe(destination.href);
    expect(window.location.hash).toBe("#measure-details");
  });
});
