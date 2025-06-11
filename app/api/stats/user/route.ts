import { createClerkSupabaseServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseServerClient();

    // Try materialized view first (fastest)
    const { data: mvStats, error: mvError } = await supabase
      .from("user_stats_mv")
      .select("total_images, total_storage_bytes, total_websites")
      .eq("user_id", userId)
      .maybeSingle();

    if (!mvError && mvStats) {
      const stats = {
        total_images: Number(mvStats.total_images) || 0,
        total_storage_bytes: Number(mvStats.total_storage_bytes) || 0,
        total_websites: Number(mvStats.total_websites) || 0,
      };

      return NextResponse.json(stats, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      });
    }

    console.log("Materialized view failed, trying database function:", mvError?.message);

    // Fallback to database function
    const { data: stats, error: statsError } = await supabase
      .rpc("get_user_stats", {
        user_id_param: userId,
      });

    if (!statsError && stats && stats.length > 0) {
      const result = stats[0];
      const responseData = {
        total_images: Number(result.total_images) || 0,
        total_storage_bytes: Number(result.total_storage_bytes) || 0,
        total_websites: Number(result.total_websites) || 0,
      };

      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      });
    }

    // Log specific error details if both methods fail
    console.error("Both stats methods failed:", {
      mvError: mvError?.message,
      statsError: statsError?.message,
      userId,
    });

    // Final fallback: return zeros if database queries fail
    return NextResponse.json({
      total_images: 0,
      total_storage_bytes: 0,
      total_websites: 0,
    });
  } catch (error) {
    console.error("Error in stats API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
