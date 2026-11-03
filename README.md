# madie-admin

This single-spa application provides MADiE administration screens.

## Development

Use Node.js 22.15 or newer. Run `npm ci`, then `npm start` to serve the
SystemJS microfrontend on port 8509 with webpack-dev-server and hot reload.

The original twin global reset and notice styles are preserved directly in
styled-components. Tailwind and twin are no longer required. Run
`npm run test:styles` to verify the original generated styles remain unchanged.

webpack-dev-server is a development-only dependency. Its transitive
`http-proxy-middleware` / `micromatch` / `braces` chain currently produces four
high audit findings from the unpatched
[braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
It is not included in production bundles. Hot reload is retained.

## Code system reports

On Code System Management, choose **Reports > Code Systems Missing VSAC
Version** to download an Excel workbook. This report reads every page of code
systems, regardless of the table's search, filter, or current page. It includes
only records with a blank VSAC version and a nonempty OID indicating VSAC
membership. Records explicitly marked as not in VSAC, or with an OID containing
`NOT.IN.VSAC` (case and separator insensitive), are excluded. Older API responses
without an `isInVsac` flag use the OID to determine membership.

The eight columns mirror the code system table, excluding actions and VSAC
membership. Last Updated values use ISO 8601 UTC timestamps; unavailable values
remain blank and Latest Version is shown as Yes/No. The filename is
`Code_Systems_Missing_VSAC_Version_In_MADiE_YYYYMMDD_HHmmss.xlsx`, with a UTC
export timestamp. ExcelJS is loaded only when generating this report. The
existing **All Code Systems** report is unchanged.
