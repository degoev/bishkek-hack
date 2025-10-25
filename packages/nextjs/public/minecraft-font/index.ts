import local from "next/font/local";

export const minecraftFont = local({
  src: [
    { style: "normal", weight: "normal", path: "./MinecraftRegular.otf" },
    { style: "normal", weight: "bold", path: "./MinecraftBold.otf" },
    { style: "italic", weight: "normal", path: "./MinecraftItalic.otf" },
    { style: "italic", weight: "bold", path: "./MinecraftBoldItalic.otf" },
  ],
  display: "swap",
  variable: "--font-family-minecraft",
  fallback: ["sans-serif"],
  preload: true,
});
