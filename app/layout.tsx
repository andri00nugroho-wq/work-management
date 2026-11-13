import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import StyledJsxRegistry from "./registry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "REI Work Management",
  description:
    "Kelola pekerjaan, proyek, tim, dan progres Raja Emas Indonesia dalam satu tempat.",
};

// Terapkan tema tersimpan sebelum paint agar tidak ada kedipan warna.
const themeScript = `
(function () {
  try {
    var themes = ["light", "dark", "glass", "gold"];
    var theme = window.localStorage.getItem("rei-theme");
    if (themes.indexOf(theme) === -1) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="rei-theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <StyledJsxRegistry>{children}</StyledJsxRegistry>
      </body>
    </html>
  );
}
