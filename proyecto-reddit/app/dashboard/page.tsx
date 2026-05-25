// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profile)

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMyPosts(posts || [])
    setLoading(false)
  }

  const deletePost = async (postId: string) => {
    if (confirm('¿Eliminar este post?')) {
      await supabase.from('posts').delete().eq('id', postId)
      setMyPosts(myPosts.filter(p => p.id !== postId))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h1 style={styles.logo}>reddit<span style={styles.dot}>clone</span></h1>
        <nav style={styles.nav}>
          <Link href="/dashboard" style={styles.navActive}>📋 Dashboard</Link>
          <Link href="/dashboard/create-post" style={styles.navLink}>✍️ Crear Post</Link>
          <Link href="/" style={styles.navLink}>🏠 Feed</Link>
          <Link href="/user" style={styles.navLink}>👤 Mi Perfil</Link>
        </nav>
        <div style={styles.userBox}>
          <p><strong>u/{profile?.username || user?.email?.split('@')[0]}</strong></p>
          <p style={styles.email}>{user?.email}</p>
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar sesión</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <h1 style={styles.title}>Mis Publicaciones</h1>
        <Link href="/dashboard/create-post" style={styles.createBtn}>+ Crear nuevo post</Link>
        
        {myPosts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>😕 No tienes publicaciones aún</p>
            <Link href="/dashboard/create-post" style={styles.emptyCreateBtn}>Crear mi primer post</Link>
          </div>
        ) : (
          myPosts.map(post => (
            <div key={post.id} style={styles.post}>
              <h3 style={styles.postTitle}>{post.title}</h3>
              <p style={styles.postMeta}>r/{post.subreddit} • {new Date(post.created_at).toLocaleDateString()}</p>
              {post.content && <p style={styles.postContent}>{post.content.substring(0, 100)}...</p>}
              <div style={styles.postFooter}>
                <span>👍 {post.upvotes || 0} votos</span>
                <button onClick={() => deletePost(post.id)} style={styles.deleteBtn}>🗑️ Eliminar</button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#DAE0E6' },
  sidebar: { width: 250, background: 'white', padding: 20, borderRight: '1px solid #EDEFF1', display: 'flex', flexDirection: 'column' as const },
  logo: { color: '#FF4500', fontSize: 24, marginBottom: 30 },
  dot: { color: '#1c1c1c' },
  nav: { display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 'auto' },
  navActive: { color: '#FF4500', fontWeight: 'bold', textDecoration: 'none' },
  navLink: { color: '#1c1c1c', textDecoration: 'none' },
  userBox: { borderTop: '1px solid #EDEFF1', paddingTop: 20, marginTop: 20 },
  email: { fontSize: 12, color: '#666' },
  logoutBtn: { background: 'none', border: '1px solid #FF4500', color: '#FF4500', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', marginTop: 10, width: '100%' },
  main: { flex: 1, padding: 20, maxWidth: 800, margin: '0 auto', width: '100%' },
  title: { fontSize: 24, marginBottom: 20, color: '#1c1c1c' },
  createBtn: { display: 'inline-block', background: '#FF4500', color: 'white', padding: '10px 20px', borderRadius: 20, textDecoration: 'none', marginBottom: 20 },
  post: { background: 'white', padding: 16, borderRadius: 8, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  postTitle: { fontSize: 18, marginBottom: 8, color: '#1c1c1c' },
  postMeta: { fontSize: 12, color: '#666', marginBottom: 8 },
  postContent: { fontSize: 14, color: '#333', marginBottom: 12 },
  postFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { background: '#FF4500', color: 'white', border: 'none', padding: '5px 12px', borderRadius: 4, cursor: 'pointer' },
  emptyState: { textAlign: 'center' as const, padding: 60, background: 'white', borderRadius: 8 },
  emptyCreateBtn: { display: 'inline-block', marginTop: 16, background: '#FF4500', color: 'white', padding: '10px 20px', borderRadius: 20, textDecoration: 'none' },
  loadingContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', background: '#DAE0E6' },
  spinner: { width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #FF4500', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }
}

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`
  document.head.appendChild(style)
}