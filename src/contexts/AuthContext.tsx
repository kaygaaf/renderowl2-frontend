"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { timelineApi, setTokenGetter } from "@/lib/api"

interface Project {
  id: string
  title: string
  description?: string
  status: "draft" | "processing" | "completed" | "failed"
  thumbnail?: string
  duration: number
  createdAt: string
  updatedAt: string
  userId: string
}

interface UserData {
  id: string
  email: string
  name: string
  avatar?: string
  credits: number
  plan: "free" | "pro" | "enterprise"
}

interface AuthContextType {
  user: any
  isLoaded: boolean
  isSignedIn: boolean
  userData: UserData | null
  projects: Project[]
  projectsLoading: boolean
  projectsError: string | null
  refreshProjects: () => Promise<void>
  signOut: () => Promise<void>
  demoLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  demoSignup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo user for fallback
const DEMO_USER: UserData = {
  id: "demo-user-123",
  email: "demo@renderowl.com",
  name: "Demo User",
  credits: 1000,
  plan: "free",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)

  // Check for local auth on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    const savedUser = localStorage.getItem("auth_user")
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUserData(parsedUser)
        setIsSignedIn(true)
        setTokenGetter(() => token)
      } catch (e) {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
      }
    } else {
      // Use demo user as fallback
      setUserData(DEMO_USER)
      setIsSignedIn(true)
      setTokenGetter(() => "demo-token")
    }
    
    setIsLoaded(true)
  }, [])

  const refreshProjects = async () => {
    if (!isSignedIn) {
      setProjects([])
      return
    }

    setProjectsLoading(true)
    setProjectsError(null)

    try {
      const response = await timelineApi.list()
      const mappedProjects: Project[] = response?.map((timeline: any) => ({
        id: timeline.id,
        title: timeline.name,
        description: timeline.description,
        status: timeline.status || "draft",
        duration: timeline.duration || 0,
        createdAt: timeline.created_at,
        updatedAt: timeline.updated_at,
        userId: timeline.user_id,
      })) || []
      setProjects(mappedProjects)
    } catch (error: any) {
      console.error("Failed to fetch projects:", error)
      setProjectsError(error.response?.data?.error || "Failed to load projects")
    } finally {
      setProjectsLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      refreshProjects()
    } else {
      setProjects([])
    }
  }, [isSignedIn])

  const signOut = async () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    setUserData(null)
    setProjects([])
    setIsSignedIn(false)
  }

  const demoLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" }
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" }
    }

    const demoUser: UserData = {
      id: `demo_${Date.now()}`,
      email: email,
      name: email.split("@")[0] || "Demo User",
      credits: 1000,
      plan: "free",
    }

    const token = `demo_token_${Date.now()}`
    localStorage.setItem("auth_token", token)
    localStorage.setItem("auth_user", JSON.stringify(demoUser))
    
    setUserData(demoUser)
    setIsSignedIn(true)
    setTokenGetter(() => token)
    
    return { success: true }
  }

  const demoSignup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password || !name) {
      return { success: false, error: "All fields are required" }
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: "Please enter a valid email address" }
    }

    const demoUser: UserData = {
      id: `demo_${Date.now()}`,
      email: email,
      name: name,
      credits: 1000,
      plan: "free",
    }

    const token = `demo_token_${Date.now()}`
    localStorage.setItem("auth_token", token)
    localStorage.setItem("auth_user", JSON.stringify(demoUser))
    
    setUserData(demoUser)
    setIsSignedIn(true)
    setTokenGetter(() => token)
    
    return { success: true }
  }

  const value: AuthContextType = {
    user: userData,
    isLoaded,
    isSignedIn,
    userData,
    projects,
    projectsLoading,
    projectsError,
    refreshProjects,
    signOut,
    demoLogin,
    demoSignup,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useUserData() {
  const { userData, isLoaded, isSignedIn } = useAuth()
  return { userData, isLoaded, isSignedIn }
}

export function useProjects() {
  const { projects, projectsLoading, projectsError, refreshProjects } = useAuth()
  return { projects, projectsLoading, projectsError, refreshProjects }
}
