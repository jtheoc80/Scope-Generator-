import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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

// Check if Clerk publishable key is available
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if publishable key is available
  if (clerkPublishableKey) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
