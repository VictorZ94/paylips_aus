import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import ThemeRegistry from "./ThemeRegistry";
import { AppHeader } from "./components/AppHeader";
import { AuthProvider } from "../lib/auth-context";
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
  description:
    "Upload your payslip PDF and see your income, tax and super at a glance.",
};

const BOOT_SCRIPT = `try{var d=localStorage.getItem('paylips_aus.mock_auth.v1');}catch(e){}`;

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
        <Script id="boot-script" strategy="beforeInteractive">
          {BOOT_SCRIPT}
        </Script>
      </head>
      <body>
        <InitColorSchemeScript attribute="class" />
        <ThemeRegistry>
          <AuthProvider>
            <AppHeader />
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}