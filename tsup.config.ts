import { defineConfig } from "tsup";
import { readFileSync, writeFileSync, chmodSync } from "fs";
import { join } from "path";

const SHEBANG = "#!/usr/bin/env node\n";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "cli/index": "src/cli/index.ts",
    "mcp/index": "src/mcp/index.ts",
  },
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  target: "node20",
  onSuccess: async () => {
    // Add shebang and make executable for CLI and MCP entry points
    for (const file of ["dist/cli/index.js", "dist/mcp/index.js"]) {
      const path = join(process.cwd(), file);
      const content = readFileSync(path, "utf-8");
      if (!content.startsWith("#!")) {
        writeFileSync(path, SHEBANG + content);
      }
      chmodSync(path, 0o755);
    }
  },
});
