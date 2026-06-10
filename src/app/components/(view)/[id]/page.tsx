import { notFound } from "next/navigation";
import { PreviewFrame } from "@/components/site/preview-frame";
import { getRegistryItem, registryItems } from "@/registry/registry";
import fs from "fs/promises";
import path from "path";

type ComponentPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return registryItems.map((item) => ({ id: item.id }));
}

export function generateMetadata({ params }: ComponentPageProps) {
  return params.then(({ id }) => {
    const item = getRegistryItem(id);
    return {
      title: item
        ? `Echo UI - ${item.name}`
        : "Echo UI - Component not found",
    };
  });
}

export default async function ComponentPage({ params }: ComponentPageProps) {
  const { id } = await params;
  const item = getRegistryItem(id);

  if (!item) {
    notFound();
  }

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

  const itemWithCode = {
    ...item,
    code,
  };

  return <PreviewFrame item={itemWithCode} />;
}
