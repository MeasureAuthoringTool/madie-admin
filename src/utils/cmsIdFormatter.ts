export const CMS_ID_PAD_WIDTH = 4;
export const FHIR_SUFFIX = "FHIR";

export function padCmsId(cmsId: number | string | null | undefined): string {
  if (cmsId === null || cmsId === undefined || cmsId === "") {
    return "";
  }
  const n = typeof cmsId === "number" ? cmsId : Number(cmsId);
  if (!Number.isFinite(n) || n <= 0) {
    return "";
  }
  return String(Math.trunc(n)).padStart(CMS_ID_PAD_WIDTH, "0");
}

export function formatCmsId(
  cmsId: number | string | null | undefined,
  model: string | null | undefined
): string {
  const padded = padCmsId(cmsId);
  if (!padded) {
    return "";
  }
  return model && model.startsWith("QI-Core")
    ? `${padded}${FHIR_SUFFIX}`
    : padded;
}
