import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import ThemeRegistry from "./ThemeRegistry";
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
  title: "Paylips AUS — Your money, decoded",
  description: "Upload your payslip CSV and see your income, tax and super at a glance.",
};

const BOOT_SCRIPT = `(function(){try{var d=localStorage.getItem('paylips_aus.v1');document.documentElement.dataset.hasData=d&&d!=='[]'?'1':'0';}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <InitColorSchemeScript attribute="class" />
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}