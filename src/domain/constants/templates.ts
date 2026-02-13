import type { ButtonStyle, CardStyle } from '@/domain/entities/assessment';

export type TemplateCategory = 'modern' | 'classic' | 'seasonal' | 'minimal' | 'bold';
export type ShadowStyle = 'minimal' | 'soft' | 'dramatic';
export type AnimationPreset = 'subtle' | 'smooth' | 'playful' | 'elegant';

export type BackgroundDecorationType =
  | 'none'
  | 'particles'
  | 'falling-petals'
  | 'falling-leaves'
  | 'falling-snow'
  | 'floating-bubbles'
  | 'aurora';

export interface BackgroundDecoration {
  type: BackgroundDecorationType;
  density?: 'low' | 'medium' | 'high'; // Number of elements
  speed?: 'slow' | 'medium' | 'fast';  // Animation speed
  color?: string; // Override color for elements
  opacity?: number; // Element opacity (0-1)
}

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  category?: TemplateCategory;
  preview: {
    primary: string;
    background: string;
    accent: string;
    gradient?: string; // CSS gradient string for preview
  };
  values: {
    // Base properties
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: string;
    buttonStyle: ButtonStyle;
    cardStyle: CardStyle;

    // Enhanced visual properties
    backgroundGradient?: string; // CSS gradient
    accentGradient?: string; // CSS gradient for buttons/highlights
    shadowStyle?: ShadowStyle;
    glassEffect?: boolean;
    animationPreset?: AnimationPreset;

    // Background decorations
    backgroundDecoration?: BackgroundDecoration;

    // Custom CSS flag
    customCSSEnabled?: boolean;
  };
}

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'midnight-aurora',
    name: 'Midnight Aurora',
    description: 'Dark elegance with purple glow',
    category: 'modern',
    preview: {
      primary: '#A78BFA',
      background: '#0F172A',
      accent: '#C4B5FD',
      gradient: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)'
    },
    values: {
      primaryColor: '#A78BFA',
      backgroundColor: '#0F172A',
      backgroundGradient: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
      accentGradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
      fontFamily: 'Inter',
      borderRadius: '16px',
      buttonStyle: 'filled',
      cardStyle: 'elevated',
      shadowStyle: 'dramatic',
      glassEffect: true,
      animationPreset: 'elegant',
      backgroundDecoration: {
        type: 'aurora',
        density: 'low',
        speed: 'slow',
        opacity: 0.3,
      },
    },
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Deep blue with aqua highlights',
    category: 'modern',
    preview: {
      primary: '#06B6D4',
      background: '#0C4A6E',
      accent: '#22D3EE',
      gradient: 'linear-gradient(135deg, #0C4A6E 0%, #075985 50%, #0369A1 100%)'
    },
    values: {
      primaryColor: '#06B6D4',
      backgroundColor: '#0C4A6E',
      backgroundGradient: 'linear-gradient(135deg, #0C4A6E 0%, #075985 50%, #0369A1 100%)',
      accentGradient: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #22D3EE 100%)',
      fontFamily: 'Geist Sans',
      borderRadius: '12px',
      buttonStyle: 'pill',
      cardStyle: 'elevated',
      shadowStyle: 'soft',
      glassEffect: true,
      animationPreset: 'smooth',
      backgroundDecoration: {
        type: 'floating-bubbles',
        density: 'medium',
        speed: 'slow',
        color: '#22D3EE',
        opacity: 0.4,
      },
    },
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm orange to pink gradient',
    category: 'bold',
    preview: {
      primary: '#F97316',
      background: '#FFF7ED',
      accent: '#FB923C',
      gradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 30%, #FED7AA 60%, #FDBA74 100%)'
    },
    values: {
      primaryColor: '#F97316',
      backgroundColor: '#FFF7ED',
      backgroundGradient: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 30%, #FED7AA 60%, #FDBA74 100%)',
      accentGradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #F472B6 100%)',
      fontFamily: 'Inter',
      borderRadius: '14px',
      buttonStyle: 'filled',
      cardStyle: 'elevated',
      shadowStyle: 'dramatic',
      glassEffect: false,
      animationPreset: 'playful',
      backgroundDecoration: {
        type: 'particles',
        density: 'low',
        speed: 'medium',
        color: '#FB923C',
        opacity: 0.3,
      },
    },
  },
  {
    id: 'forest-mist',
    name: 'Forest Mist',
    description: 'Serene green with frosted glass',
    category: 'modern',
    preview: {
      primary: '#10B981',
      background: '#ECFDF5',
      accent: '#34D399',
      gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)'
    },
    values: {
      primaryColor: '#10B981',
      backgroundColor: '#ECFDF5',
      backgroundGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
      accentGradient: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
      fontFamily: 'Geist Sans',
      borderRadius: '16px',
      buttonStyle: 'filled',
      cardStyle: 'elevated',
      shadowStyle: 'soft',
      glassEffect: true,
      animationPreset: 'subtle',
      backgroundDecoration: {
        type: 'particles',
        density: 'low',
        speed: 'slow',
        color: '#34D399',
        opacity: 0.25,
      },
    },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    description: 'Elegant pink and gold fusion',
    category: 'classic',
    preview: {
      primary: '#EC4899',
      background: '#FFF1F2',
      accent: '#F472B6',
      gradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 30%, #FECDD3 60%, #FDA4AF 100%)'
    },
    values: {
      primaryColor: '#EC4899',
      backgroundColor: '#FFF1F2',
      backgroundGradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 30%, #FECDD3 60%, #FDA4AF 100%)',
      accentGradient: 'linear-gradient(135deg, #DB2777 0%, #EC4899 40%, #F9A8D4 70%, #FDE68A 100%)',
      fontFamily: 'Merriweather',
      borderRadius: '12px',
      buttonStyle: 'filled',
      cardStyle: 'elevated',
      shadowStyle: 'soft',
      glassEffect: false,
      animationPreset: 'elegant',
      backgroundDecoration: {
        type: 'particles',
        density: 'medium',
        speed: 'medium',
        color: '#F472B6',
        opacity: 0.4,
      },
    },
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Bold purple and cyan contrast',
    category: 'bold',
    preview: {
      primary: '#A855F7',
      background: '#18181B',
      accent: '#06B6D4',
      gradient: 'linear-gradient(135deg, #18181B 0%, #27272A 30%, #3F3F46 60%, #52525B 100%)'
    },
    values: {
      primaryColor: '#A855F7',
      backgroundColor: '#18181B',
      backgroundGradient: 'linear-gradient(135deg, #18181B 0%, #27272A 30%, #3F3F46 60%, #52525B 100%)',
      accentGradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 30%, #C084FC 60%, #06B6D4 100%)',
      fontFamily: 'Inter',
      borderRadius: '8px',
      buttonStyle: 'filled',
      cardStyle: 'flat',
      shadowStyle: 'dramatic',
      glassEffect: false,
      animationPreset: 'playful',
      backgroundDecoration: {
        type: 'particles',
        density: 'medium',
        speed: 'medium',
        color: '#06B6D4',
        opacity: 0.6,
      },
    },
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Spring pink with soft petals',
    category: 'seasonal',
    preview: {
      primary: '#F472B6',
      background: '#FDF2F8',
      accent: '#FBCFE8',
      gradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 40%, #FBCFE8 80%, #F9A8D4 100%)'
    },
    values: {
      primaryColor: '#F472B6',
      backgroundColor: '#FDF2F8',
      backgroundGradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 40%, #FBCFE8 80%, #F9A8D4 100%)',
      accentGradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #F9A8D4 100%)',
      fontFamily: 'Geist Sans',
      borderRadius: '20px',
      buttonStyle: 'pill',
      cardStyle: 'elevated',
      shadowStyle: 'soft',
      glassEffect: true,
      animationPreset: 'playful',
      backgroundDecoration: {
        type: 'falling-petals',
        density: 'medium',
        speed: 'slow',
        color: '#F472B6',
        opacity: 0.6,
      },
    },
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Icy blue winter wonderland',
    category: 'seasonal',
    preview: {
      primary: '#3B82F6',
      background: '#EFF6FF',
      accent: '#60A5FA',
      gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #BFDBFE 70%, #93C5FD 100%)'
    },
    values: {
      primaryColor: '#3B82F6',
      backgroundColor: '#EFF6FF',
      backgroundGradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #BFDBFE 70%, #93C5FD 100%)',
      accentGradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)',
      fontFamily: 'Inter',
      borderRadius: '16px',
      buttonStyle: 'filled',
      cardStyle: 'elevated',
      shadowStyle: 'soft',
      glassEffect: true,
      animationPreset: 'subtle',
      backgroundDecoration: {
        type: 'falling-snow',
        density: 'medium',
        speed: 'medium',
        color: '#FFFFFF',
        opacity: 0.8,
      },
    },
  },
  {
    id: 'golden-autumn',
    name: 'Golden Autumn',
    description: 'Warm fall colors and textures',
    category: 'seasonal',
    preview: {
      primary: '#D97706',
      background: '#FFFBEB',
      accent: '#FBBF24',
      gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 30%, #FDE68A 60%, #FCD34D 100%)'
    },
    values: {
      primaryColor: '#D97706',
      backgroundColor: '#FFFBEB',
      backgroundGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 30%, #FDE68A 60%, #FCD34D 100%)',
      accentGradient: 'linear-gradient(135deg, #B45309 0%, #D97706 40%, #F59E0B 70%, #FBBF24 100%)',
      fontFamily: 'Merriweather',
      borderRadius: '12px',
      buttonStyle: 'filled',
      cardStyle: 'elevated',
      shadowStyle: 'soft',
      glassEffect: false,
      animationPreset: 'subtle',
      backgroundDecoration: {
        type: 'falling-leaves',
        density: 'medium',
        speed: 'medium',
        color: '#D97706',
        opacity: 0.5,
      },
    },
  },
  {
    id: 'monochrome-pro',
    name: 'Monochrome Pro',
    description: 'Professional black and white',
    category: 'minimal',
    preview: {
      primary: '#18181B',
      background: '#FFFFFF',
      accent: '#71717A',
      gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 50%, #F4F4F5 100%)'
    },
    values: {
      primaryColor: '#18181B',
      backgroundColor: '#FFFFFF',
      backgroundGradient: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 50%, #F4F4F5 100%)',
      accentGradient: 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #3F3F46 100%)',
      fontFamily: 'Inter',
      borderRadius: '8px',
      buttonStyle: 'outline',
      cardStyle: 'bordered',
      shadowStyle: 'minimal',
      glassEffect: false,
      animationPreset: 'subtle',
      backgroundDecoration: {
        type: 'none',
      },
    },
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Soft pastel purple delight',
    category: 'modern',
    preview: {
      primary: '#A78BFA',
      background: '#FAF5FF',
      accent: '#C4B5FD',
      gradient: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 40%, #E9D5FF 70%, #D8B4FE 100%)'
    },
    values: {
      primaryColor: '#A78BFA',
      backgroundColor: '#FAF5FF',
      backgroundGradient: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 40%, #E9D5FF 70%, #D8B4FE 100%)',
      accentGradient: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 40%, #A78BFA 70%, #C4B5FD 100%)',
      fontFamily: 'Geist Sans',
      borderRadius: '18px',
      buttonStyle: 'pill',
      cardStyle: 'elevated',
      shadowStyle: 'soft',
      glassEffect: true,
      animationPreset: 'playful',
      backgroundDecoration: {
        type: 'particles',
        density: 'medium',
        speed: 'medium',
        color: '#C4B5FD',
        opacity: 0.4,
      },
    },
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Clean professional blue theme',
    category: 'classic',
    preview: {
      primary: '#2563EB',
      background: '#F8FAFC',
      accent: '#3B82F6',
      gradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)'
    },
    values: {
      primaryColor: '#2563EB',
      backgroundColor: '#F8FAFC',
      backgroundGradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
      accentGradient: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)',
      fontFamily: 'Inter',
      borderRadius: '10px',
      buttonStyle: 'filled',
      cardStyle: 'bordered',
      shadowStyle: 'minimal',
      glassEffect: false,
      animationPreset: 'smooth',
      backgroundDecoration: {
        type: 'none',
      },
    },
  },
  {
    id: 'custom-css',
    name: 'Custom CSS',
    description: 'Blank template for your own styles',
    category: 'minimal',
    preview: {
      primary: '#000000',
      background: '#FFFFFF',
      accent: '#666666',
    },
    values: {
      primaryColor: '#000000',
      backgroundColor: '#FFFFFF',
      fontFamily: 'inherit',
      borderRadius: '0px',
      buttonStyle: 'filled',
      cardStyle: 'flat',
      shadowStyle: 'minimal',
      glassEffect: false,
      animationPreset: 'subtle',
      backgroundDecoration: {
        type: 'none',
      },
      customCSSEnabled: true,
    },
  },
];
