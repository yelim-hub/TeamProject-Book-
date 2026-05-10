import { useState, useEffect } from 'react'

async function fetchBookCover(title, author) {
  try {
    const q = encodeURIComponent(`${title} ${author}`)
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`)
    const data = await res.json()
    const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
    return thumb ? thumb.replace('http:', 'https:') : null
  } catch {
    return null
  }
}

function LibraryBookCard({ book, onRemove }) {
  const [cover, setCover] = useState(null)

  useEffect(() => {
    fetchBookCover(book.title, book.author).then(setCover)
  }, [book.title, book.author])

  return (
    <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
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
        onClick={() => onRemove(book.id)}
        style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--txt3)', cursor: 'pointer', padding: '4px 6px', flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  )
}

export default function MyLibraryScreen({ library, onRemove }) {
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
            <LibraryBookCard key={book.id} book={book} onRemove={onRemove} />
          ))
        )}
      </div>
    </div>
  )
}
