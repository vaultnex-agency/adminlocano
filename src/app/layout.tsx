import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Locano Admin Portal",
  description: "Management dashboard for Locano accommodations, messes, and enquiries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
