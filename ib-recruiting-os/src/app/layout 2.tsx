import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IB Recruiting OS — Built for Banking",
  description:
    "An AI-powered IB recruiting OS that reverse-engineers your Decision Arc, builds behavioral stories, and prepares you for investment banking interviews.",
  openGraph: {
    title: "IB Recruiting OS",
    description:
      "The candidate-building OS for investment banking recruiting.",
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
        className={`${spaceGrotesk.variable} font-sans antialiased bg-stone-950 text-stone-100`}
      >
        {children}
      </body>
    </html>
  );
}
