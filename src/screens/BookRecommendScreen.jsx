import { useState, useEffect, useRef } from 'react'
import { createBookRecommendChat } from '../services/groq'

const BOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

async function fetchBookCover(title, author) {
  if (!BOOKS_KEY) return null
  try {
    const q = encodeURIComponent(`${title} ${author}`)
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&key=${BOOKS_KEY}`)
    const data = await res.json()
    const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
    return thumb ? thumb.replace('http:', 'https:') : null
  } catch {
    return null
  }
}

function parseBooks(content) {
  const match = content.match(/\[[\s\S]*?\]/)
  if (!match) return { text: content, books: [] }
  try {
    const books = JSON.parse(match[0])
    const text = content.replace(match[0], '').trim()
    return { text, books }
  } catch {
    return { text: content, books: [] }
  }
}

function BookCard({ title, author, reason, onAdd }) {
  const [cover, setCover] = useState(null)

  useEffect(() => {
    fetchBookCover(title, author).then(setCover)
  }, [title, author])

  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: 12,
      display: 'flex', gap: 12, alignItems: 'flex-start',
      boxShadow: '0 2px 10px rgba(0,0,0,.08)', marginBottom: 10,
    }}>
      <div style={{
        width: 60, height: 84, borderRadius: 8, overflow: 'hidden',
        flexShrink: 0, background: 'var(--beige)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {cover
          ? <img src={cover} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 26 }}>📖</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--txt)', marginBottom: 2, wordBreak: 'keep-all' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>{author}</div>
        <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5, wordBreak: 'keep-all' }}>{reason}</div>
        <button
          onClick={() => onAdd({ title, author })}
          style={{
            marginTop: 8, background: 'var(--green-dark)', color: 'white',
            border: 'none', borderRadius: 8, padding: '5px 12px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
          + 내 책장에 추가
        </button>
      </div>
    </div>
  )
}

export default function BookRecommendScreen({ apiKey, onAddBook }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(null)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  useEffect(() => {
    if (!apiKey) return
    start()
  }, [])

  const start = async () => {
    setLoading(true)
    try {
      const s = createBookRecommendChat(apiKey)
      setSession(s)
      const reply = await s.sendMessage('안녕! 나한테 책 추천해줘. 먼저 내 취향을 물어봐줘.')
      setMsgs([{ role: 'model', content: reply }])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const send = async () => {
    if (!input.trim() || loading || !session) return
    const userMsg = { role: 'user', content: input.trim() }
    setMsgs((p) => [...p, userMsg])
    setInput('')
    setLoading(true)
    try {
      const reply = await session.sendMessage(userMsg.content)
      setMsgs((p) => [...p, { role: 'model', content: reply }])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100% - var(--nav-h))', overflow:'hidden' }}>
      {/* 헤더 */}
      <div style={{
        padding: '50px 20px 14px', background: 'var(--bg)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{
            background: 'var(--green-light)', borderRadius: 50,
            padding: '9px 28px', fontWeight: 900, fontSize: 16,
            color: 'var(--green-dark)', letterSpacing: 2,
          }}>
            CHEKKU CHAT
          </div>
          <div style={{
            position: 'absolute', right: 0, width: 38, height: 38,
            borderRadius: '50%', background: 'var(--beige)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, border: '2px solid var(--border)',
          }}>
            👤
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="chat-msgs">
        {!apiKey && (
          <div className="empty">
            <div className="empty-icon">🔑</div>
            <p>API 키를 먼저 설정해주세요<br/>⚙️ 버튼을 눌러 Groq 키를 입력하세요</p>
          </div>
        )}

        {msgs.map((m, i) => {
          if (m.role === 'user') {
            return (
              <div key={i} className="msg-row me">
                <div className="bubble me">{m.content}</div>
              </div>
            )
          }
          const { text, books } = parseBooks(m.content)
          return (
            <div key={i}>
              {text && (
                <div className="msg-row">
                  <div className="msg-avatar" style={{ background: 'var(--green-dark)', fontSize: 18 }}>📚</div>
                  <div className="bubble ai">{text}</div>
                </div>
              )}
              {books.length > 0 && (
                <div style={{ paddingLeft: 44 }}>
                  {books.map((b, bi) => (
                    <BookCard key={bi} {...b} onAdd={onAddBook} />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div className="msg-row">
            <div className="msg-avatar" style={{ background: 'var(--green-dark)', fontSize: 18 }}>📚</div>
            <div className="bubble ai"><div className="typing"><span /><span /><span /></div></div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* 입력창 */}
      <div className="chat-bottom">
        <div className="chat-input-row">
          <textarea
            className="chat-input" placeholder="chat ..." value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1} disabled={loading || !session}
          />
          <button className="send-btn" onClick={send} disabled={loading || !input.trim() || !session}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
