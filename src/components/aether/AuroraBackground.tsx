'use client'

import { motion } from 'framer-motion'

// ─── Aurora Mesh Gradient Background ────────────────────────────────
// Slowly drifting, pulsing orbs that create a living "aurora" effect
// behind the dashboard. Only visible in dark mode.

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Purple orb — top-left, 20s cycle */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          ease: 'linear',
          repeat: Infinity,
        }}
        className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-700/15 rounded-full blur-[150px]"
      />

      {/* Indigo orb — bottom-right, 25s cycle */}
      <motion.div
        animate={{
          x: [0, -25, 35, 0],
          y: [0, 30, -20, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 25,
          ease: 'linear',
          repeat: Infinity,
        }}
        className="absolute bottom-[-10%] right-[-5%] w-[550px] h-[550px] bg-indigo-600/12 rounded-full blur-[140px]"
      />

      {/* Blue orb — center-right, 30s cycle */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.15, 0.85, 1],
        }}
        transition={{
          duration: 30,
          ease: 'linear',
          repeat: Infinity,
        }}
        className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[130px]"
      />
    </div>
  )
}
