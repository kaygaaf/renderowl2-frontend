"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "@/components/layout/Navbar"
import { useAuth } from "@/contexts/AuthContext"

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "login"
  const plan = searchParams.get("plan")
  
  const { demoLogin, demoSignup, isSignedIn } = useAuth()
  
  const [activeTab, setActiveTab] = useState(defaultMode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form states
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")

  // Redirect if already signed in
  if (isSignedIn) {
    const redirectUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard"
    router.push(redirectUrl)
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await demoLogin(loginEmail, loginPassword)
      if (result.success) {
        const redirectUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard"
        router.push(redirectUrl)
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const result = await demoSignup(signupEmail, signupPassword, signupName)
      if (result.success) {
        const redirectUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard"
        router.push(redirectUrl)
      } else {
        setError(result.error || "Signup failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Logo/Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to RenderOwl
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create stunning AI-powered videos
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        {/* Login Tab */}
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Signup Tab */}
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                Get started with your free account today
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo credentials hint */}
      <p className="text-xs text-center text-muted-foreground mt-6">
        Demo mode: Use any valid email and a password of 6+ characters
      </p>
    </>
  )
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          }>
            <AuthForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
