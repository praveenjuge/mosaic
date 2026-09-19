const negotiableContentTypes = [
  "text/html",
  "text/markdown",
  "application/json",
];

export function addAcceptToVary(headers: Headers): void {
  const contentType = headers.get("Content-Type")?.toLowerCase() ?? "";

  if (!negotiableContentTypes.some((type) => contentType.includes(type))) {
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
