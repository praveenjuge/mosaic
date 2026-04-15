export const DEFAULT_SITE_URL = "https://mosaicimg.com/";
export const DEFAULT_PUBLIC_IMAGE_BASE_URL = "https://og.mosaicimg.com/";

export function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

export function buildUseEndpointUrl(baseUrl: string, targetUrl: string) {
  const endpoint = new URL("use", normalizeBaseUrl(baseUrl));
  endpoint.searchParams.set("url", targetUrl);
  return endpoint.toString();
}

export function buildPublicImageUrl(key: string, baseUrl = DEFAULT_PUBLIC_IMAGE_BASE_URL) {
  return new URL(key, normalizeBaseUrl(baseUrl)).toString();
}

export function buildSiteOgImageUrl(siteUrl: string, targetUrl: string) {
  return buildUseEndpointUrl(siteUrl, targetUrl);
}
