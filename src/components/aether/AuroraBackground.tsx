'use client'

import { motion } from 'framer-motion'

// ─── Aurora Mesh Gradient Background ────────────────────────────────
// Slowly drifting, pulsing orbs that create a living "aurora" effect.
// Renders different blobs for dark vs light mode.

export function AuroraBackground({ isDark }: { isDark: boolean }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {isDark ? (
        <>
          {/* Dark Mode: Deep aurora blobs */}
          {/* Blob 1 — Purple, top-left drift, 25s */}
          <motion.div
            animate={{
              x: [0, 80, -40, 0],
              y: [0, -60, 40, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 25,
              ease: 'linear',
              repeat: Infinity,
            }}
            className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-purple-800/15 rounded-full blur-[180px]"
          />
          {/* Blob 2 — Indigo, bottom-right drift, 30s */}
          <motion.div
            animate={{
              x: [0, -50, 60, 0],
              y: [0, 50, -30, 0],
              scale: [1, 0.9, 1.15, 1],
            }}
            transition={{
              duration: 30,
              ease: 'linear',
              repeat: Infinity,
            }}
            className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-800/10 rounded-full blur-[150px]"
          />
          {/* Blob 3 — Blue, center pulse, 20s */}
          <motion.div
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -30, 20, 0],
              scale: [1, 1.2, 0.85, 1],
            }}
            transition={{
              duration: 20,
              ease: 'linear',
              repeat: Infinity,
            }}
            className="absolute top-[35%] left-[30%] w-[500px] h-[500px] bg-blue-800/10 rounded-full blur-[140px]"
          />
        </>
      ) : (
        <>
          {/* Light Mode: Soft pastel blurs */}
          {/* Blob 1 — Purple pastel, top-left */}
          <motion.div
            animate={{
              x: [0, 60, -40, 0],
              y: [0, -50, 30, 0],
              scale: [1, 1.05, 0.95, 1],
            }}
            transition={{
              duration: 25,
              ease: 'linear',
              repeat: Infinity,
            }}
            className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-purple-300/20 rounded-full blur-[200px]"
          />
          {/* Blob 2 — Blue pastel, bottom-right */}
          <motion.div
            animate={{
              x: [0, -40, 50, 0],
              y: [0, 40, -25, 0],
              scale: [1, 0.95, 1.1, 1],
            }}
            transition={{
              duration: 30,
              ease: 'linear',
              repeat: Infinity,
            }}
            className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[180px]"
          />
          {/* Blob 3 — Pink pastel, center */}
          <motion.div
            animate={{
              x: [0, 25, -15, 0],
              y: [0, -25, 15, 0],
              scale: [1, 1.15, 0.9, 1],
            }}
            transition={{
              duration: 20,
              ease: 'linear',
              repeat: Infinity,
            }}
            className="absolute top-[35%] left-[30%] w-[500px] h-[500px] bg-pink-200/15 rounded-full blur-[160px]"
          />
        </>
      )}
    </div>
  )
}
