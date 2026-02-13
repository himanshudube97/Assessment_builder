'use client';

import type { BackgroundDecoration } from '@/domain/constants/templates';
import { FallingPetals } from './decorations/FallingPetals';
import { FallingLeaves } from './decorations/FallingLeaves';
import { FallingSnow } from './decorations/FallingSnow';
import { FloatingBubbles } from './decorations/FloatingBubbles';
import { FloatingParticles } from './decorations/FloatingParticles';
import { AuroraEffect } from './decorations/AuroraEffect';

interface BackgroundDecorationsProps {
    decoration?: BackgroundDecoration;
}

export function BackgroundDecorations({ decoration }: BackgroundDecorationsProps) {
    // Respect user's motion preferences
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return null;
    }

    if (!decoration || decoration.type === 'none') {
        return null;
    }

    switch (decoration.type) {
        case 'falling-petals':
            return <FallingPetals {...decoration} />;
        case 'falling-leaves':
            return <FallingLeaves {...decoration} />;
        case 'falling-snow':
            return <FallingSnow {...decoration} />;
        case 'floating-bubbles':
            return <FloatingBubbles {...decoration} />;
        case 'particles':
            return <FloatingParticles {...decoration} />;
        case 'aurora':
            return <AuroraEffect {...decoration} />;
        default:
            return null;
    }
}
