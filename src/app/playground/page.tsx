import fs from "fs/promises";
import path from "path";
import PlaygroundClient from "@/app/playground/playground-client";
import { registryItems } from "@/registry/registry";

export const metadata = {
  title: "Echo UI — Interactive Playground",
  description: "Write and preview custom components in the interactive playground.",
};

export default async function PlaygroundPage() {
  const presets = await Promise.all(
    registryItems.map(async (item) => {
      const filePath = path.join(
        process.cwd(),
        "src/registry/components",
        item.sourceFile,
      );
      let code = "";
      try {
        code = await fs.readFile(filePath, "utf-8");
      } catch (error) {
        console.error(`Failed to read source file at ${filePath}`, error);
        code = `// Failed to load source code for ${item.name}`;
      }
      return {
        id: item.id,
        name: item.name,
        sourceFile: item.sourceFile,
        category: item.category,
        code,
      };
    })
  );

  return <PlaygroundClient presets={presets} />;
}
