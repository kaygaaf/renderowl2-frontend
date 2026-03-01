"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScriptGenerator } from "./ScriptGenerator"
import { SceneGenerator } from "./SceneGenerator"
import { VoiceSelector } from "./VoiceSelector"
import { FileText, ImageIcon, Volume2, Wand2, X, Loader2 } from "lucide-react"
import { Script, GeneratedScene, timelineApi, trackApi, clipApi } from "@/lib/api"
import { toast } from "sonner"
import type { TimelineTrack, TimelineClip } from "@/remotion/types"

interface AIPanelProps {
  projectId?: string
  onApplyToTimeline?: (tracks: TimelineTrack[]) => void
  className?: string
}

export function AIPanel({ projectId, onApplyToTimeline, className }: AIPanelProps) {
  const [script, setScript] = useState<Script | undefined>(undefined)
  const [scenes, setScenes] = useState<GeneratedScene[]>([])
  const [generatedAudio, setGeneratedAudio] = useState<{ [key: number]: string }>({})
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("script")
  const [isApplying, setIsApplying] = useState(false)

  const handleScriptGenerated = (newScript: Script) => {
    setScript(newScript)
    setScenes([]) // Clear scenes when new script is generated
    setGeneratedAudio({})
    // Auto-advance to scenes tab after script generation
    if (newScript.scenes && newScript.scenes.length > 0) {
      setActiveTab("scenes")
    }
  }

  const handleScenesGenerated = (newScenes: GeneratedScene[]) => {
    setScenes(newScenes)
    // Auto-advance to voice tab after scenes generation
    setActiveTab("voice")
  }

  const handleVoiceGenerated = (audioUrl: string, sceneNumber?: number) => {
    if (sceneNumber !== undefined) {
      setGeneratedAudio((prev) => ({
        ...prev,
        [sceneNumber]: audioUrl,
      }))
    }
  }

  const handleApplyToTimeline = async () => {
    if (!script || scenes.length === 0) {
      toast.error("Please generate script and scenes first")
      return
    }

    setIsApplying(true)
    toast.info("Creating timeline from AI content...")

    try {
      // Create or use existing project
      let timelineId = projectId
      
      if (!timelineId) {
        const newProject = await timelineApi.create({
          name: script.title,
          description: script.description,
          duration: script.total_duration || scenes.reduce((acc, s) => acc + (s.duration || 5), 0)
        })
        timelineId = newProject.id
      }

      if (!timelineId) {
        toast.error("Failed to create timeline")
        return
      }

      // Create tracks for the timeline
      const videoTrack = await trackApi.create(timelineId, {
        name: "AI Video",
        type: "video",
        order: 0
      })

      const audioTrack = await trackApi.create(timelineId, {
        name: "AI Voice",
        type: "audio",
        order: 1
      })

      const textTrack = await trackApi.create(timelineId, {
        name: "AI Text",
        type: "text",
        order: 2
      })

      // Create clips for each scene
      let currentTime = 0
      const clips: TimelineClip[] = []

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        const scriptScene = script.scenes?.[i]
        const sceneDuration = scriptScene?.duration || scene.duration || 5

        // Video clip with scene image
        if (scene.image_url) {
          const videoClip = await clipApi.create(timelineId, {
            trackId: videoTrack.id,
            startTime: currentTime,
            endTime: currentTime + sceneDuration,
            assetType: "image",
            assetUrl: scene.image_url
          })
          clips.push(videoClip)
        }

        // Audio clip with voice
        if (generatedAudio[scene.number]) {
          const audioData = generatedAudio[scene.number]
          const audioUrl = audioData.startsWith('data:') 
            ? audioData 
            : `data:audio/mp3;base64,${audioData}`
          const audioClip = await clipApi.create(timelineId, {
            trackId: audioTrack.id,
            startTime: currentTime,
            endTime: currentTime + sceneDuration,
            assetType: "audio",
            assetUrl: audioUrl
          })
          clips.push(audioClip)
        }

        // Text clip with narration
        if (scriptScene?.narration) {
          const textClip = await clipApi.create(timelineId, {
            trackId: textTrack.id,
            startTime: currentTime,
            endTime: currentTime + sceneDuration,
            assetType: "text",
            textContent: scriptScene.narration
          })
          clips.push(textClip)
        }

        currentTime += sceneDuration
      }

      // Build final tracks with clips
      const tracks: TimelineTrack[] = [
        {
          id: videoTrack.id,
          name: videoTrack.name,
          type: "video",
          order: 0,
          clips: clips.filter(c => c.trackId === videoTrack.id)
        },
        {
          id: audioTrack.id,
          name: audioTrack.name,
          type: "audio",
          order: 1,
          clips: clips.filter(c => c.trackId === audioTrack.id)
        },
        {
          id: textTrack.id,
          name: textTrack.name,
          type: "text",
          order: 2,
          clips: clips.filter(c => c.trackId === textTrack.id)
        }
      ]

      toast.success("AI content applied to timeline!")
      onApplyToTimeline?.(tracks)
      setIsOpen(false) // Close panel after applying
    } catch (error) {
      console.error("Failed to apply to timeline:", error)
      toast.error("Failed to create timeline clips")
    } finally {
      setIsApplying(false)
    }
  }

  const canApply = script && scenes.length > 0
  const generationProgress = [
    script ? "✓ Script" : "○ Script",
    scenes.length > 0 ? "✓ Scenes" : "○ Scenes",
    Object.keys(generatedAudio).length > 0 ? "✓ Voice" : "○ Voice",
  ].join(" → ")

  // Collapsed button view
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-50 shadow-lg ${className}`}
        size="lg"
      >
        <Wand2 className="h-5 w-5 mr-2" />
        AI Assistant
      </Button>
    )
  }

  return (
    <Card className={`fixed right-4 top-4 bottom-4 w-[450px] z-50 shadow-xl flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{generationProgress}</p>
        </div>
        <div className="flex items-center gap-2">
          {canApply && (
            <Button size="sm" onClick={handleApplyToTimeline} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply to Timeline"
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="script" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Script
            </TabsTrigger>
            <TabsTrigger value="scenes" className="flex items-center gap-1" disabled={!script}>
              <ImageIcon className="h-4 w-4" />
              Scenes
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-1" disabled={!script}>
              <Volume2 className="h-4 w-4" />
              Voice
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-4">
            <TabsContent value="script" className="mt-0 h-full">
              <ScriptGenerator
                onScriptGenerated={handleScriptGenerated}
                className="border-0 shadow-none"
              />
            </TabsContent>

            <TabsContent value="scenes" className="mt-0 h-full">
              <SceneGenerator
                script={script}
                onScenesGenerated={handleScenesGenerated}
                className="border-0 shadow-none"
              />
            </TabsContent>

            <TabsContent value="voice" className="mt-0 h-full">
              <VoiceSelector
                script={script}
                onVoiceGenerated={handleVoiceGenerated}
                className="border-0 shadow-none"
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default AIPanel
