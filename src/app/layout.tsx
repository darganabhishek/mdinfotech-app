import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M.D. INFOTECH - Institute Management System",
  description: "Comprehensive institute management system for M.D. INFOTECH Computer Education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
