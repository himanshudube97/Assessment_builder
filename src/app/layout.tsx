import type { Metadata } from "next";
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
  title: {
    default: 'FlowForm - Visual Assessment Builder',
    template: '%s | FlowForm',
  },
  description:
    'Build dynamic assessments with visual branching logic. Create surveys, quizzes, and forms that adapt to responses.',
  keywords: [
    'assessment builder',
    'survey tool',
    'form builder',
    'branching logic',
    'visual flow builder',
    'quiz maker',
    'typeform alternative',
  ],
  authors: [{ name: 'FlowForm' }],
  openGraph: {
    title: 'FlowForm - Visual Assessment Builder',
    description: 'Build assessments that actually branch',
    type: 'website',
    siteName: 'FlowForm',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowForm - Visual Assessment Builder',
    description: 'Build assessments that actually branch',
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
