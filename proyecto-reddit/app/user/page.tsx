'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UserPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setUsername(data.username || '')
      setNombreCompleto(data.nombre_completo || '')
      setTelefono(data.telefono || '')
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update({ username, nombre_completo: nombreCompleto, telefono })
      .eq('id', profile.id)

    if (error) {
      setMensaje('❌ Error al actualizar')
    } else {
      setMensaje('✅ Perfil actualizado correctamente')
      setTimeout(() => setMensaje(''), 3000)
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
        <p>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h1 style={styles.logo}>reddit<span style={styles.dot}>clone</span></h1>
        <nav style={styles.nav}>
          <Link href="/dashboard" style={styles.navLink}>📋 Dashboard</Link>
          <Link href="/dashboard/create-post" style={styles.navLink}>✍️ Crear Post</Link>
          <Link href="/" style={styles.navLink}>🏠 Feed</Link>
          <Link href="/user" style={styles.navActive}>👤 Mi Perfil</Link>
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar sesión</button>
      </aside>

      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>Mi Perfil</h1>
          <form onSubmit={handleUpdate} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre de usuario</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nombre completo</label>
              <input type="text" value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Teléfono</label>
              <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input type="email" value={profile?.email || ''} style={{ ...styles.input, ...styles.readonly }} readOnly />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Karma</label>
              <div style={styles.karmaDisplay}>🌟 {profile?.karma || 0} puntos</div>
            </div>
            <button type="submit" style={styles.saveBtn}>Guardar cambios</button>
          </form>
          {mensaje && <p style={mensaje.includes('✅') ? styles.success : styles.error}>{mensaje}</p>}
        </div>
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
  navLink: { color: '#1c1c1c', textDecoration: 'none' },
  navActive: { color: '#FF4500', fontWeight: 'bold', textDecoration: 'none' },
  logoutBtn: { background: 'none', border: '1px solid #FF4500', color: '#FF4500', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', marginTop: 20 },
  main: { flex: 1, padding: 40, maxWidth: 600, margin: '0 auto', width: '100%' },
  card: { background: 'white', borderRadius: 8, padding: 30, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  title: { fontSize: 24, marginBottom: 24, textAlign: 'center' as const, color: '#1c1c1c' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#1c1c1c' },
  input: { padding: '10px 12px', border: '1px solid #EDEFF1', borderRadius: 4, fontSize: 14, background: '#F6F7F8' },
  readonly: { background: '#EDEFF1', color: '#666' },
  karmaDisplay: { padding: '10px 12px', background: '#F6F7F8', borderRadius: 4, fontSize: 14, color: '#FF4500', fontWeight: 'bold' },
  saveBtn: { padding: 12, background: '#FF4500', color: 'white', border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginTop: 8 },
  success: { marginTop: 16, padding: 12, background: '#E8F5E9', color: '#2E7D32', borderRadius: 8, textAlign: 'center' as const },
  error: { marginTop: 16, padding: 12, background: '#FFEBEE', color: '#C62828', borderRadius: 8, textAlign: 'center' as const },
  loadingContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', background: '#DAE0E6' },
  spinner: { width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #FF4500', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }
}

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`
  document.head.appendChild(style)
}