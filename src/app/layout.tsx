import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../lib/auth-context";
import ThemeRegistry from "./ThemeRegistry";
import { AppHeader } from "./components/AppHeader";
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
    "Upload your payslip CSV and see your income, tax and super at a glance.",
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
      {/* <head>
        <Script id="boot-script" strategy="beforeInteractive">
          {BOOT_SCRIPT}
        </Script>
      </head> */}
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
