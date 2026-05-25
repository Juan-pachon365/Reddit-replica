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

export default function HomePage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getUser()
    fetchPosts()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username
          )
        `)
        .order('created_at', { ascending: false })

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
    
    // Optimistic update
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, upvotes: newVotes } : post
    ))

    const { error } = await supabase
      .from('posts')
      .update({ upvotes: newVotes })
      .eq('id', postId)

    if (error) {
      console.error('Error al votar:', error)
      // Revertir si hay error
      fetchPosts()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/" style={styles.logoLink}>
            <h1 style={styles.logo}>reddit<span style={styles.dot}>clone</span></h1>
          </Link>
          
          <div style={styles.headerActions}>
            {user ? (
              <>
                <Link href="/dashboard" style={styles.dashboardBtn}>
                  Dashboard
                </Link>
                <Link href="/user/pages" style={styles.profileBtn}>
                  Mi Perfil
                </Link>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={styles.loginBtn}>Iniciar sesión</Link>
                <Link href="/register" style={styles.registerBtn}>Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.feedHeader}>
          <h2 style={styles.feedTitle}>Feed Principal</h2>
          {user && (
            <Link href="/dashboard/create-post" style={styles.createPostBtn}>
              + Crear Post
            </Link>
          )}
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>😕 No hay publicaciones aún</p>
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
                  <span style={styles.subreddit}>r/{post.subreddit}</span>
                  <span style={styles.postAuthor}>
                    • Publicado por u/{post.profiles?.username || 'anonimo'}
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
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoLink: {
    textDecoration: 'none',
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
    gap: '12px',
    alignItems: 'center',
  },
  loginBtn: {
    color: '#FF4500',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  registerBtn: {
    background: '#FF4500',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  dashboardBtn: {
    background: '#FF4500',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  profileBtn: {
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
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  },
  feedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  feedTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1c1c1c',
    margin: 0,
  },
  createPostBtn: {
    background: '#FF4500',
    color: 'white',
    padding: '8px 16px',
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
    fontSize: '14px',
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
    flexWrap: 'wrap',
  },
  subreddit: {
    fontWeight: 'bold',
    color: '#FF4500',
  },
  postAuthor: {
    color: '#666',
  },
  postDate: {
    color: '#666',
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
  },
  loadingContainer: {
    textAlign: 'center' as const,
    padding: '60px',
    background: 'white',
    borderRadius: '8px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #FF4500',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
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