'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaywallModalProps {
  open: boolean
  onClose: () => void
  isDark?: boolean
}

export function PaywallModal({ open, onClose, isDark = true }: PaywallModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative',
              isDark
                ? 'bg-[#060812]/95 backdrop-blur-xl border border-white/[0.06] shadow-purple-500/10'
                : 'bg-white border border-gray-200 shadow-purple-500/5'
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 size-8 rounded-lg flex items-center justify-center transition-colors',
                isDark
                  ? 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
            >
              <X className="size-4" />
            </button>

            {/* Crown icon */}
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className={cn(
                'mx-auto mb-6 size-16 rounded-2xl flex items-center justify-center',
                isDark
                  ? 'bg-gradient-to-br from-purple-500/8 to-indigo-500/8 border border-purple-500/12'
                  : 'bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100'
              )}
            >
              <Crown className={cn('size-8', isDark ? 'text-purple-400/70' : 'text-purple-600')} />
            </motion.div>

            {/* Title */}
            <h2 className={cn(
              'text-2xl font-bold mb-2',
              isDark
                ? 'bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent'
                : 'text-gray-900'
            )}>
              Unlock Your Second Brain
            </h2>

            {/* Body */}
            <p className={cn(
              'text-sm mb-6 leading-relaxed',
              isDark ? 'text-white/30' : 'text-gray-500'
            )}>
              You&apos;ve reached your free limit. Upgrade to Pro for unlimited memories and AI search.
            </p>

            {/* Price */}
            <p className={cn(
              'text-4xl font-bold mb-1',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              $5<span className={cn('text-lg font-normal', isDark ? 'text-white/30' : 'text-gray-400')}>/month</span>
            </p>
            <p className={cn(
              'text-xs mb-6',
              isDark ? 'text-white/20' : 'text-gray-400'
            )}>
              Unlimited memories · Unlimited AI chat · Advanced tagging · Priority support
            </p>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl transition-all text-white',
                'bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500',
                'hover:from-purple-300 hover:via-violet-400 hover:to-indigo-400',
                'shadow-[0_0_24px_-5px_rgba(168,85,247,0.4)] hover:shadow-[0_0_32px_-5px_rgba(168,85,247,0.6)]'
              )}
            >
              <Sparkles className="size-4" />
              Upgrade to Pro
            </motion.button>

            {/* Maybe Later */}
            <button
              onClick={onClose}
              className={cn(
                'mt-4 text-sm transition-colors',
                isDark
                  ? 'text-white/20 hover:text-white/40'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Maybe Later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
