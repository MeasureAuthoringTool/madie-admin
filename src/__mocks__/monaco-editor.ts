// Global Jest mock for the `monaco-editor` package.
//
// `monaco-editor` is not resolvable in the Jest/jsdom environment because it is
// only provided to the app at build time via monaco-editor-webpack-plugin.
// Any component (e.g. AddValueSetDialog) that imports it transitively would
// otherwise cause "Cannot find module 'monaco-editor'" when its tests run.
export default {};
