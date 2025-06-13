import { extractUrlPartsConsistent } from "@/lib/utils";

/**
 * Database utility functions
 */

export function extractUrlParts(fullUrl: string): {
  urlBase: string;
  path: string;
  hostname: string;
} {
  return extractUrlPartsConsistent(fullUrl);
}