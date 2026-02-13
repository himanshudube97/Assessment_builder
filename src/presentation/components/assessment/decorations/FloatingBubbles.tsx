'use client';

import { motion } from 'framer-motion';
import type { BackgroundDecoration } from '@/domain/constants/templates';

export function FloatingBubbles({ density = 'medium', speed = 'slow', color = '#22D3EE', opacity = 0.4 }: BackgroundDecoration) {
    const bubbleCount = density === 'high' ? 25 : density === 'medium' ? 15 : 8;
    const duration = speed === 'fast' ? 10 : speed === 'medium' ? 15 : 20;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: bubbleCount }).map((_, i) => {
                const randomDelay = Math.random() * 10;
                const randomDuration = duration + Math.random() * 6;
                const randomX = Math.random() * 40 - 20;
                const size = 15 + Math.random() * 35;

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            border: `2px solid ${color}`,
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${color}30, ${color}10)`,
                            opacity: 0,
                            left: `${Math.random() * 100}%`,
                            bottom: `-10%`,
                            filter: 'blur(0.5px)',
                        }}
                        animate={{
                            y: ['0vh', '-110vh'],
                            x: [0, randomX, -randomX * 0.5],
                            scale: [0.6, 1, 0.8],
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
