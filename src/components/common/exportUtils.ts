// Builds a timestamped export filename.
// Example: buildTimestampedExportFileName("UserExport", new Date(2026, 9, 20, 15, 30, 45), "xlsx")
// -> "UserExport_20261020_153045.xlsx"
export const buildTimestampedExportFileName = (
  prefix: string,
  date: Date = new Date(),
  extension = "xlsx"
): string => {
  const pad = (value: number): string => String(value).padStart(2, "0");
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(
      date.getSeconds()
    )}`;
  const normalizedExtension = extension.startsWith(".")
    ? extension.slice(1)
    : extension;

  return `${prefix}_${stamp}.${normalizedExtension}`;
};

// Triggers a browser download for the given blob and filename.
// Example: downloadBlobAsFile(blob, "UserExport_20261020_153045.xlsx") starts a file download.
export const downloadBlobAsFile = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
