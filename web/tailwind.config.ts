import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // In Tailwind v4, theme configuration is done in CSS with @theme directive
  // See src/app/globals.css for custom colors and fonts
} satisfies Config;
