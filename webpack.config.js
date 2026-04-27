/** @format */

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { mergeWithRules } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const path = require("path");

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
    externals: ["@madie/madie-util", "@madie/madie-auth"],
  };

  // We need to override the css loading rule from the parent configuration
  // so that we can add postcss-loader to the chain
  const newCssRule = {
    module: {
      rules: [
        {
          test: /\.css$/i,
          include: [/node_modules/, /src/],
          use: [
            "style-loader",
            "css-loader",
            "postcss-loader",
          ],
        },
        {
          test: /\.scss$/,
          resolve: { extensions: [".scss", ".sass"] },
          use: [
            "style-loader",
            { loader: "css-loader", options: { sourceMap: true, importLoaders: 2 } },
            { loader: "postcss-loader", options: { sourceMap: true } },
            "sass-loader",
          ],
          exclude: /node_modules/,
        },
      ],
    },
    devServer: {
      static: [
        {
          directory: path.join(__dirname, "local-dev-env"),
          publicPath: "/importmap",
        },
        {
          directory: path.join(
            __dirname,
            "node_modules/@madie/madie-root/dist/"
          ),
          publicPath: "/",
        },
        {
          directory: path.join(
            __dirname,
            "node_modules/@madie/madie-auth/dist/"
          ),
          publicPath: "/madie-auth",
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(
          __dirname,
          "node_modules/@madie/madie-root/dist/index.html"
        ),
      }),
    ],
  };

  return mergeWithRules({
    module: {
      rules: {
        test: "match",
        use: "replace",
      },
    },
    plugins: "append",
  })(defaultConfig, externalsConfig, newCssRule);
};
