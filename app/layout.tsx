import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
