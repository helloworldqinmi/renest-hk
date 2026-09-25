import { InteractiveDemo } from "@/components/demo/interactive-demo";

type DemoPageProps = {
  searchParams: Promise<{ debug?: string; plan?: string }>;
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const debugPlanning = params.debug === "planning";
  const initialObjective = params.plan === "work" || params.plan === "host" ? params.plan : "keep";

  return <InteractiveDemo debugPlanning={debugPlanning} initialObjective={initialObjective} />;
}
