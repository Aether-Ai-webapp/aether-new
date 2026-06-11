'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react'
import { useAetherStore } from '@/lib/aether-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export function AuthScreen() {
  const { login, signup } = useAetherStore()
  const [isLoading, setIsLoading] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Please enter email and password')
      return
    }
    setIsLoading(true)
    try {
      const success = await login(loginEmail, loginPassword)
      if (!success) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Welcome back!')
      }
    } catch {
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupEmail || !signupPassword) {
      toast.error('Please fill in all fields')
      return
    }
    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    try {
      const success = await signup(signupEmail, signupPassword, signupName)
      if (!success) {
        toast.error('Signup failed. Email may already be in use.')
      } else {
        toast.success('Welcome to Aether!')
      }
    } catch {
      toast.error('Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocalUse = () => {
    // Allow using the app without auth
    useAetherStore.setState({
      user: { id: 'local', email: 'local@aether.app', name: 'Aether User', avatarUrl: null },
      isAuthenticated: true,
    })
    toast.success('Using Aether locally')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#FFFAF5] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="size-20 rounded-2xl bg-gradient-to-br from-[#6D597A] to-[#8B6F9A] flex items-center justify-center shadow-xl mb-4"
          >
            <Brain className="size-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Aether</h1>
          <p className="text-muted-foreground mt-1">Your second brain, powered by AI</p>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border h-12">
                <TabsTrigger value="login" className="rounded-none text-sm font-medium">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-none text-sm font-medium">
                  Create Account
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="p-6 space-y-4 mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-9"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#6D597A] to-[#8B6F9A] text-white hover:opacity-90 shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </form>

                <div className="relative">
                  <Separator />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                    or
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLocalUse}
                  disabled={isLoading}
                >
                  <Sparkles className="size-4 mr-2" />
                  Use Without Account
                </Button>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="p-6 space-y-4 mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        placeholder="Your name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-9"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-9"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-9"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#6D597A] to-[#8B6F9A] text-white hover:opacity-90 shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                    <Sparkles className="size-4 ml-1" />
                  </Button>
                </form>

                <div className="relative">
                  <Separator />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                    or
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLocalUse}
                  disabled={isLoading}
                >
                  <Sparkles className="size-4 mr-2" />
                  Use Without Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to Aether&apos;s Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  )
}
