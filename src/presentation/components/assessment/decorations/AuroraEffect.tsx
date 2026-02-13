'use client';

import { motion } from 'framer-motion';
import type { BackgroundDecoration } from '@/domain/constants/templates';

export function AuroraEffect({ opacity = 0.3 }: BackgroundDecoration) {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Aurora layer 1 */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.3), transparent 60%)',
                    opacity: 0,
                }}
                animate={{
                    opacity: [0, opacity, opacity * 0.6, opacity],
                    scale: [1, 1.2, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Aurora layer 2 */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at 80% 30%, rgba(167, 139, 250, 0.3), transparent 50%)',
                    opacity: 0,
                }}
                animate={{
                    opacity: [0, opacity * 0.8, opacity * 0.5, opacity * 0.8],
                    scale: [1, 1.15, 1.05, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 3,
                }}
            />

            {/* Aurora layer 3 */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at 50% 70%, rgba(196, 181, 253, 0.2), transparent 60%)',
                    opacity: 0,
                }}
                animate={{
                    opacity: [0, opacity * 0.6, opacity * 0.4, opacity * 0.6],
                    scale: [1, 1.1, 1.2, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 6,
                }}
            />
        </div>
    );
}
