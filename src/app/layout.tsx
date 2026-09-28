import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Boldonse, Figtree } from "next/font/google";
import { Suspense } from "react";
import { AuthProviderWrapper } from "@/components/providers/AuthProviderWrapper";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";
import { IOSInstallPrompt } from "@/components/pwa/IOSInstallPrompt";
import { Toaster } from "@/components/ui/sonner";
import { PostHogPageView } from "@/components/PostHogPageView";
import { SIDE_THEME_SCRIPT } from "@/lib/side";
import { PHProvider } from "./providers";
import "./globals.css";

// Brand display face (Brandbook p.34). Single weight by design — headlines only.
const boldonse = Boldonse({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-boldonse",
  display: "swap",
});

// Brand body face (Brandbook p.34). Variable; the book uses 400–900.
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Young Muslims App",
  description: "Young Muslims Official App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YM App",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the <head> script sets data-theme-side on <html>
    // before hydration, which React would otherwise flag as a mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the member's Brothers/Sisters theme from the ym_side cookie
            before first paint — no flash, and the layout stays static (reading
            cookies() here would make every route dynamic). */}
        <script dangerouslySetInnerHTML={{ __html: SIDE_THEME_SCRIPT }} />
      </head>
      <body
        className={`${figtree.variable} ${boldonse.variable} ${geistMono.variable} antialiased`}
      >
        <PHProvider>
          <Suspense>
            <PostHogPageView />
          </Suspense>
          <AuthProviderWrapper>
            <ServiceWorkerRegistration />
            <IOSInstallPrompt />
            {children}
            <Toaster />
          </AuthProviderWrapper>
        </PHProvider>
      </body>
    </html>
  );
}
