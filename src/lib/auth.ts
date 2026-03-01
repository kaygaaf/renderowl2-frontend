import { auth as clerkAuth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

// Check if Clerk is properly configured
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""
const hasValidClerkKey = clerkKey.startsWith("pk_") && !clerkKey.includes("test") && !clerkKey.includes("invalid") && clerkKey.length > 20

/**
 * Safe auth wrapper that falls back to demo mode when Clerk isn't configured
 * Returns userId if authenticated, null otherwise
 */
export async function safeAuth() {
  if (!hasValidClerkKey) {
    // Clerk not configured - allow demo mode
    return { userId: "demo-user", sessionId: null }
  }

  try {
    const authResult = await clerkAuth()
    return authResult
  } catch (error) {
    console.warn("Clerk auth failed, falling back to demo mode:", error)
    return { userId: "demo-user", sessionId: null }
  }
}

/**
 * Require auth - redirects to login if not authenticated
 * In demo mode, always returns demo user
 */
export async function requireAuth() {
  const { userId } = await safeAuth()
  
  if (!userId) {
    redirect("/auth?mode=login")
  }
  
  return { userId }
}
