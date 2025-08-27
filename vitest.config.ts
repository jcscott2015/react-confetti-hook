import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    deps: {
      optimizer: {
        web: {
          include: ["@testing-library/user-event"],
        },
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
