import type { Metadata } from "next";
import Script from "next/script";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});
import AnimatedBackground from "@/components/AnimatedBackground";
import ScrollIndicator from '@/components/scroll_indicator';

export const metadata: Metadata = {
  title: "Rishab - Full Stack Developer Portfolio",
  description: "Portfolio of Rishab - Full Stack Developer specializing in Next.js, React, Node.js, and 3D Web Experiences",
  keywords: ["portfolio", "developer", "full stack", "next.js", "react", "3d", "webgl"],
  authors: [{ name: "Rishab" }],
  openGraph: {
    title: "Rishab - Full Stack Developer Portfolio",
    description: "Portfolio showcasing innovative web development projects",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/nobg.png" sizes="any" />
      </head>
      <body className={`${poppins.variable} antialiased`} suppressHydrationWarning>
        <ScrollIndicator />
        <AnimatedBackground />
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/disable-devtool@latest"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/devtools-detector/2.0.17/devtools-detector.js"
          strategy="afterInteractive"
        />
        <Script src="/js/nocheats.js" strategy="afterInteractive" />
        <Script src="/js/smoothscroll.js" strategy="afterInteractive" />
        <Script src="/js/protected_devtoolsdetector.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
