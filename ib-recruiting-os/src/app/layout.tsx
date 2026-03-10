import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "IB Resume Coach — Built for Banking",
  description:
    "An AI-powered IB recruiting coach that scores your resume, rewrites bullets live, develops your story, and tells you honestly where you stand — including whether networking matters more than another rewrite.",
  openGraph: {
    title: "IB Resume Coach",
    description:
      "The IB resume coach that's brutally honest. Drop your resume, get scored, get coached.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-950 text-stone-100`}
      >
        {children}
      </body>
    </html>
  );
}
