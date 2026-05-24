'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Crear usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Insertar perfil en tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, username }])

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>reddit<span style={styles.dot}>clone</span></h1>
        <h2 style={styles.title}>Crear cuenta</h2>

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            placeholder="Nombre de usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <input
            placeholder="Correo electrónico"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p style={styles.link}>
          ¿Ya tienes cuenta?{' '}
          <a href="/login" style={styles.anchor}>Inicia sesión</a>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#DAE0E6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    background: 'white',
    padding: '32px',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  logo: {
    color: '#FF4500',
    fontSize: '28px',
    textAlign: 'center',
    marginBottom: '8px'
  },
  dot: { color: '#1c1c1c' },
  title: {
    textAlign: 'center',
    fontSize: '18px',
    marginBottom: '24px',
    color: '#1c1c1c'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #EDEFF1',
    fontSize: '14px',
    background: '#F6F7F8'
  },
  button: {
    padding: '10px',
    background: '#FF4500',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px'
  },
  error: { color: 'red', fontSize: '13px', textAlign: 'center' },
  link: { textAlign: 'center', marginTop: '16px', fontSize: '13px' },
  anchor: { color: '#FF4500', fontWeight: 'bold', textDecoration: 'none' }
}