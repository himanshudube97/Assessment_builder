import type { ButtonStyle, CardStyle } from '@/domain/entities/assessment';

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    background: string;
    accent: string;
  };
  values: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: string;
    buttonStyle: ButtonStyle;
    cardStyle: CardStyle;
  };
}

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean indigo on white',
    preview: { primary: '#6366F1', background: '#FFFFFF', accent: '#818CF8' },
    values: {
      primaryColor: '#6366F1',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Geist Sans',
      borderRadius: '12px',
      buttonStyle: 'filled',
      cardStyle: 'bordered',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark and sleek',
    preview: { primary: '#8B5CF6', background: '#0F172A', accent: '#A78BFA' },
    values: {
      primaryColor: '#8B5CF6',
      backgroundColor: '#0F172A',
      fontFamily: 'Inter',
      borderRadius: '8px',
      buttonStyle: 'filled',
      cardStyle: 'flat',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calm blue tones',
    preview: { primary: '#0EA5E9', background: '#F0F9FF', accent: '#38BDF8' },
    values: {
      primaryColor: '#0EA5E9',
      backgroundColor: '#F0F9FF',
      fontFamily: 'Geist Sans',
      borderRadius: '16px',
      buttonStyle: 'pill',
      cardStyle: 'elevated',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural earthy greens',
    preview: { primary: '#059669', background: '#ECFDF5', accent: '#34D399' },
    values: {
      primaryColor: '#059669',
      backgroundColor: '#ECFDF5',
      fontFamily: 'Merriweather',
      borderRadius: '8px',
      buttonStyle: 'filled',
      cardStyle: 'bordered',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange glow',
    preview: { primary: '#EA580C', background: '#FFF7ED', accent: '#FB923C' },
    values: {
      primaryColor: '#EA580C',
      backgroundColor: '#FFF7ED',
      fontFamily: 'Inter',
      borderRadius: '12px',
      buttonStyle: 'filled',
      cardStyle: 'elevated',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Sharp, no-nonsense',
    preview: { primary: '#18181B', background: '#FFFFFF', accent: '#71717A' },
    values: {
      primaryColor: '#18181B',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Inter',
      borderRadius: '4px',
      buttonStyle: 'outline',
      cardStyle: 'flat',
    },
  },
];
