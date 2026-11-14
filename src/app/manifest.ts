import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "House Monsters",
    short_name: "House Monsters",
    description: "Pokémon Go for abandoned houses — catch monsters, report blight to Birmingham 311.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4ead5",
    theme_color: "#f4ead5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
