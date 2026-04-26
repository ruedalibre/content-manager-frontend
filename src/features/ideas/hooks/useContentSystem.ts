import { useEffect, useState } from "react"
import { supabase } from "../../../supabaseClient"

export type ContentSystemContent = {
  id: string
  title: string
  platform: string
  format: string
}

export type ContentSystemIdea = {
  id: string
  title: string
  contents: ContentSystemContent[]
}

export type ContentSystemTopic = {
  id: string
  name: string
  ideas: ContentSystemIdea[]
}

export function useContentSystem() {
  const [topics, setTopics] = useState<ContentSystemTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        const res = await window.fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-content-system`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setTopics(data.topics ?? [])
      } catch (err) {
        console.error("Content system error:", err)
        setError("Failed to load content system")
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { topics, loading, error }
}
