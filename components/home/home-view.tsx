"use client";

import HomeSignedOut from "./homesignedout";
import SignedInDashboard from "./SignedInDashboard";
import { useAuth } from "@clerk/nextjs";
import { memo } from "react";

// Memoized dashboard to prevent re-renders
const MemoizedSignedInDashboard = memo(SignedInDashboard);

// Client component for conditional auth-based rendering
export default function HomeView() {
  const { isLoaded, userId } = useAuth();

  // Show signed-out view while loading or if not signed in
  if (!isLoaded || !userId) {
    return <HomeSignedOut />;
  }

  return <MemoizedSignedInDashboard />;
}
