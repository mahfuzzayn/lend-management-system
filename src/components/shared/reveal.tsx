"use client"

import { motion, type Variants } from "motion/react"

import { fadeUp, staggerItem, staggerParent } from "@/lib/motion"

const VIEWPORT = { once: true, margin: "-72px" } as const

interface RevealProps extends React.ComponentProps<typeof motion.div> {
  variants?: Variants
}

/**
 * Scroll-triggered section reveal (FR-12.1). Wrap any block; it fades/rises
 * in when entering the viewport. Reduced motion is handled globally by
 * `<MotionConfig reducedMotion="user">` in the root layout.
 */
export function Reveal({ variants = fadeUp, ...props }: RevealProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      {...props}
    />
  )
}

type StaggerProps = React.ComponentProps<typeof motion.div>

/** Parent wrapper - staggers the entrance of its `StaggerItem` children. */
export function Stagger(props: StaggerProps) {
  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      {...props}
    />
  )
}

interface StaggerItemProps extends React.ComponentProps<typeof motion.div> {
  variants?: Variants
}

/** Child of `Stagger` - inherits the stagger sequence via variant propagation. */
export function StaggerItem({ variants = staggerItem, ...props }: StaggerItemProps) {
  return <motion.div variants={variants} {...props} />
}
