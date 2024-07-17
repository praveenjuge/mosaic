import { Outstatic } from "outstatic";
import { OstClient } from "outstatic/client";
import "outstatic/outstatic.css";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { ost: string[] } }) {
  return <OstClient ostData={await Outstatic()} params={params} />;
}
