/* eslint-disable */
export default {
  displayName: "nx-knip",
  preset: "../../jest.preset.js",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
}
