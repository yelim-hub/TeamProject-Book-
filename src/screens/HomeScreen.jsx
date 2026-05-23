import { useState, useEffect, useMemo } from 'react'

const BOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

const GENRES = ['판타지', '범죄/스릴러', '기록문', '에세이', '라이트노벨', '교양서', '심리학', '로맨스', '학습서', '팝소설', '인문학', '스릴러']

const TODAY_BOOKS = [
  { title: '피티케이의 이기는 투자 불변의 법칙', author: '피티케이', query: '투자 주식 불변' },
  { title: '사피엔스', author: '유발 하라리', query: '사피엔스 유발 하라리' },
  { title: '아몬드', author: '손원평', query: '아몬드 손원평' },
  { title: '채식주의자', author: '한강', query: '채식주의자 한강' },
  { title: '82년생 김지영', author: '조남주', query: '82년생 김지영' },
  { title: '나미야 잡화점의 기적', author: '히가시노 게이고', query: '나미야 잡화점' },
]

async function fetchBooks(query, max = 6) {
  if (!BOOKS_KEY) return []
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${max}&key=${BOOKS_KEY}&langRestrict=ko`
    )
    const data = await res.json()
    return data.items || []
  } catch {
    return []
  }
}

function getThumb(item) {
  const t = item?.volumeInfo?.imageLinks?.thumbnail
  return t ? t.replace('http:', 'https:') : null
}

function getTodayBook() {
  const idx = new Date().getDate() % TODAY_BOOKS.length
  return TODAY_BOOKS[idx]
}

export default function HomeScreen({ onGoMemo, onAddBook, onOpenMyPage }) {
  const todayMeta = useMemo(getTodayBook, [])
  const [todayItem, setTodayItem] = useState(null)
  const [bestSellers, setBestSellers] = useState([])
  const [selGenre, setSelGenre] = useState(null)
  const [genreBooks, setGenreBooks] = useState([])
  const [genreLoading, setGenreLoading] = useState(false)
  useEffect(() => {
    fetchBooks(todayMeta.query, 1).then(items => { if (items[0]) setTodayItem(items[0]) })
    fetchBooks('베스트셀러 소설 한국 2024', 10).then(setBestSellers)
  }, [])

  const handleGenre = async (g) => {
    if (selGenre === g) { setSelGenre(null); setGenreBooks([]); return }
    setSelGenre(g); setGenreLoading(true)
    const items = await fetchBooks(g + ' 소설 책', 8)
    setGenreBooks(items); setGenreLoading(false)
  }

  const info = todayItem?.volumeInfo
  const thumb = getThumb(todayItem)

  return (
    <div className="screen">

      {/* ── 헤더 ── */}
      <div style={{
        background: 'var(--green-dark)', padding: '50px 20px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ width: 36 }} />
        <span style={{ fontWeight: 900, fontSize: 17, color: 'white', letterSpacing: 2 }}>MAIN PAGE</span>
        <button onClick={onOpenMyPage}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}>👤</button>
      </div>

      {/* ── TODAY'S BOOK ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* 표지 */}
          <div style={{ flexShrink: 0, width: 100 }}>
            {thumb
              ? <img src={thumb} alt={info?.title} style={{ width: 100, height: 145, objectFit: 'cover', borderRadius: 8, boxShadow: '3px 4px 14px rgba(0,0,0,.25)' }} />
              : <div style={{ width: 100, height: 145, borderRadius: 8, background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📖</div>
            }
          </div>
          {/* 정보 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--green-dark)', letterSpacing: 1.5, marginBottom: 6 }}>TODAY'S BOOK</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt)', marginBottom: 6, wordBreak: 'keep-all', lineHeight: 1.4 }}>
              {info?.title || todayMeta.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 8 }}>{info?.authors?.[0] || todayMeta.author}</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6, wordBreak: 'keep-all',
              display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {info?.description || '오늘의 추천 도서입니다. 함께 읽어보세요!'}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: '#E8A020' }}>
              {'★'.repeat(Math.round(info?.averageRating || 4))}{'☆'.repeat(5 - Math.round(info?.averageRating || 4))}
              <span style={{ fontSize: 12, color: 'var(--txt2)', fontWeight: 700, marginLeft: 4 }}>{info?.averageRating || '4.2'}</span>
            </div>
          </div>
        </div>

        {/* USER'S REVIEW */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--green-dark)', letterSpacing: 1.5, marginBottom: 6 }}>USER'S REVIEW</div>
          <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
            {info?.description
              ? info.description.slice(0, 130) + '...'
              : '아직 리뷰가 없어요. 책을 읽고 첫 번째 리뷰를 남겨보세요!'}
          </div>
        </div>

        <div className="divider" style={{ margin: '16px 0' }} />
      </div>

      {/* ── BEST SELLER ── */}
      <div style={{ padding: '0 20px 10px' }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--txt)', marginBottom: 12 }}>BEST SELLER</div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {bestSellers.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 72, height: 104, borderRadius: 8, background: 'var(--beige)' }} />
            ))
          : bestSellers.map((item, i) => (
              <div key={i} style={{ flexShrink: 0 }}>
                {getThumb(item)
                  ? <img src={getThumb(item)} alt={item.volumeInfo?.title}
                      style={{ width: 72, height: 104, objectFit: 'cover', borderRadius: 8, boxShadow: '1px 2px 8px rgba(0,0,0,.15)', display: 'block' }} />
                  : <div style={{ width: 72, height: 104, borderRadius: 8, background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📖</div>
                }
              </div>
            ))
        }
      </div>

      {/* ── 장르별 ── */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--txt)', marginBottom: 12 }}>장르별</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GENRES.map((g) => (
            <button key={g} onClick={() => handleGenre(g)}
              style={{
                background: selGenre === g ? 'var(--green-dark)' : 'var(--green-light)',
                color: selGenre === g ? 'white' : 'var(--green-dark)',
                border: 'none', borderRadius: 20, padding: '9px 18px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .15s',
              }}>
              {g}
            </button>
          ))}
        </div>

        {/* 장르 검색 결과 */}
        {selGenre && (
          <div style={{ marginTop: 16 }}>
            {genreLoading
              ? <div style={{ textAlign: 'center', padding: '20px', color: 'var(--txt2)', fontSize: 13 }}>불러오는 중...</div>
              : (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {genreBooks.map((item, i) => (
                    <div key={i} style={{ flexShrink: 0 }}>
                      {getThumb(item)
                        ? <img src={getThumb(item)} style={{ width: 80, height: 114, objectFit: 'cover', borderRadius: 8, boxShadow: '1px 2px 8px rgba(0,0,0,.15)', display: 'block' }} />
                        : <div style={{ width: 80, height: 114, borderRadius: 8, background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📖</div>
                      }
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt)', marginTop: 4, width: 80, wordBreak: 'keep-all', lineHeight: 1.3,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.volumeInfo?.title}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      </div>

    </div>
  )
}
