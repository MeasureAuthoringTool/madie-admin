/** @format */
const { mergeWithRules } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const webpack = require("webpack");

const merge = mergeWithRules({
  module: {
    rules: {
      test: "match",
      use: "replace",
    },
  },
  plugins: "append",
});
module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "madie",
    projectName: "madie-admin",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
    orgPackagesAsExternal: false,
  });
  const externalsConfig = {
    externals: [
      "@madie/madie-util",
      "@emotion/react",
      "@emotion/styled",
      "react-is",
      "styled-components",
    ],
  };
  // We need to override the css loading rule from the parent configuration
  // so that we can add postcss-loader to the chain
  const newCssRule = {
    module: {
      rules: [
        { test: /\.m?js/, type: "javascript/auto" },
        {
          test: /\.css$/i,
          include: [/node_modules/, /src/],
          use: [
            "style-loader",
            "css-loader", // uses modules: true, which I think we want. Parent does not
            "postcss-loader",
          ],
        },
        {
          test: /\.scss$/,
          resolve: {
            extensions: [".scss", ".sass"],
          },
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
              options: { sourceMap: true, importLoaders: 2 },
            },
            {
              loader: "postcss-loader",
              options: {
                sourceMap: true,
              },
            },
            {
              loader: "sass-loader",
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
  };

  // Node polyfills required by bundled dependencies such as
  // @madie/madie-editor. NodePolyfillPlugin v4 handles Buffer
  // and friends, but it no longer provides the `process` global by default,
  // so we provide it explicitly (same approach as madie-cql-library).
  const polyfillConfig = {
    resolve: {
      fallback: {
        process: require.resolve("process/browser.js"),
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser.js", // ✅ FIXED
      }),
    ],
  };

  return merge(externalsConfig, defaultConfig, newCssRule, polyfillConfig);
};
