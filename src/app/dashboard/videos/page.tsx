import { requireAuth } from "@/lib/auth"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { VideosList } from "@/components/dashboard/VideosList"

export const dynamic = "force-dynamic"

export default async function VideosPage() {
  await requireAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 ml-64 pt-16">
          <div className="container p-6">
            <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Videos" }]} />
            <h1 className="text-3xl font-bold mt-4 mb-8">My Videos</h1>
            
            <VideosList />
          </div>
        </main>
      </div>
    </div>
  )
}
