import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LotSync",
    short_name: "LotSync",
    description: "Pair vehicle inventory to ESL tags on the lot.",
    start_url: "/pairing",
    display: "standalone",
    background_color: "#F7F9F8",
    theme_color: "#0E9466",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
