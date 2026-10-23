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
