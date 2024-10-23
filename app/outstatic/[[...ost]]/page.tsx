import { Outstatic } from "outstatic";
import { OstClient } from "outstatic/client";
import "outstatic/outstatic.css";

export const dynamic = "force-dynamic";

export default async function Page(props: {
  params: Promise<{ ost: string[] }>;
}) {
  const params = await props.params;
  return <OstClient ostData={await Outstatic()} params={params} />;
}
