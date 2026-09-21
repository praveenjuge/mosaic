const negotiableContentTypes = [
  "text/html",
  "text/markdown",
  "application/json",
];

export function addAcceptToVary(headers: Headers): void {
  const mediaType =
    headers.get("Content-Type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";

  if (!negotiableContentTypes.includes(mediaType)) {
    return;
  }

  const vary = (headers.get("Vary") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const normalizedVary = new Set(vary.map((value) => value.toLowerCase()));

  if (!normalizedVary.has("*") && !normalizedVary.has("accept")) {
    vary.push("Accept");
  }

  headers.set("Vary", vary.join(", "));
}
