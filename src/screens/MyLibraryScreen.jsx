import { useState, useEffect, useRef } from 'react'

const BOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

async function fetchBookCover(title, author) {
  if (!BOOKS_KEY) return null
  try {
    const q = encodeURIComponent(`${title} ${author}`)
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&key=${BOOKS_KEY}`)
    const data = await res.json()
    const info = data.items?.[0]?.volumeInfo
    const thumb = info?.imageLinks?.thumbnail?.replace('http:', 'https:') || null
    return thumb
  } catch {
    return null
  }
}

async function fetchSynopsis(apiKey, title, author) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: '무조건 한국어로만 답변하세요. 다른 언어는 절대 사용하지 마세요.',
          },
          {
            role: 'user',
            content: `"${title}" (저자: ${author})의 줄거리를 한국어로 10줄 이내로 간략하게 소개해주세요. 핵심 내용과 주제를 담아 간결하게 작성해주세요.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 400,
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || '줄거리 정보를 불러올 수 없습니다.'
  } catch {
    return '줄거리 정보를 불러올 수 없습니다.'
  }
}

function LibraryBookCard({ book, cover, onClick, onRemove }) {
  return (
    <div
      className="card"
      style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }}
      onClick={onClick}
    >
      <div style={{
        width: 52, height: 72, borderRadius: 8, overflow: 'hidden',
        flexShrink: 0, background: 'var(--beige)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {cover
          ? <img src={cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 22 }}>📖</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--txt)', wordBreak: 'keep-all', marginBottom: 3 }}>
          {book.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--txt2)' }}>{book.author}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(book.id) }}
        style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--txt3)', cursor: 'pointer', padding: '4px 6px', flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  )
}

function BookDetailModal({ book, cover, apiKey, onClose }) {
  const [synopsis, setSynopsis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setSynopsis(null)
    fetchSynopsis(apiKey, book.title, book.author).then((text) => {
      setSynopsis(text)
      setLoading(false)
    })
  }, [book.id])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 40 }}>
        <div className="sheet-handle" />

        {/* X 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'var(--beige)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--txt2)', fontWeight: 700,
          }}
        >
          ✕
        </button>

        {/* 책 표지 + 기본 정보 */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{
            width: 90, height: 126, borderRadius: 10, overflow: 'hidden',
            flexShrink: 0, background: 'var(--beige)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '3px 4px 14px rgba(0,0,0,.15)',
          }}>
            {cover
              ? <img src={cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 36 }}>📖</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--green-dark)', wordBreak: 'keep-all', lineHeight: 1.4, marginBottom: 6 }}>
              {book.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', fontWeight: 600 }}>{book.author}</div>
          </div>
        </div>

        <div className="divider" />

        {/* 줄거리 */}
        <p className="sec" style={{ margin: '14px 0 10px' }}>줄거리</p>
        {loading ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '12px 0' }}>
            <div className="typing" style={{ padding: 0 }}>
              <span style={{ background: 'var(--green-sage)' }} />
              <span style={{ background: 'var(--green-sage)', animationDelay: '.2s' }} />
              <span style={{ background: 'var(--green-sage)', animationDelay: '.4s' }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--txt2)' }}>AI가 줄거리를 불러오는 중...</span>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--txt)', lineHeight: 1.8, wordBreak: 'keep-all' }}>
            {synopsis}
          </p>
        )}
      </div>
    </div>
  )
}

export default function MyLibraryScreen({ library, onRemove, apiKey }) {
  const [selectedBook, setSelectedBook] = useState(null)
  const coverCache = useRef({})
  const [covers, setCovers] = useState({})

  useEffect(() => {
    library.forEach((book) => {
      if (coverCache.current[book.id] !== undefined) return
      coverCache.current[book.id] = null
      fetchBookCover(book.title, book.author).then((url) => {
        coverCache.current[book.id] = url
        setCovers((prev) => ({ ...prev, [book.id]: url }))
      })
    })
  }, [library])

  return (
    <div className="screen">
      <div className="s-header">
        <h1>MyLibrary</h1>
        <span>{library.length}권</span>
      </div>
      <div className="content">
        {library.length === 0 ? (
          <div className="empty" style={{ paddingTop: 60 }}>
            <div className="empty-icon">📚</div>
            <p>아직 담은 책이 없어요<br />AI 추천에서 마음에 드는 책을<br />추가해보세요!</p>
          </div>
        ) : (
          library.map((book) => (
            <LibraryBookCard
              key={book.id}
              book={book}
              cover={covers[book.id] || null}
              onClick={() => setSelectedBook(book)}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          cover={covers[selectedBook.id] || null}
          apiKey={apiKey}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  )
}
