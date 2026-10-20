import {
  buildTimestampedExportFileName,
  downloadBlobAsFile,
} from "./exportUtils";

describe("exportUtils", () => {
  describe("buildTimestampedExportFileName", () => {
    it("builds a timestamped .xlsx filename by default", () => {
      const date = new Date(2026, 0, 2, 3, 4, 5);

      expect(buildTimestampedExportFileName("UserExport", date)).toBe(
        "UserExport_20260102_030405.xlsx"
      );
    });

    it("supports custom extensions with or without a leading dot", () => {
      const date = new Date(2026, 9, 20, 15, 30, 45);

      expect(buildTimestampedExportFileName("Report", date, "csv")).toBe(
        "Report_20261020_153045.csv"
      );
      expect(buildTimestampedExportFileName("Report", date, ".csv")).toBe(
        "Report_20261020_153045.csv"
      );
    });
  });

  describe("downloadBlobAsFile", () => {
    it("creates an object URL, clicks an anchor, and revokes the URL", () => {
      const blob = new Blob(["test-content"], { type: "text/plain" });
      const createObjectURL = jest.fn().mockReturnValue("blob:mock-export-url");
      const revokeObjectURL = jest.fn();

      Object.defineProperty(window.URL, "createObjectURL", {
        writable: true,
        value: createObjectURL,
      });
      Object.defineProperty(window.URL, "revokeObjectURL", {
        writable: true,
        value: revokeObjectURL,
      });

      const appendChildSpy = jest.spyOn(document.body, "appendChild");
      const removeChildSpy = jest.spyOn(document.body, "removeChild");
      const anchorClick = jest.fn();
      const nativeCreateElement = document.createElement.bind(document);

      jest.spyOn(document, "createElement").mockImplementation((tagName) => {
        const element = nativeCreateElement(tagName);
        if (tagName === "a") {
          element.click = anchorClick;
        }
        return element;
      });

      downloadBlobAsFile(blob, "UserExport_20261020_153045.xlsx");

      expect(createObjectURL).toHaveBeenCalledWith(blob);
      expect(anchorClick).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-export-url");
    });
  });
});
