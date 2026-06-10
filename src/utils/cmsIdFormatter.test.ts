import { formatCmsId, padCmsId } from "./cmsIdFormatter";

describe("padCmsId", () => {
  it.each([
    [null, ""],
    [undefined, ""],
    ["", ""],
    [0, ""],
    [-1, ""],
    ["abc", ""],
    [1, "0001"],
    [42, "0042"],
    ["1234", "1234"],
    [12345, "12345"],
  ])("padCmsId(%p) → %p", (input, expected) => {
    expect(padCmsId(input as any)).toBe(expected);
  });
});

describe("formatCmsId", () => {
  it("returns empty string for missing cmsId", () => {
    expect(formatCmsId(null, "QI-Core v4.1.1")).toBe("");
    expect(formatCmsId(undefined, "QDM v5.6")).toBe("");
    expect(formatCmsId("", "QDM v5.6")).toBe("");
  });

  it("appends FHIR suffix for QI-Core models", () => {
    expect(formatCmsId(42, "QI-Core v4.1.1")).toBe("0042FHIR");
    expect(formatCmsId(7, "QI-Core v6.0.0")).toBe("0007FHIR");
  });

  it("omits FHIR suffix for non-QI-Core models", () => {
    expect(formatCmsId(42, "QDM v5.6")).toBe("0042");
    expect(formatCmsId(7, null)).toBe("0007");
    expect(formatCmsId(7, undefined)).toBe("0007");
  });
});
