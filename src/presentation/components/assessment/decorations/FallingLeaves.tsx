'use client';

import { motion } from 'framer-motion';
import type { BackgroundDecoration } from '@/domain/constants/templates';

export function FallingLeaves({ density = 'medium', speed = 'medium', color = '#D97706', opacity = 0.5 }: BackgroundDecoration) {
    const leafCount = density === 'high' ? 25 : density === 'medium' ? 15 : 8;
    const duration = speed === 'fast' ? 10 : speed === 'medium' ? 14 : 18;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: leafCount }).map((_, i) => {
                const randomDelay = Math.random() * 8;
                const randomDuration = duration + Math.random() * 6;
                const randomX = Math.random() * 80 - 40;
                const randomRotate = Math.random() * 720 + 360;

                return (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            width: `${10 + Math.random() * 12}px`,
                            height: `${10 + Math.random() * 12}px`,
                            background: color,
                            opacity: 0,
                            left: `${Math.random() * 100}%`,
                            top: `-5%`,
                            borderRadius: `${40 + Math.random() * 20}% ${60 + Math.random() * 20}% ${40 + Math.random() * 20}% ${60 + Math.random() * 20}%`,
                            filter: 'blur(0.3px)',
                        }}
                        animate={{
                            y: ['0vh', '105vh'],
                            x: [0, randomX, randomX * 1.2, randomX * 0.8],
                            rotate: [0, randomRotate],
                            scale: [0.6, 1, 0.8, 0.4],
                            opacity: [0, opacity, opacity, 0],
                        }}
                        transition={{
                            duration: randomDuration,
                            repeat: Infinity,
                            delay: randomDelay,
                            ease: 'easeInOut',
                        }}
                    />
                );
            })}
        </div>
    );
}
