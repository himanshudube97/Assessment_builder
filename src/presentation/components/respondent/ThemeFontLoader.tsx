'use client';

import { Inter, Merriweather } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const merriweather = Merriweather({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-merriweather',
  display: 'swap',
});

interface ThemeFontLoaderProps {
  fontFamily?: string;
  children: React.ReactNode;
}

export function ThemeFontLoader({ fontFamily, children }: ThemeFontLoaderProps) {
  let fontClassName = '';

  if (fontFamily === 'Inter') {
    fontClassName = inter.variable;
  } else if (fontFamily === 'Merriweather') {
    fontClassName = merriweather.variable;
  }

  return (
    <div className={fontClassName} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
