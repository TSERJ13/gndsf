import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/cabinet", "/api/", "/login"] },
    ],
    sitemap: "https://gndsf.ge/sitemap.xml",
  };
}
