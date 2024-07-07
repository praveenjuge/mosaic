import { createClient } from "@/lib/server";
import { AddWebsite } from "./AddWebsite";
import { DeleteWebsite } from "./DeleteWebsite";
import { EditWebsite } from "./EditWebsite";

export default async function Page() {
  const client = await createClient();
  const { data: websites, error } = await client.from("websites").select("*");

  if (error) {
    return <p>Error: {JSON.stringify(error, null, 2)}</p>;
  }

  return (
    <>
      <div className="flex justify-between">
        <h1>Websites</h1>
        <AddWebsite />
      </div>
      {websites.map((website) => (
        <li key={website.id}>
          {website.website_url}
          <EditWebsite
            websiteId={website.id}
            currentUrl={website.website_url}
          />
          <DeleteWebsite websiteId={website.id} />
        </li>
      ))}
    </>
  );
}
