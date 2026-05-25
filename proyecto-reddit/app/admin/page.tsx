'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Profile {
  id: string;
  username: string;
  email: string;
  karma: number;
  telefono: string | null;
  nombre_completo: string | null;
  role: string;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  upvotes: number;
  created_at: string;
  user_id: string;
  profiles: Profile[] | Profile | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  user_id: string;
  profiles: Profile[] | Profile | null;
  posts: { title: string } | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'comments'>('posts');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== 'admin') { router.push("/dashboard"); return; }

    setIsAdmin(true);
    fetchPosts();
    fetchUsers();
    fetchComments();
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`*, profiles!user_id (id, username, email)`)
      .order("created_at", { ascending: false });

    if (error) { setMessage("❌ Error al cargar posts"); }
    else { setPosts(data || []); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { setMessage("❌ Error al cargar usuarios"); }
    else { setUsers(data || []); }
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`*, profiles!user_id (id, username), posts!post_id (title)`)
      .order("created_at", { ascending: false });

    if (error) { setMessage("❌ Error al cargar comentarios"); }
    else { setComments(data || []); }
  };

  const deletePost = async (id: string) => {
    if (!confirm("¿Eliminar este post permanentemente?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { setMessage("❌ Error al eliminar post"); }
    else { setMessage("✅ Post eliminado"); fetchPosts(); setTimeout(() => setMessage(""), 3000); }
  };

  const updateUserRole = async (id: string, newRole: string) => {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    if (error) { setMessage("❌ Error al actualizar rol"); }
    else { setMessage("✅ Rol actualizado"); fetchUsers(); setTimeout(() => setMessage(""), 3000); }
  };

  const deleteComment = async (id: string) => {
    if (!confirm("¿Eliminar este comentario?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) { setMessage("❌ Error al eliminar comentario"); }
    else { setMessage("✅ Comentario eliminado"); fetchComments(); setTimeout(() => setMessage(""), 3000); }
  };

  const getUsername = (profile: Profile[] | Profile | null) => {
    if (!profile) return "Usuario";
    if (Array.isArray(profile)) return profile[0]?.username || "Usuario";
    return profile.username || "Usuario";
  };

  if (!isAdmin) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Verificando permisos...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Cargando panel admin...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/">
            <Image src="/icon.png" alt="Logo" width={120} height={40} priority />
          </Link>
          <div style={styles.headerActions}>
            <Link href="/dashboard" style={styles.backBtn}>← Dashboard</Link>
            <button onClick={() => supabase.auth.signOut()} style={styles.logoutBtn}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.adminContainer}>
          <h1 style={styles.title}>👑 Panel Administrativo</h1>

          {message && (
            <p style={message.includes("✅") ? styles.successMsg : styles.errorMsg}>
              {message}
            </p>
          )}

          <div style={styles.tabs}>
            <button onClick={() => setActiveTab('posts')} style={{ ...styles.tab, ...(activeTab === 'posts' ? styles.tabActive : {}) }}>
              📝 Posts ({posts.length})
            </button>
            <button onClick={() => setActiveTab('users')} style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : {}) }}>
              👥 Usuarios ({users.length})
            </button>
            <button onClick={() => setActiveTab('comments')} style={{ ...styles.tab, ...(activeTab === 'comments' ? styles.tabActive : {}) }}>
              💬 Comentarios ({comments.length})
            </button>
          </div>

          {activeTab === 'posts' && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>📝 Publicaciones</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Usuario</th>
                      <th style={styles.th}>Subreddit</th>
                      <th style={styles.th}>Título</th>
                      <th style={styles.th}>Votos</th>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} style={styles.tableRow}>
                        <td style={styles.td}>u/{getUsername(post.profiles)}</td>
                        <td style={styles.td}>r/{post.subreddit}</td>
                        <td style={styles.td}>{post.title}</td>
                        <td style={styles.td}>👍 {post.upvotes || 0}</td>
                        <td style={styles.td}>{new Date(post.created_at).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <button onClick={() => deletePost(post.id)} style={styles.dangerBtn}>🗑️ Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>👥 Usuarios Registrados</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Usuario</th>
                      <th style={styles.th}>Nombre Completo</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Teléfono</th>
                      <th style={styles.th}>Karma</th>
                      <th style={styles.th}>Rol</th>
                      <th style={styles.th}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={styles.tableRow}>
                        <td style={styles.td}>u/{user.username}</td>
                        <td style={styles.td}>{user.nombre_completo || '-'}</td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>{user.telefono || '-'}</td>
                        <td style={styles.td}>🌟 {user.karma || 0}</td>
                        <td style={styles.td}>
                          <select value={user.role || 'user'} onChange={(e) => updateUserRole(user.id, e.target.value)} style={styles.select}>
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          <Link href={`/user/${user.id}`} style={styles.viewBtn}>👤 Ver</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'comments' && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>💬 Comentarios</h2>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Usuario</th>
                      <th style={styles.th}>Post</th>
                      <th style={styles.th}>Comentario</th>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comments.map((comment) => (
                      <tr key={comment.id} style={styles.tableRow}>
                        <td style={styles.td}>u/{getUsername(comment.profiles)}</td>
                        <td style={styles.td}>{comment.posts?.title || 'Post eliminado'}</td>
                        <td style={styles.td}>{comment.content?.substring(0, 50)}...</td>
                        <td style={styles.td}>{new Date(comment.created_at).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <button onClick={() => deleteComment(comment.id)} style={styles.dangerBtn}>🗑️ Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', background: '#DAE0E6' },
  header: { background: 'white', padding: '12px 20px', borderBottom: '1px solid #EDEFF1' },
  headerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { display: 'flex', gap: '12px' },
  backBtn: { color: '#FF4500', textDecoration: 'none', padding: '8px 16px', border: '1px solid #FF4500', borderRadius: '20px' },
  logoutBtn: { background: 'none', color: '#FF4500', border: '1px solid #FF4500', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
  adminContainer: { background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center', color: '#FF4500' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #EDEFF1', paddingBottom: '12px' },
  tab: { padding: '10px 20px', background: 'none', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#666' },
  tabActive: { background: '#FF4500', color: 'white' },
  section: { marginTop: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1c1c1c' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#F6F7F8', borderBottom: '2px solid #EDEFF1' },
  th: { padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#1c1c1c' },
  tableRow: { borderBottom: '1px solid #EDEFF1' },
  td: { padding: '12px', color: '#333' },
  select: { padding: '6px 10px', borderRadius: '4px', border: '1px solid #EDEFF1', background: '#F6F7F8' },
  dangerBtn: { background: '#FF4500', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px' },
  viewBtn: { background: '#F6F7F8', color: '#1c1c1c', textDecoration: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' },
  successMsg: { padding: '12px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' },
  errorMsg: { padding: '12px', background: '#FFEBEE', color: '#C62828', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' },
  loadingContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#DAE0E6' },
  spinner: { width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #FF4500', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' },
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}