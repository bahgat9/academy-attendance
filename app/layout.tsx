import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: {
    default: "TUT Attendance",
    template: "%s | TUT Attendance",
  },
  description: "TUT Football Academy Attendance System",
  applicationName: "TUT Attendance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
