import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E.D.I.T.H. — Digital Identity & Trust Simulation",
  description: "Enhanced Digital Identity, Trust & Heuristics",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
