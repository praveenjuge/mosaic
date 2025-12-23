export const author_name = "Praveen Juge";
export const author_email = "hello@praveenjuge.com";

const baseUrl = (() => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.endsWith("/") ? envUrl : `${envUrl}/`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/";
  }

  return "https://mosaicimg.com/";
})();

export const website_url = baseUrl;
export const website_name = "Mosaic";
export const website_subtitle = "Simplify Your Open Graph Image Creation.";

export const website_description =
  "Transform your website's Open Graph social images by automating the process using screenshots. Say goodbye to the hassle of designing OG images for every page — let your beautiful website do the talking.";
