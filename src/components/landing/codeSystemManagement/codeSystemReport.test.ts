import { Workbook } from "exceljs";
import type { CodeSystem } from "@madie/madie-util";
import { generateMissingVsacVersionReport } from "./codeSystemReport";

const codeSystem = (overrides: Partial<CodeSystem> = {}): CodeSystem => ({
  id: "cs-1",
  title: "ActCode",
  name: "ActCode",
  version: { fhirVersion: "9.0.0" },
  fullUrl: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
  oid: "urn:oid:2.16.840.1.113883.5.4",
  lastUpdated: "2026-09-03T12:56:29-07:00",
  isLatestVersion: true,
  isInVsac: true,
  ...overrides,
});

const readWorkbook = async (blob: Blob): Promise<Workbook> => {
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
};

describe("generateMissingVsacVersionReport", () => {
  const getCodeSystems = jest.fn();
  let controller: AbortController;

  beforeEach(() => {
    getCodeSystems.mockReset();
    controller = new AbortController();
  });

  it("exports eligible records from every page with exactly eight columns and UTC dates", async () => {
    getCodeSystems
      .mockResolvedValueOnce({
        content: [
          codeSystem(),
          codeSystem({
            version: { fhirVersion: "9.0.0", vsacVersion: "2026" },
          }),
          codeSystem({ isInVsac: false }),
        ],
        totalPages: 3,
      })
      .mockResolvedValueOnce({
        content: [
          codeSystem({
            id: "cs-2",
            version: { fhirVersion: "8.0.0", vsacVersion: " \t " },
            isLatestVersion: false,
            lastUpdated: "2026-09-04T01:00:00+05:30",
          }),
        ],
        totalPages: 3,
      })
      .mockResolvedValueOnce({
        content: [
          codeSystem({
            id: "cs-3",
            isInVsac: undefined,
            version: { fhirVersion: "7.0.0", vsacVersion: null },
          }),
        ],
        totalPages: 3,
      });

    const blob = await generateMissingVsacVersionReport(
      { getCodeSystems },
      controller.signal
    );
    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(getCodeSystems.mock.calls).toEqual([
      [0, 100, "title,false", "", ""],
      [1, 100, "title,false", "", ""],
      [2, 100, "title,false", "", ""],
    ]);

    const workbook = await readWorkbook(blob);
    const sheet = workbook.worksheets[0];
    expect(sheet.columnCount).toBe(8);
    expect(sheet.rowCount).toBe(4);
    expect(sheet.getRow(1).values).toEqual([
      undefined,
      "Title",
      "Name",
      "FHIR Version",
      "VSAC Version",
      "Full URL",
      "OID",
      "Last Updated (UTC Time)",
      "Latest Version?",
    ]);
    expect(sheet.getRow(2).values).toEqual([
      undefined,
      "ActCode",
      "ActCode",
      "9.0.0",
      "",
      "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      "urn:oid:2.16.840.1.113883.5.4",
      "2026-09-03T19:56:29.000Z",
      "Yes",
    ]);
    expect(sheet.getCell("C3").value).toBe("8.0.0");
    expect(sheet.getCell("G3").value).toBe("2026-09-03T19:30:00.000Z");
    expect(sheet.getCell("H3").value).toBe("No");
    expect(sheet.getCell("C4").value).toBe("7.0.0");
    expect(sheet.getCell("A1").font.bold).toBe(true);
    expect(sheet.autoFilter).toBe("A1:H1");
    expect(sheet.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
  });

  it.each([
    "NOT.IN.VSAC",
    "not.in.vsac",
    "Not In Vsac",
    "NOT_IN_VSAC",
    "urn:oid:NOT-IN-VSAC",
    "NOTINVSAC",
    "",
    "   ",
    undefined,
  ])("excludes non-VSAC or missing OIDs: %s", async (oid) => {
    getCodeSystems.mockResolvedValue({
      content: [codeSystem({ oid })],
      totalPages: 1,
    });

    const blob = await generateMissingVsacVersionReport(
      { getCodeSystems },
      controller.signal
    );
    const workbook = await readWorkbook(blob);
    expect(workbook.worksheets[0].rowCount).toBe(1);
  });

  it("creates a header-only workbook when there are no code systems", async () => {
    getCodeSystems.mockResolvedValue({ content: [], totalPages: 0 });

    const blob = await generateMissingVsacVersionReport(
      { getCodeSystems },
      controller.signal
    );
    const workbook = await readWorkbook(blob);
    expect(workbook.worksheets[0].rowCount).toBe(1);
    expect(getCodeSystems).toHaveBeenCalledTimes(1);
  });

  it("leaves unavailable optional fields blank", async () => {
    getCodeSystems.mockResolvedValue({
      content: [codeSystem({ title: undefined, lastUpdated: undefined })],
      totalPages: 1,
    });

    const blob = await generateMissingVsacVersionReport(
      { getCodeSystems },
      controller.signal
    );
    const workbook = await readWorkbook(blob);
    expect(workbook.worksheets[0].getCell("A2").value).toBe("");
    expect(workbook.worksheets[0].getCell("G2").value).toBe("");
  });

  it("rejects a failed later page rather than exporting a partial report", async () => {
    getCodeSystems
      .mockResolvedValueOnce({ content: [codeSystem()], totalPages: 2 })
      .mockRejectedValueOnce(new Error("Unable to load code systems"));

    await expect(
      generateMissingVsacVersionReport({ getCodeSystems }, controller.signal)
    ).rejects.toThrow("Unable to load code systems");
  });

  it("rejects invalid dates rather than exporting an incorrect timestamp", async () => {
    getCodeSystems.mockResolvedValue({
      content: [codeSystem({ lastUpdated: "invalid" })],
      totalPages: 1,
    });

    await expect(
      generateMissingVsacVersionReport({ getCodeSystems }, controller.signal)
    ).rejects.toThrow("Invalid time value");
  });

  it("does not fetch data if the export is already aborted", async () => {
    controller.abort();

    await expect(
      generateMissingVsacVersionReport({ getCodeSystems }, controller.signal)
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(getCodeSystems).not.toHaveBeenCalled();
  });

  it("stops fetching subsequent pages when the export is aborted", async () => {
    getCodeSystems.mockImplementationOnce(async () => {
      controller.abort();
      return { content: [codeSystem()], totalPages: 2 };
    });

    await expect(
      generateMissingVsacVersionReport({ getCodeSystems }, controller.signal)
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(getCodeSystems).toHaveBeenCalledTimes(1);
  });
});
