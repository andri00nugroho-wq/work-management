import type { Metadata } from "next";
import Script from "next/script";
import { THEMES, THEME_STORAGE_KEY } from "@/lib/theme";
import StyledJsxRegistry from "./registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "REI Work Management",
  description:
    "Kelola pekerjaan, proyek, tim, dan progres Raja Emas Indonesia dalam satu tempat.",
};

// Terapkan tema tersimpan sebelum paint agar tidak ada kedipan warna.
const preferenceScript = `
(function () {
  var root = document.documentElement;
  try {
    var themes = ${JSON.stringify(THEMES.map((item) => item.id))};
    var theme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (themes.indexOf(theme) === -1) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    root.dataset.theme = theme;
  } catch (error) {
    root.dataset.theme = "light";
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Script id="rei-preferences-init" strategy="beforeInteractive">
          {preferenceScript}
        </Script>
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  );
}
