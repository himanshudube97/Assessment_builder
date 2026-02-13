'use client';

import { motion } from 'framer-motion';
import type { BackgroundDecoration } from '@/domain/constants/templates';

export function FallingPetals({ density = 'medium', speed = 'slow', color = '#F472B6', opacity = 0.6 }: BackgroundDecoration) {
    const petalCount = density === 'high' ? 30 : density === 'medium' ? 20 : 10;
    const duration = speed === 'fast' ? 8 : speed === 'medium' ? 12 : 16;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: petalCount }).map((_, i) => {
                const randomDelay = Math.random() * 10;
                const randomDuration = duration + Math.random() * 4;
                const randomX = Math.random() * 50 - 25;

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${8 + Math.random() * 8}px`,
                            height: `${8 + Math.random() * 8}px`,
                            background: color,
                            opacity: 0,
                            left: `${Math.random() * 100}%`,
                            top: `-5%`,
                            filter: 'blur(0.5px)',
                        }}
                        animate={{
                            y: ['0vh', '105vh'],
                            x: [0, randomX, randomX * 1.5],
                            rotate: [0, 180, 360],
                            scale: [0.8, 1, 0.6],
                            opacity: [0, opacity, opacity, 0],
                        }}
                        transition={{
                            duration: randomDuration,
                            repeat: Infinity,
                            delay: randomDelay,
                            ease: 'linear',
                        }}
                    />
                );
            })}
        </div>
    );
}
