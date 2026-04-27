module.exports = {
  rootDir: "src",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(j|t)sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "single-spa-react/parcel": "single-spa-react/lib/cjs/parcel.cjs",
    "^@madie/madie-util$": "<rootDir>/__mocks__/@madie/madie-util.tsx",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
