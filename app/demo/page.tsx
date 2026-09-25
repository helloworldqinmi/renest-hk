import { InteractiveDemo } from "@/components/demo/interactive-demo";
import type { DemoObjective } from "@/lib/interactive-demo";

type DemoPageProps = {
  searchParams: Promise<{ resume?: string }>;
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const { resume } = await searchParams;
  const resumeObjective: DemoObjective | undefined = resume === "keep" || resume === "work" || resume === "host" ? resume : undefined;

  return <InteractiveDemo resumeObjective={resumeObjective} />;
}
