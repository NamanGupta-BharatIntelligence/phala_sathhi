import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Poppins } from "next/font/google";
import ServiceWorkerRegister from "@/components/phala/ServiceWorkerRegister";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Phala Sathhi",
  description: "Phala Sathhi: complete simple tasks, fill forms and earn ₹5 per form.",
  applicationName: "Phala Sathhi",
  icons: {
    icon: { url: "/icons/icon-192.png", type: "image/png" },
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Phala Sathhi", statusBarStyle: "black-translucent" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#04414A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${devanagari.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
