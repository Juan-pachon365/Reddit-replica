// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  title: string
  content: string
  subreddit: string
  upvotes: number
  created_at: string
  user_id: string
  profiles: {
    username: string
  }
}

// Lista de comunidades populares
const POPULAR_SUBREDDITS = [
  { name: 'general', icon: '🌐', color: '#FF4500' },
  { name: 'tecnologia', icon: '💻', color: '#0079D3' },
  { name: 'gaming', icon: '🎮', color: '#46D160' },
  { name: 'programacion', icon: '👨‍💻', color: '#FF4500' },
  { name: 'preguntas', icon: '❓', color: '#FFB000' },
  { name: 'noticias', icon: '📰', color: '#FF4500' },
  { name: 'musica', icon: '🎵', color: '#24A0ED' },
  { name: 'deportes', icon: '⚽', color: '#46D160' },
]

export default function HomePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>('all')
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [selectedSubreddit])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setAuthChecking(false)
  }

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username
          )
        `)
        .order('created_at', { ascending: false })

      if (selectedSubreddit !== 'all') {
        query = query.eq('subreddit', selectedSubreddit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching posts:', error)
      } else {
        setPosts(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (postId: string, currentVotes: number, increment: number) => {
    if (!user) {
      alert('Inicia sesión para votar')
      router.push('/login')
      return
    }

    const newVotes = currentVotes + increment
    
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, upvotes: newVotes } : post
    ))

    const { error } = await supabase
      .from('posts')
      .update({ upvotes: newVotes })
      .eq('id', postId)

    if (error) {
      console.error('Error al votar:', error)
      fetchPosts()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  if (authChecking || loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/" style={styles.logoLink}>
            <div style={styles.logoWrapper}>
              <span style={styles.logoIcon}>📧</span>
              <h1 style={styles.logo}>reddit<span style={styles.dot}>clone</span></h1>
            </div>
          </Link>
          
          <div style={styles.headerActions}>
            {user ? (
              <div style={styles.userMenu}>
                <span style={styles.userName}>👤 u/{user.email?.split('@')[0]}</span>
                <Link href="/dashboard" style={styles.navBtn}>
                  Dashboard
                </Link>
                <Link href="/user/pages" style={styles.navBtn}>
                  Mi Perfil
                </Link>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div style={styles.authButtons}>
                <Link href="/login" style={styles.loginBtn}>
                  Iniciar sesión
                </Link>
                <Link href="/register" style={styles.registerBtn}>
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <div style={styles.contentWrapper}>
          {/* SIDEBAR - COMUNIDADES */}
          <aside style={styles.sidebar}>
            <div style={styles.sidebarCard}>
              <h3 style={styles.sidebarTitle}>
                <span>🌐</span> Comunidades
              </h3>
              <ul style={styles.subredditList}>
                <li>
                  <button
                    onClick={() => setSelectedSubreddit('all')}
                    style={{
                      ...styles.subredditBtn,
                      ...(selectedSubreddit === 'all' ? styles.subredditActive : {})
                    }}
                  >
                    <span>🏠</span>
                    <span>Todos</span>
                    <span style={styles.postCount}>{posts.length}</span>
                  </button>
                </li>
                {POPULAR_SUBREDDITS.map((sub) => (
                  <li key={sub.name}>
                    <button
                      onClick={() => setSelectedSubreddit(sub.name)}
                      style={{
                        ...styles.subredditBtn,
                        ...(selectedSubreddit === sub.name ? styles.subredditActive : {})
                      }}
                    >
                      <span>{sub.icon}</span>
                      <span>r/{sub.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.sidebarCard}>
              <h3 style={styles.sidebarTitle}>
                <span>📊</span> Acerca de
              </h3>
              <p style={styles.sidebarText}>
                Un clon de Reddit construido con Next.js y Supabase.
                Comparte contenido, vota y comenta.
              </p>
              {!user && (
                <Link href="/register" style={styles.joinBtn}>
                  ✨ Únete ahora
                </Link>
              )}
            </div>

            <div style={styles.sidebarCard}>
              <h3 style={styles.sidebarTitle}>
                <span>⚡</span> Reglas
              </h3>
              <ul style={styles.rulesList}>
                <li>📖 Sé respetuoso</li>
                <li>🔗 No spam</li>
                <li>👍 Vota responsablemente</li>
              </ul>
            </div>
          </aside>

          {/* FEED DE POSTS */}
          <div style={styles.feed}>
            <div style={styles.feedHeader}>
              <div>
                <h2 style={styles.feedTitle}>
                  {selectedSubreddit === 'all' ? 'Feed Principal' : `r/${selectedSubreddit}`}
                </h2>
                <p style={styles.feedSubtitle}>
                  {selectedSubreddit === 'all' 
                    ? 'Lo más reciente de todas las comunidades' 
                    : `Discusiones sobre ${selectedSubreddit}`}
                </p>
              </div>
              {user && (
                <Link href="/dashboard/create-post" style={styles.createPostBtn}>
                  ✍️ Crear Post
                </Link>
              )}
            </div>

            {posts.length === 0 ? (
              <div style={styles.emptyState}>
                <p>😕 No hay publicaciones en {selectedSubreddit === 'all' ? 'ninguna comunidad' : `r/${selectedSubreddit}`}</p>
                {user && (
                  <Link href="/dashboard/create-post" style={styles.emptyCreateBtn}>
                    Sé el primero en publicar
                  </Link>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} style={styles.post}>
                  <div style={styles.voteSection}>
                    <button 
                      onClick={() => handleVote(post.id, post.upvotes, 1)}
                      style={styles.voteUp}
                      title="Upvote"
                    >
                      ▲
                    </button>
                    <span style={styles.voteCount}>{post.upvotes || 0}</span>
                    <button 
                      onClick={() => handleVote(post.id, post.upvotes, -1)}
                      style={styles.voteDown}
                      title="Downvote"
                    >
                      ▼
                    </button>
                  </div>

                  <div style={styles.postContent}>
                    <div style={styles.postMeta}>
                      <Link href={`/r/${post.subreddit}`} style={styles.subredditLink}>
                        <span style={styles.subredditBadge}>r/{post.subreddit}</span>
                      </Link>
                      <span style={styles.postAuthor}>
                        Publicado por u/{post.profiles?.username || 'anonimo'}
                      </span>
                      <span style={styles.postDate}>
                        • {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={styles.postTitle}>{post.title}</h3>
                    {post.content && (
                      <p style={styles.postBody}>
                        {post.content.length > 200 
                          ? `${post.content.substring(0, 200)}...` 
                          : post.content}
                      </p>
                    )}
                    <div style={styles.postFooter}>
                      <Link href={`/post/${post.id}`} style={styles.commentLink}>
                        💬 Ver comentarios
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#DAE0E6',
  },
  header: {
    background: 'white',
    padding: '12px 20px',
    borderBottom: '1px solid #EDEFF1',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  logoLink: {
    textDecoration: 'none',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logo: {
    color: '#FF4500',
    fontSize: '24px',
    margin: 0,
  },
  dot: { 
    color: '#1c1c1c' 
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
  },
  authButtons: {
    display: 'flex',
    gap: '12px',
  },
  userMenu: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  userName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#FF4500',
    background: '#F6F7F8',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  loginBtn: {
    color: '#FF4500',
    textDecoration: 'none',
    fontWeight: 'bold',
    padding: '8px 16px',
  },
  registerBtn: {
    background: '#FF4500',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  navBtn: {
    background: '#F6F7F8',
    color: '#1c1c1c',
    padding: '8px 16px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  logoutBtn: {
    background: 'none',
    color: '#FF4500',
    border: '1px solid #FF4500',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  contentWrapper: {
    display: 'flex',
    gap: '24px',
  },
  sidebar: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebarCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1c1c1c',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  subredditList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  subredditBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#1c1c1c',
    transition: 'all 0.2s',
  },
  subredditActive: {
    background: '#F6F7F8',
    fontWeight: 'bold',
    color: '#FF4500',
  },
  postCount: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#878A8C',
  },
  sidebarText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  rulesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  rulesListLi: {
    padding: '8px 0',
    fontSize: '13px',
    color: '#666',
    borderBottom: '1px solid #EDEFF1',
  },
  joinBtn: {
    display: 'block',
    textAlign: 'center' as const,
    background: '#FF4500',
    color: 'white',
    padding: '10px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  feed: {
    flex: 1,
    minWidth: 0,
  },
  feedHeader: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  feedTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1c1c1c',
    margin: 0,
  },
  feedSubtitle: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  createPostBtn: {
    background: '#FF4500',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  post: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    display: 'flex',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s',
  },
  voteSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    minWidth: '40px',
  },
  voteUp: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#878A8C',
    padding: '4px',
  },
  voteDown: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#878A8C',
    padding: '4px',
  },
  voteCount: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#1c1c1c',
  },
  postContent: {
    flex: 1,
  },
  postMeta: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  subredditLink: {
    textDecoration: 'none',
  },
  subredditBadge: {
    fontWeight: 'bold',
    color: '#FF4500',
    background: '#FFF3E0',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  postAuthor: {
    color: '#666',
  },
  postDate: {
    color: '#878A8C',
  },
  postTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#1c1c1c',
  },
  postBody: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  postFooter: {
    fontSize: '12px',
    color: '#666',
  },
  commentLink: {
    color: '#666',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    background: '#DAE0E6',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #FF4500',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px',
    background: 'white',
    borderRadius: '8px',
    color: '#666',
  },
  emptyCreateBtn: {
    display: 'inline-block',
    marginTop: '16px',
    background: '#FF4500',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '20px',
    textDecoration: 'none',
  },
}

// Agregar animación CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}