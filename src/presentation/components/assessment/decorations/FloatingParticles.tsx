'use client';

import { motion } from 'framer-motion';
import type { BackgroundDecoration } from '@/domain/constants/templates';

export function FloatingParticles({ density = 'medium', speed = 'medium', color = '#C4B5FD', opacity = 0.4 }: BackgroundDecoration) {
    const particleCount = density === 'high' ? 50 : density === 'medium' ? 30 : 15;
    const duration = speed === 'fast' ? 15 : speed === 'medium' ? 25 : 35;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: particleCount }).map((_, i) => {
                const randomDelay = Math.random() * 15;
                const randomDuration = duration + Math.random() * 10;
                const randomY = Math.random() * 40 - 20;
                const randomX = Math.random() * 40 - 20;
                const size = 2 + Math.random() * 4;

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            background: color,
                            boxShadow: `0 0 ${size * 2}px ${color}`,
                            opacity: 0,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            filter: 'blur(0.5px)',
                        }}
                        animate={{
                            y: [0, randomY, -randomY, 0],
                            x: [0, randomX, -randomX, 0],
                            scale: [0.5, 1, 0.8, 1],
                            opacity: [0, opacity, opacity * 0.6, opacity, 0],
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
