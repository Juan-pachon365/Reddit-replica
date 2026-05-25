
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreatePostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subreddit, setSubreddit] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subreddits = ['general', 'tecnologia', 'gaming', 'programacion', 'preguntas', 'noticias', 'musica', 'deportes']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: postError } = await supabase.from('posts').insert([{
      title: title.trim(),
      content: content.trim() || null,
      subreddit,
      user_id: user.id,
      upvotes: 0
    }])

    if (postError) {
      setError(postError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>✍️ Crear nueva publicación</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={styles.input}
            required
          />
          <select
            value={subreddit}
            onChange={e => setSubreddit(e.target.value)}
            style={styles.select}
          >
            {subreddits.map(sub => (
              <option key={sub} value={sub}>r/{sub}</option>
            ))}
          </select>
          <textarea
            placeholder="Contenido (opcional)"
            value={content}
            onChange={e => setContent(e.target.value)}
            style={styles.textarea}
            rows={8}
          />
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.actions}>
            <Link href="/dashboard" style={styles.cancelBtn}>Cancelar</Link>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Publicando...' : '📤 Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#DAE0E6', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { background: 'white', borderRadius: 8, padding: 30, width: '100%', maxWidth: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  title: { fontSize: 24, marginBottom: 20, color: '#1c1c1c' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 15 },
  input: { padding: 12, border: '1px solid #EDEFF1', borderRadius: 4, fontSize: 14, background: '#F6F7F8' },
  select: { padding: 12, border: '1px solid #EDEFF1', borderRadius: 4, fontSize: 14, background: '#F6F7F8' },
  textarea: { padding: 12, border: '1px solid #EDEFF1', borderRadius: 4, fontSize: 14, fontFamily: 'inherit', background: '#F6F7F8' },
  actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { padding: '10px 20px', background: '#F6F7F8', borderRadius: 20, textDecoration: 'none', color: '#1c1c1c' },
  submitBtn: { padding: '10px 20px', background: '#FF4500', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center' as const }
}