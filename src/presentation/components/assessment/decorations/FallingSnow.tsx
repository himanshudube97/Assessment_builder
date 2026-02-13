'use client';

import { motion } from 'framer-motion';
import type { BackgroundDecoration } from '@/domain/constants/templates';

export function FallingSnow({ density = 'medium', speed = 'slow', color = '#FFFFFF', opacity = 0.8 }: BackgroundDecoration) {
    const snowCount = density === 'high' ? 40 : density === 'medium' ? 25 : 15;
    const duration = speed === 'fast' ? 12 : speed === 'medium' ? 18 : 24;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: snowCount }).map((_, i) => {
                const randomDelay = Math.random() * 12;
                const randomDuration = duration + Math.random() * 8;
                const randomX = Math.sin(i * 0.5) * 30;
                const size = 3 + Math.random() * 5;

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            background: color,
                            opacity: 0,
                            left: `${Math.random() * 100}%`,
                            top: `-5%`,
                            boxShadow: `0 0 ${size}px ${color}`,
                            filter: 'blur(0.5px)',
                        }}
                        animate={{
                            y: ['0vh', '105vh'],
                            x: [0, randomX, -randomX, randomX * 0.5],
                            opacity: [0, opacity, opacity, 0],
                            scale: [0.8, 1, 0.9],
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
