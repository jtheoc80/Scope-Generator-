import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScopeGen - Professional Contractor Proposals",
  description: "Generate professional proposals and scopes of work in seconds. Built for bathroom remodelers, painters, HVAC specialists, and more.",
  openGraph: {
    title: "ScopeGen - Professional Contractor Proposals",
    description: "Generate professional proposals and scopes of work in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Allow `next build` (and preview deploys) to succeed without Clerk keys.
  // Auth-enabled routes will still require proper env vars at runtime.
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const content = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );

  if (!hasClerkKeys) return content;

  return <ClerkProvider>{content}</ClerkProvider>;
}
