import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
    default: 'Assessio - Visual Assessment Builder',
    template: '%s | Assessio',
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
  authors: [{ name: 'Assessio' }],
  openGraph: {
    title: 'Assessio - Visual Assessment Builder',
    description: 'Build assessments that actually branch',
    type: 'website',
    siteName: 'Assessio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Assessio - Visual Assessment Builder',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
