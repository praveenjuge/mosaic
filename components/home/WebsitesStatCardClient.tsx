"use client";

import { api } from "@/convex/_generated/api";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";

export default function WebsitesStatCardClient() {
  const count = useQuery(api.sites.countForUser);

  if (count === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4.5 w-16" />
          </CardTitle>
          <CardDescription>Websites</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{count.toLocaleString()}</CardTitle>
        <CardDescription>Websites</CardDescription>
      </CardHeader>
    </Card>
  );
}
