import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echo UI - Motion-first React components",
  description:
    "Explore, copy, and own production-ready animated React components built with Tailwind CSS and Framer Motion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
