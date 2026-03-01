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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo user for testing
const DEMO_USER = {
  id: "demo-user-123",
  email: "demo@renderowl.com",
  name: "Demo User",
  avatar: undefined,
  credits: 1000,
  plan: "pro" as const,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Demo mode - always signed in
  const [userData, setUserData] = useState<UserData | null>(DEMO_USER)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  // Set up dummy token getter
  useEffect(() => {
    setTokenGetter(() => Promise.resolve("demo-token"))
  }, [])

  const refreshProjects = async () => {
    setProjectsLoading(true)
    try {
      // TODO: Fetch from backend
      setProjects([])
    } catch (error) {
      setProjectsError("Failed to fetch projects")
    } finally {
      setProjectsLoading(false)
    }
  }

  const signOut = async () => {
    // Demo mode - no actual sign out
    console.log("Demo: Sign out called")
  }

  return (
    <AuthContext.Provider
      value={{
        user: DEMO_USER,
        isLoaded: true,
        isSignedIn: true,
        userData,
        projects,
        projectsLoading,
        projectsError,
        refreshProjects,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
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
  return { user: userData, isLoaded, isSignedIn }
}

export function useProjects() {
  const { projects, projectsLoading, projectsError, refreshProjects } = useAuth()
  return { projects, projectsLoading, projectsError, refreshProjects }
}
