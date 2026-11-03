import type { CodeSystem, TerminologyServiceApi } from "@madie/madie-util";

// prettier-ignore
export const generateMissingVsacVersionReport = async (
  terminologyServiceApi: Pick<
    TerminologyServiceApi,
    "getCodeSystems"
  >,
  signal: AbortSignal
): Promise<Blob> => {
  const { Workbook } = await import("exceljs");
  signal.throwIfAborted();
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Missing VSAC Version");
  worksheet.columns = [
    { header: "Title", key: "title", width: 35 },
    { header: "Name", key: "name", width: 35 },
    { header: "FHIR Version", key: "fhirVersion", width: 18 },
    { header: "VSAC Version", key: "vsacVersion", width: 18 },
    { header: "Full URL", key: "fullUrl", width: 70 },
    { header: "OID", key: "oid", width: 40 },
    { header: "Last Updated (UTC Time)", key: "lastUpdated", width: 30 },
    { header: "Latest Version?", key: "isLatestVersion", width: 18 },
  ];
  worksheet.getRow(1).font = { bold: true, color: { argb: "FF17365D" } };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = "A1:H1";

  let page = 0;
  let totalPages: number;
  do {
    const response = await terminologyServiceApi.getCodeSystems(
      page,
      100,
      "title,false",
      "",
      ""
    );
    signal.throwIfAborted();

    response.content
      .filter((codeSystem: CodeSystem) => {
        const oid = codeSystem.oid?.trim();
        // Older API responses express VSAC membership only through the OID.
        return (
          !codeSystem.version?.vsacVersion?.trim() &&
          codeSystem.isInVsac !== false &&
          !!oid &&
          !oid
            .replace(/[^a-z0-9]/gi, "")
            .toUpperCase()
            .includes("NOTINVSAC")
        );
      })
      .forEach((codeSystem) => {
        worksheet.addRow({
          title: codeSystem.title ?? "",
          name: codeSystem.name,
          fhirVersion: codeSystem.version?.fhirVersion ?? "",
          vsacVersion: "",
          fullUrl: codeSystem.fullUrl,
          oid: codeSystem.oid,
          lastUpdated: codeSystem.lastUpdated
            ? new Date(codeSystem.lastUpdated).toISOString()
            : "",
          isLatestVersion: codeSystem.isLatestVersion ? "Yes" : "No",
        });
      });

    totalPages = response.totalPages;
    page += 1;
  } while (page < totalPages);

  const buffer = await workbook.xlsx.writeBuffer();
  signal.throwIfAborted();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};
