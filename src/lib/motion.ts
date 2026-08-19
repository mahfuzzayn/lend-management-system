import type { Variants } from "motion/react"

/**
 * Shared motion language (requirements FR-12.3) - one set of variants and
 * timings reused everywhere, never ad-hoc per page.
 * Reduced motion is honoured globally via `<MotionConfig reducedMotion="user">`
 * in the root layout.
 */

/** Gentle custom ease-out shared by every variant. */
export const EASE_OUT: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

export const DURATION = {
  fast: 0.3,
  base: 0.5,
  slow: 0.7,
} as const

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE_OUT } },
}

/** Default section reveal - soft rise. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
}

/** Slightly larger rise for hero elements. */
export const fadeUpLg: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATION.fast, ease: EASE_OUT } },
}

/** Parent container that staggers its `StaggerItem` children. */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

/** Child of `staggerParent` - cards, list rows, table rows. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.fast, ease: EASE_OUT } },
}
