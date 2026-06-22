import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";

const description =
  "آهنگی شخصی با صدای واقعیِ کسی که دوستش داری — موسیقی، صدای کلون‌شده و ویدیو، در یک هدیه.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "songai · هدیه‌ای با صدای خودت",
  description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "songai",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "songai · هدیه‌ای با صدای خودت",
    description,
    type: "website",
    locale: "fa_IR",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "songai · هدیه‌ای با صدای خودت",
    description,
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#150F22",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-dvh font-sans selection:bg-tape/30 selection:text-foreground">
        <MotionProvider>
          <a
            href="#main"
            className="fixed right-4 top-4 z-50 -translate-y-24 rounded-full bg-tape px-4 py-2 text-sm font-bold text-primary-foreground transition-transform duration-200 focus:translate-y-0"
          >
            رفتن به محتوای اصلی
          </a>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
