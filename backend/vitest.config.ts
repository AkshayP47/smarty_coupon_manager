import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-for-vitest",
      AI_SERVICE_URL: "http://127.0.0.1:1",
    },
    testTimeout: 60000,
    hookTimeout: 180000,
  },
});
