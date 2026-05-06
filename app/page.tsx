'use client'
import { useState, useEffect, useRef } from 'react'
import { translations, t, type Language } from '../lib/i18n'
import { moderateMessage } from '../lib/moderation'

// Types
type Room = { id: string; name: string; icon: string; category: string; memberCount: number; description: string; featured?: boolean }
type Message = { id: string; userId: string; username: string; content: string; timestamp: Date; reactions: Record<string,number>; replyTo?: string }
type User = { id: string; username: string; isPremium: boolean; isOnline: boolean; color: string }
type View = 'rooms' | 'chat' | 'dms' | 'discover' | 'profile' | 'admin'

const ROOMS: Room[] = [
  { id: '1', name: 'General', icon: '💬', category: 'general', memberCount: 1842, description: 'Sala general para todos', featured: true },
  { id: '2', name: 'Sneakers', icon: '👟', category: 'sneakers', memberCount: 934, description: 'Habla sobre tus sneakers favoritos', featured: true },
  { id: '3', name: 'Gaming', icon: '🎮', category: 'gaming', memberCount: 2103, description: 'Para los gamers de LATAM', featured: true },
  { id: '4', name: 'Música', icon: '🎵', category: 'music', memberCount: 756, description: 'Comparte y descubre música' },
  { id: '5', name: 'CDMX', icon: '🌮', category: 'mexico', memberCount: 1231, description: 'Para los chilangos', featured: true },
  { id: '6', name: 'Tech', icon: '💻', category: 'tech', memberCount: 612, description: 'Tecnología y startups' },
  { id: '7', name: 'Streetwear', icon: '🧥', category: 'streetwear', memberCount: 889, description: 'Moda urbana y tendencias', featured: true },
  { id: '8', name: 'Creadores', icon: '🎨', category: 'creators', memberCount: 445, description: 'Creadores de contenido' },
  { id: '9', name: 'Memes', icon: '😂', category: 'memes', memberCount: 3201, description: 'Los mejores memes en español', featured: true },
  { id: '10', name: 'Anime', icon: '⛩️', category: 'anime', memberCount: 1087, description: 'Comunidad anime en español' },
  { id: '11', name: 'LATAM', icon: '🌎', category: 'latam', memberCount: 2445, description: 'Toda América Latina' },
  { id: '12', name: 'Relaciones', icon: '❤️', category: 'relationships', memberCount: 567, description: 'Consejos y experiencias' },
  { id: '13', name: 'Moda', icon: '👗', category: 'fashion', memberCount: 398, description: 'Tendencias de moda y estilo' },
]

const SAMPLE_MESSAGES: Message[] = [
  { id: '1', userId: 'u1', username: 'xavi_mx', content: 'Qué onda con todos!! 🔥', timestamp: new Date(Date.now()-300000), reactions: {'🔥':3,'❤️':1} },
  { id: '2', userId: 'u2', username: 'UrbanKing99', content: 'Ya llegué al chat, buenas noches 🌙', timestamp: new Date(Date.now()-240000), reactions: {'👋':2} },
  { id: '3', userId: 'u3', username: 'sneaker_queen', content: 'Alguien vio los nuevos Jordans que salieron? están fire', timestamp: new Date(Date.now()-180000), reactions: {'👟':5,'🔥':4} },
  { id: '4', userId: 'u4', username: 'cdmx_vibes', content: 'Jeje sí, están caros pero bien chidos', timestamp: new Date(Date.now()-120000), reactions: {} },
  { id: '5', userId: 'u1', username: 'xavi_mx', content: 'Este chat siempre activo, me encanta la comunidad 💚', timestamp: new Date(Date.now()-60000), reactions: {'💚':7,'🙌':3} },
]

const ONLINE_USERS: User[] = [
  { id: 'u1', username: 'xavi_mx', isPremium: true, isOnline: true, color: '#00ff88' },
  { id: 'u2', username: 'UrbanKing99', isPremium: false, isOnline: true, color: '#4488ff' },
  { id: 'u3', username: 'sneaker_queen', isPremium: true, isOnline: true, color: '#ff3366' },
  { id: 'u4', username: 'cdmx_vibes', isPremium: false, isOnline: true, color: '#9966ff' },
  { id: 'u5', username: 'mxstreet', isPremium: false, isOnline: false, color: '#ffd700' },
  { id: 'u6', username: 'latam_flow', isPremium: true, isOnline: true, color: '#ff9900' },
  { id: 'u7', username: 'gamer_pro_mx', isPremium: false, isOnline: true, color: '#44ffee' },
]

const EMOJIS = ['🔥','❤️','😂','👟','💚','🙌','👋','🌙','✨','💯','🤙','🎉']

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  return `hace ${Math.floor(mins/60)}h`
}

function Avatar({ username, color, size=36 }: { username: string; color?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.38, color: color || 'var(--accent-primary)', flexShrink: 0, border: '1.5px solid #2a2a2a' }}>
      {username[0].toUpperCase()}
    </div>
  )
}

export default function UrbanVaultApp() {
  const [lang, setLang] = useState<Language>('es')
  const [view, setView] = useState<View>('rooms')
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES)
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [blocked, setBlocked] = useState<string[]>([])
  const [replyTo, setReplyTo] = useState<Message|null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string|null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [currentUser] = useState({ id: 'me', username: 'tu_usuario', isPremium: true, color: '#00ff88' })
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [notification, setNotification] = useState<string|null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const tr = (key: keyof typeof translations.es) => t(lang, key)

  useEffect(() => {
    const saved = localStorage.getItem('uv-language')
    if (saved === 'en' || saved === 'es') setLang(saved)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Simulate incoming messages
  useEffect(() => {
    if (!activeRoom) return
    const bots = ['xavi_mx','UrbanKing99','sneaker_queen','cdmx_vibes','latam_flow']
    const botMsgs = [
      '🔥🔥🔥', 'Alguien más aquí?', 'Buenas tardes comunidad!', 
      'Ese tema está bien bueno', 'Jajaja exacto', '100% de acuerdo',
      'Qué onda con todos 👋', 'Saludos desde CDMX 🌮',
    ]
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const bot = bots[Math.floor(Math.random() * bots.length)]
        const msg = botMsgs[Math.floor(Math.random() * botMsgs.length)]
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            userId: bot,
            username: bot,
            content: msg,
            timestamp: new Date(),
            reactions: {}
          }])
        }, 1500)
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [activeRoom])

  function sendMessage() {
    if (!input.trim()) return
    const modResult = moderateMessage(input)
    if (!modResult.isAllowed) {
      setNotification(lang === 'es' ? '⚠️ Mensaje bloqueado por violar las normas' : '⚠️ Message blocked for violating guidelines')
      return
    }
    const newMsg: Message = {
      id: Date.now().toString(),
      userId: 'me',
      username: currentUser.username,
      content: modResult.filteredMessage || input,
      timestamp: new Date(),
      reactions: {},
      replyTo: replyTo?.id
    }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setReplyTo(null)
  }

  function addReaction(msgId: string, emoji: string) {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: { ...m.reactions, [emoji]: (m.reactions[emoji] || 0) + 1 } } : m))
    setShowEmojiPicker(null)
  }

  function switchLang(l: Language) {
    setLang(l)
    localStorage.setItem('uv-language', l)
  }

  const filteredRooms = ROOMS.filter(r => {
    const matchQuery = r.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = activeCategory === 'all' || r.category === activeCategory
    return matchQuery && matchCat
  })

  const categories = ['all', 'gaming', 'sneakers', 'music', 'mexico', 'tech', 'streetwear', 'memes', 'anime', 'fashion']
  const catLabels: Record<string,string> = { all: lang==='es'?'Todos':'All', gaming:'Gaming', sneakers:'Sneakers', music:lang==='es'?'Música':'Music', mexico:'México', tech:'Tech', streetwear:'Streetwear', memes:'Memes', anime:'Anime', fashion:lang==='es'?'Moda':'Fashion' }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }} />
      )}

      {/* Sidebar */}
      <aside style={{ width: 260, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0, height: "100vh", zIndex: 50, transition: 'transform 0.3s ease' }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="uv-logo">UrbanVault</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => switchLang('es')} style={{ fontSize: 12, padding: '3px 8px', background: lang==='es'?'var(--accent-primary)':'transparent', color: lang==='es'?'#000':'var(--text-muted)', border: '1px solid var(--border-medium)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>ES</button>
              <button onClick={() => switchLang('en')} style={{ fontSize: 12, padding: '3px 8px', background: lang==='en'?'var(--accent-primary)':'transparent', color: lang==='en'?'#000':'var(--text-muted)', border: '1px solid var(--border-medium)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>EN</button>
            </div>
          </div>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
            <Avatar username={currentUser.username} color={currentUser.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {currentUser.username}
                {currentUser.isPremium && <span className="uv-badge-vip">VIP</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="uv-badge-online"></span> {tr('enLinea')}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1, overflow: 'auto' }}>
          {[
            { view: 'rooms' as View, icon: '🏠', label: tr('salas') },
            { view: 'discover' as View, icon: '🔍', label: tr('descubrir') },
            { view: 'dms' as View, icon: '✉️', label: tr('mensajes') },
            { view: 'profile' as View, icon: '👤', label: tr('perfil') },
          ].map(item => (
            <div key={item.view} className={`uv-sidebar-item ${view === item.view ? 'active' : ''}`} onClick={() => { setView(item.view); setSidebarOpen(false) }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          <div style={{ margin: '12px 0 8px', padding: '0 12px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {tr('salasPublicas')}
          </div>

          {ROOMS.slice(0, 8).map(room => (
            <div key={room.id} className={`uv-sidebar-item ${activeRoom?.id === room.id && view === 'chat' ? 'active' : ''}`} onClick={() => { setActiveRoom(room); setView('chat'); setSidebarOpen(false) }} style={{ fontSize: 13 }}>
              <span style={{ fontSize: 14 }}>{room.icon}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{(room.memberCount/1000).toFixed(1)}k</span>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6 }}>
          <button className="uv-btn-ghost" style={{ flex: 1, fontSize: 12, padding: '8px 12px' }} onClick={() => { setShowAdminLogin(true); setSidebarOpen(false) }}>
            🛡️ Admin
          </button>
          <button style={{ padding: '8px 12px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 10, cursor: 'pointer', fontSize: 12, color: '#ffd700', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            ✨ Premium
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ height: 58, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20, display: 'none' }} className="mobile-menu-btn">
            ☰
          </button>
          {view === 'chat' && activeRoom ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <button onClick={() => setView('rooms')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>←</button>
              <span style={{ fontSize: 20 }}>{activeRoom.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{activeRoom.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{activeRoom.memberCount.toLocaleString()} {tr('miembros')}</div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                {view === 'rooms' && tr('salasPublicas')}
                {view === 'discover' && tr('descubrir')}
                {view === 'dms' && tr('mensajes')}
                {view === 'profile' && tr('perfil')}
                {view === 'admin' && tr('panelAdmin')}
              </div>
            </div>
          )}
          {view === 'chat' && activeRoom && (
            <div style={{ display: 'flex', gap: 6 }}>
              {ONLINE_USERS.filter(u => u.isOnline).slice(0, 4).map(u => (
                <Avatar key={u.id} username={u.username} color={u.color} size={28} />
              ))}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
                +{activeRoom.memberCount - 4}
              </div>
            </div>
          )}
        </header>

        {/* Content area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {/* ROOMS VIEW */}
          {view === 'rooms' && (
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {/* Search */}
              <div style={{ marginBottom: 20 }}>
                <input className="uv-input" placeholder={tr('buscarSalas')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ maxWidth: 400 }} />
              </div>
              {/* Categories */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '6px 14px', borderRadius: 20, background: activeCategory === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: activeCategory === cat ? '#000' : 'var(--text-secondary)', border: `1px solid ${activeCategory === cat ? 'var(--accent-primary)' : 'var(--border-medium)'}`, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, transition: 'all 0.15s' }}>
                    {catLabels[cat]}
                  </button>
                ))}
              </div>
              {/* Featured */}
              {activeCategory === 'all' && !searchQuery && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                    ⚡ {tr('tendencias')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {ROOMS.filter(r => r.featured).map(room => (
                      <div key={room.id} className="uv-room-card" onClick={() => { setActiveRoom(room); setView('chat') }} style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--accent-primary), transparent)' }}></div>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{room.icon}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{room.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{room.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                            🟢 {room.memberCount.toLocaleString()} {tr('activo')}
                          </span>
                          <button className="uv-btn-primary" style={{ fontSize: 11, padding: '5px 12px' }}>{tr('unirte')}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* All rooms */}
              <div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                  {tr('salasPublicas')} ({filteredRooms.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {filteredRooms.map(room => (
                    <div key={room.id} className="uv-room-card" onClick={() => { setActiveRoom(room); setView('chat') }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 22 }}>{room.icon}</span>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{room.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{room.memberCount.toLocaleString()}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{room.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHAT VIEW */}
          {view === 'chat' && activeRoom && (
            <>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Messages */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    <span style={{ fontSize: 32 }}>{activeRoom.icon}</span>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginTop: 8 }}>{activeRoom.name}</div>
                    <div style={{ fontSize: 12 }}>{activeRoom.description}</div>
                    <div style={{ margin: '12px 0', height: 1, background: 'var(--border-subtle)' }}></div>
                  </div>

                  {messages.map(msg => {
                    const isMe = msg.userId === 'me'
                    const user = ONLINE_USERS.find(u => u.username === msg.username)
                    const replyMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null
                    return (
                      <div key={msg.id} className="uv-slide-up" style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
                        <Avatar username={msg.username} color={user?.color || '#888'} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {replyMsg && (
                            <div style={{ padding: '4px 8px', background: 'var(--bg-elevated)', borderRadius: 6, borderLeft: '2px solid var(--accent-primary)', marginBottom: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                              ↩ {replyMsg.username}: {replyMsg.content.slice(0, 50)}...
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: isMe ? 'var(--accent-primary)' : (user?.color || 'var(--text-primary)') }}>{msg.username}</span>
                            {user?.isPremium && <span className="uv-badge-vip">VIP</span>}
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{timeAgo(msg.timestamp)}</span>
                          </div>
                          <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</div>
                          {/* Reactions */}
                          {Object.entries(msg.reactions).length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                              {Object.entries(msg.reactions).map(([emoji, count]) => (
                                <button key={emoji} onClick={() => addReaction(msg.id, emoji)} style={{ padding: '2px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 12, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {emoji} {count}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Message actions */}
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: '2px 4px' }}>😊</button>
                            <button onClick={() => setReplyTo(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', padding: '2px 4px' }}>↩ {tr('responder')}</button>
                          </div>
                          {showEmojiPicker === msg.id && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 10, marginTop: 4, maxWidth: 260 }}>
                              {EMOJIS.map(e => (
                                <button key={e} onClick={() => addReaction(msg.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px' }}>{e}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  
                  {isTyping && (
                    <div style={{ display: 'flex', gap: 10, padding: '6px 0', alignItems: 'center' }}>
                      <Avatar username="U" size={34} />
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '8px 12px', display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span className="uv-typing-dot"></span>
                        <span className="uv-typing-dot"></span>
                        <span className="uv-typing-dot"></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                  {replyTo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 8, marginBottom: 8, borderLeft: '2px solid var(--accent-primary)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>↩ {replyTo.username}: {replyTo.content.slice(0,60)}</span>
                      <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <input
                      className="uv-input"
                      placeholder={tr('escribeUnMensaje')}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      style={{ flex: 1 }}
                    />
                    <button className="uv-btn-primary" onClick={sendMessage} style={{ padding: '12px 20px', flexShrink: 0 }}>
                      {tr('enviar')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Online users panel */}
              <div style={{ width: 200, borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', padding: '16px 12px', overflow: 'auto', flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {tr('usuariosEnLinea')} — {ONLINE_USERS.filter(u => u.isOnline).length}
                </div>
                {ONLINE_USERS.map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', opacity: user.isOnline ? 1 : 0.5 }}>
                    <Avatar username={user.username} color={user.color} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {user.username}
                        {user.isPremium && <span style={{ fontSize: 8, background: '#ffd70022', color: '#ffd700', border: '1px solid #ffd70044', borderRadius: 4, padding: '0 3px', fontFamily: 'var(--font-mono)' }}>VIP</span>}
                      </div>
                      <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, background: user.isOnline ? 'var(--accent-primary)' : '#555', borderRadius: '50%', display: 'inline-block' }}></span>
                        <span style={{ color: user.isOnline ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{user.isOnline ? tr('enLinea') : tr('desconectado')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* DISCOVER VIEW */}
          {view === 'discover' && (
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <div className="uv-gradient-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
                  {tr('descubrir')}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{tr('subtitulo')}</div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <input className="uv-input" placeholder={tr('buscarSalas')} style={{ flex: 1, maxWidth: 300 }} />
                <input className="uv-input" placeholder={tr('buscarUsuarios')} style={{ flex: 1, maxWidth: 300 }} />
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
                {[
                  { label: lang==='es'?'Usuarios activos':'Active users', value: '12.4k', icon: '👥' },
                  { label: lang==='es'?'Mensajes hoy':'Messages today', value: '89.2k', icon: '💬' },
                  { label: lang==='es'?'Salas públicas':'Public rooms', value: '13', icon: '🏠' },
                  { label: lang==='es'?'Comunidades':'Communities', value: '28', icon: '🌎' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--accent-primary)' }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Trending rooms */}
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                🔥 {tr('tendencias')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 32 }}>
                {ROOMS.sort((a,b) => b.memberCount - a.memberCount).slice(0,6).map(room => (
                  <div key={room.id} className="uv-room-card" onClick={() => { setActiveRoom(room); setView('chat') }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 28 }}>{room.icon}</span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{room.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{room.memberCount.toLocaleString()} miembros</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{room.description}</div>
                    <button className="uv-btn-primary" style={{ width: '100%', fontSize: 12 }}>{tr('unirte')}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DMS VIEW */}
          {view === 'dms' && (
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>{tr('mensajes')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ONLINE_USERS.map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-medium)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
                    <div style={{ position: 'relative' }}>
                      <Avatar username={user.username} color={user.color} size={42} />
                      <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: user.isOnline ? 'var(--accent-primary)' : '#555', border: '2px solid var(--bg-secondary)', borderRadius: '50%' }}></span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {user.username}
                        {user.isPremium && <span className="uv-badge-vip">VIP</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.isOnline ? tr('enLinea') : tr('desconectado')}</div>
                    </div>
                    <button className="uv-btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>DM</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE VIEW */}
          {view === 'profile' && (
            <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 600 }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ height: 120, background: 'linear-gradient(135deg, #00ff8833, #4488ff22)', position: 'relative' }}>
                  <div style={{ position: 'absolute', bottom: -30, left: 24 }}>
                    <Avatar username={currentUser.username} color={currentUser.color} size={60} />
                  </div>
                </div>
                <div style={{ padding: '40px 24px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {currentUser.username}
                        {currentUser.isPremium && <span className="uv-badge-vip">VIP</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>🌮 Ciudad de México</div>
                    </div>
                    <button className="uv-btn-ghost" style={{ fontSize: 12, padding: '8px 16px' }}>{tr('editarPerfil')}</button>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                    Lover de sneakers 👟 | Streetwear fanatic | CDMX 🌮 | Premium member ✨
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {[['1.2k', lang==='es'?'Seguidores':'Followers'], ['342', lang==='es'?'Siguiendo':'Following'], ['89', lang==='es'?'Salas':'Rooms']].map(([val, label]) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--accent-primary)' }}>{val}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Premium Card */}
              <div style={{ background: 'linear-gradient(135deg, #1a1500, #2a1f00)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 16, padding: '20px', boxShadow: '0 0 30px rgba(255,215,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#ffd700' }}>✨ {tr('premium')}</div>
                  <span className="uv-badge-vip">ACTIVO</span>
                </div>
                <div style={{ fontSize: 13, color: '#886600', lineHeight: 1.7 }}>
                  ✓ {lang==='es'?'Crear hasta 3 salas públicas':'Create up to 3 public rooms'}<br/>
                  ✓ {lang==='es'?'Grupos privados ilimitados':'Unlimited private groups'}<br/>
                  ✓ {lang==='es'?'Insignia VIP':'VIP Badge'}<br/>
                  ✓ {lang==='es'?'Perfil personalizado':'Custom profile'}<br/>
                  ✓ {lang==='es'?'Banners de sala':'Room banners'}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN VIEW */}
          {view === 'admin' && isAdmin && (
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 24, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                🛡️ {tr('panelAdmin')}
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
                {[
                  { label: tr('usuariosTotal'), value: '12,483', color: 'var(--accent-primary)', icon: '👥' },
                  { label: tr('mensajesHoy'), value: '89,241', color: 'var(--accent-blue)', icon: '💬' },
                  { label: tr('reportesPendientes'), value: '7', color: 'var(--accent-secondary)', icon: '⚠️' },
                  { label: tr('salasModeradas'), value: '13', color: 'var(--accent-gold)', icon: '🏠' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', border: `1px solid ${stat.color}22`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Users table */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {tr('gestionarUsuarios')}
                  <button className="uv-btn-ghost" style={{ fontSize: 11, padding: '4px 12px' }}>Export CSV</button>
                </div>
                {ONLINE_USERS.map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <Avatar username={user.username} color={user.color} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {user.username}
                        {user.isPremium && <span className="uv-badge-vip">VIP</span>}
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: user.isOnline ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)', color: user.isOnline ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{user.isOnline ? tr('enLinea') : tr('desconectado')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ padding: '4px 10px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: '#ffd700' }}>Mute</button>
                      <button onClick={() => setNotification(lang==='es'?'✓ Usuario baneado':'✓ User banned')} style={{ padding: '4px 10px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: 'var(--accent-secondary)' }}>Ban</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Moderation queue */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--accent-secondary)' }}>
                  ⚠️ {tr('moderacion')} — {tr('reportesPendientes')}
                </div>
                {[
                  { user: 'anon_user_1', msg: 'Mensaje reportado por lenguaje inapropiado', room: 'General', time: '2 min' },
                  { user: 'user_problematic', msg: 'Posible spam detectado automáticamente', room: 'Gaming', time: '5 min' },
                  { user: 'troll_account', msg: 'Reporte por acoso a usuario', room: 'Sneakers', time: '12 min' },
                ].map((report, i) => (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: 2 }}>{report.user} — #{report.room}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{report.msg}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>hace {report.time}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setNotification('✓ Reporte resuelto')} style={{ padding: '4px 10px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: 'var(--accent-primary)' }}>OK</button>
                      <button style={{ padding: '4px 10px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: 'var(--accent-secondary)' }}>Ban</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="uv-card uv-slide-up" style={{ padding: 32, width: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Admin Access</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Ingresa tu PIN de administrador</div>
            <input
              className="uv-input"
              type="password"
              placeholder="Admin PIN"
              value={adminPin}
              onChange={e => setAdminPin(e.target.value)}
              style={{ marginBottom: 16, textAlign: 'center', letterSpacing: 8, fontSize: 20 }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (adminPin === '2024') {
                    setIsAdmin(true)
                    setView('admin')
                    setShowAdminLogin(false)
                    setAdminPin('')
                  } else {
                    setNotification('❌ PIN incorrecto')
                    setAdminPin('')
                  }
                }
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="uv-btn-ghost" style={{ flex: 1 }} onClick={() => { setShowAdminLogin(false); setAdminPin('') }}>Cancelar</button>
              <button className="uv-btn-primary" style={{ flex: 1 }} onClick={() => {
                if (adminPin === '2024') {
                  setIsAdmin(true); setView('admin'); setShowAdminLogin(false); setAdminPin('')
                } else {
                  setNotification('❌ PIN incorrecto'); setAdminPin('')
                }
              }}>Entrar</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>Demo PIN: 2024</div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {notification && (
        <div className="uv-slide-up" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 10, padding: '12px 20px', fontSize: 14, zIndex: 200, whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {notification}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          aside { position: fixed !important; transform: translateX(${sidebarOpen ? '0' : '-100%'}) !important; width: 280px !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  )
}
