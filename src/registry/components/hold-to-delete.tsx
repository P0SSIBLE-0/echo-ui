"use client";

import { Trash } from 'lucide-react';
import { animate, motion, useMotionValue, useTransform, type HTMLMotionProps } from 'motion/react';
import { useCallback, useRef, useState, useEffect } from 'react';

export interface HoldToDeleteProps extends Omit<HTMLMotionProps<"button">, "children" | "onDelete"> {
    holdDuration?: number;
    label?: string;
    deletedLabel?: string;
    resetDelay?: number;
    onDelete?: () => void;
    onReset?: () => void;
}

// --- Reusable Component ---
export const HoldToDelete = ({
    holdDuration = 2000,
    label = 'Hold to delete',
    deletedLabel = 'Deleted',
    resetDelay = 2000,
    onDelete,
    onReset,
    className = "",
    ...props
}: HoldToDeleteProps) => {
    const [deleted, setDeleted] = useState(false);
    const progress = useMotionValue(0);
    const width = useTransform(progress, [0, 100], ['0%', '100%']);
    
    const rafRef = useRef<ReturnType<typeof animate> | null>(null);
    const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startHold = useCallback(() => {
        if (deleted) return;
        const remaining = ((100 - progress.get()) / 100) * holdDuration;
        
        rafRef.current = animate(progress, 100, {
            duration: remaining / 1000,
            ease: 'linear',
            onComplete: () => {
                setDeleted(true);
                onDelete?.();
                
                resetTimeoutRef.current = setTimeout(() => {
                    progress.set(0);
                    setDeleted(false);
                    onReset?.();
                }, resetDelay);
            },
        });
    }, [deleted, holdDuration, onDelete, onReset, progress, resetDelay]);

    const stopHold = useCallback(() => {
        if (rafRef.current) {
            rafRef.current.stop();
            rafRef.current = null;
        }
        if (!deleted) {
            animate(progress, 0, { duration: 0.4, ease: 'easeOut' });
        }
    }, [deleted, progress]);

    // Safety cleanup to prevent memory leaks and state updates on unmounted components
    useEffect(() => {
        return () => {
            if (rafRef.current) rafRef.current.stop();
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === " " || e.key === "Enter") startHold();
        props.onKeyDown?.(e);
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === " " || e.key === "Enter") stopHold();
        props.onKeyUp?.(e);
    };

    return (
        <motion.button
            type="button"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            whileTap={!deleted ? { scale: 0.95 } : {}}
            animate={{ scale: deleted ? 1 : undefined }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`flex items-center px-3 py-2 gap-1.5 cursor-pointer text-red-500 border border-red-500 text-sm font-medium bg-red-500/5 transition-colors ease-in-out duration-150 rounded-lg relative overflow-hidden select-none outline-none ${className}`}
            {...props}
        >
            <motion.span
                animate={{ opacity: deleted ? 0 : 1, width: deleted ? 0 : 'auto' }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex items-center -translate-y-px flex-shrink-0"
            >
                <Trash size={14} />
            </motion.span>

            <span className="relative">
                <motion.span
                    animate={{ opacity: deleted ? 0 : 1, y: deleted ? -8 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="block"
                >
                    {label}
                </motion.span>
                <motion.span
                    animate={{ opacity: deleted ? 1 : 0, y: deleted ? 0 : 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
                >
                    {deletedLabel}
                </motion.span>
            </span>

            <motion.div style={{ width }} className="left-0 top-0 bg-red-500/20 h-full absolute pointer-events-none" />
        </motion.button>
    );
};

export default HoldToDelete;
