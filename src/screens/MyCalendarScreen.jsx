import { useState, useEffect } from 'react'
import { getMemos } from './MemoScreen'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_EN = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const toStr = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

async function fetchBookCover(title, author) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(`${title} ${author}`)}&maxResults=1`)
    const data = await res.json()
    const t = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
    return t ? t.replace('http:', 'https:') : null
  } catch { return null }
}

const BADGE = {
  display: 'inline-block', background: '#C4956A', color: 'white',
  borderRadius: 20, padding: '7px 18px', fontWeight: 900, fontSize: 13, letterSpacing: 1,
}

const NAV_BTN = {
  background: 'var(--beige)', border: '1.5px solid var(--border)', borderRadius: 10,
  width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: 'var(--txt)', fontSize: 18, fontFamily: 'inherit',
}

export default function MyCalendarScreen({ records, books, activeBookId, onBack, onGoChat, onOpenMyPage }) {
  const today = new Date()
  const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, setY] = useState(today.getFullYear())
  const [m, setM] = useState(today.getMonth())
  const [cover, setCover] = useState(null)
  const [selSticker, setSelSticker] = useState(null)

  const activeBook = books.find(b => b.id === activeBookId) || books[0] || null

  const todayRec = records.find(r => r.date === todayStr && r.bookId === activeBook?.id)
  const todayMemos = getMemos(todayRec)

  // 이 책의 날짜 → 스티커 맵
  const stickerMap = {}
  records.filter(r => r.bookId === activeBook?.id && r.sticker).forEach(r => {
    stickerMap[r.date] = { emoji: r.sticker.emoji, title: r.sticker.title, rec: r }
  })

  // 이번 달 스티커 컬렉션
  const monthPrefix = `${y}-${String(m+1).padStart(2,'0')}`
  const monthStickers = Object.entries(stickerMap)
    .filter(([date]) => date.startsWith(monthPrefix))
    .map(([, v]) => v)
    .filter((v, i, a) => a.findIndex(x => x.emoji === v.emoji) === i)

  useEffect(() => {
    if (activeBook) fetchBookCover(activeBook.title, activeBook.author).then(setCover)
  }, [activeBook?.id])

  const daysIn = new Date(y, m + 1, 0).getDate()
  const firstDow = new Date(y, m, 1).getDay()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)]

  const prev = () => { if (m === 0) { setY(y - 1); setM(11) } else setM(m - 1) }
  const next = () => { if (m === 11) { setY(y + 1); setM(0) } else setM(m + 1) }

  return (
    <div className="screen">
      {/* ── 헤더 ── */}
      <div style={{
        padding: '50px 20px 16px', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--txt)', padding: '2px 6px' }}>←</button>
        <span style={{ fontWeight: 900, fontSize: 17, color: 'var(--txt)', letterSpacing: 2 }}>MY CALENDAR</span>
        <button onClick={onOpenMyPage}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--beige)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}>👤</button>
      </div>

      <div className="content">

        {/* ── 오늘의 책 카드 ── */}
        {activeBook ? (
          <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
            {/* 표지 */}
            <div style={{
              width: 84, height: 116, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
              background: cover ? 'transparent' : 'linear-gradient(135deg, #6B5B95 0%, #E96F92 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '2px 4px 12px rgba(0,0,0,.18)',
            }}>
              {cover
                ? <img src={cover} alt={activeBook.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'white', wordBreak: 'keep-all', lineHeight: 1.5 }}>{activeBook.title}</div>
                  </div>
              }
            </div>
            {/* 정보 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...BADGE, fontSize: 11, padding: '4px 12px', marginBottom: 8 }}>
                CHEKKU {today.getMonth() + 1}월 {today.getDate()}일
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--txt)', marginBottom: 6, wordBreak: 'keep-all' }}>
                {activeBook.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
                {todayMemos.length > 0
                  ? todayMemos[0].text.slice(0, 90) + (todayMemos[0].text.length > 90 ? '...' : '')
                  : '오늘의 메모가 없어요. 메모를 먼저 작성해보세요!'}
              </div>
            </div>
          </div>
        ) : (
          <div className="card-beige" style={{ textAlign: 'center', padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--txt2)' }}>읽고 있는 책을 먼저 추가해주세요</p>
          </div>
        )}

        {/* ── 캘린더 ── */}
        <div className="card" style={{ marginBottom: 16 }}>
          {/* 캘린더 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={BADGE}>CHEKKU'S {MONTH_EN[m]}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={prev} style={NAV_BTN}>‹</button>
              <button onClick={next} style={NAV_BTN}>›</button>
            </div>
          </div>

          {/* 요일 라벨 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '4px 0',
                color: i === 0 ? 'var(--red)' : i === 6 ? 'var(--blue)' : 'var(--txt2)',
              }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} style={{ minHeight: 48 }} />
              const ds = toStr(y, m, day)
              const isToday = ds === todayStr
              const sticker = stickerMap[ds]
              const dow = (firstDow + day - 1) % 7
              const isSelected = selSticker && sticker?.emoji === selSticker
              return (
                <div key={ds}
                  onClick={() => sticker && setSelSticker(selSticker === sticker.emoji ? null : sticker.emoji)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '4px 2px', borderRadius: 10, minHeight: 48,
                    cursor: sticker ? 'pointer' : 'default',
                    background: isSelected ? 'var(--green-light)' : 'transparent',
                    transition: 'background .15s',
                  }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday ? 'var(--green-dark)' : 'transparent',
                    color: isToday ? 'white' : dow === 0 ? 'var(--red)' : dow === 6 ? 'var(--blue)' : 'var(--txt2)',
                  }}>
                    {day}
                  </span>
                  {sticker && <span style={{ fontSize: 17, marginTop: 2, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.15))' }}>{sticker.emoji}</span>}
                  {isToday && !sticker && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green-dark)', marginTop: 3, display: 'block' }} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 스티커 컬렉션 ── */}
        {monthStickers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {monthStickers.map((s, i) => (
              <div key={i}
                onClick={() => setSelSticker(selSticker === s.emoji ? null : s.emoji)}
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: selSticker === s.emoji ? 'var(--green-light)' : 'var(--card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, boxShadow: '0 2px 8px rgba(0,0,0,.1)',
                  cursor: 'pointer', transition: 'all .15s',
                  border: selSticker === s.emoji ? '2px solid var(--green-dark)' : '2px solid transparent',
                }}>
                {s.emoji}
              </div>
            ))}
          </div>
        )}

        {/* ── TODAY'S MEMO ── */}
        {todayMemos.length > 0 && (
          <>
            <div style={{ ...BADGE, marginBottom: 12 }}>TODAY'S MEMO</div>
            <div className="card">
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--txt)', marginBottom: 10, wordBreak: 'keep-all' }}>
                {activeBook?.title}
                {todayMemos[0].pages ? ` <${todayMemos[0].pages}>` : ''}
              </div>
              {todayMemos.map((memo, i) => (
                <div key={memo.id} style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.8, wordBreak: 'keep-all', marginBottom: i < todayMemos.length - 1 ? 12 : 0 }}>
                  {memo.text}
                </div>
              ))}
            </div>
          </>
        )}

        {todayMemos.length === 0 && activeBook && (
          <div style={{ ...BADGE, marginBottom: 12 }}>TODAY'S MEMO</div>
        )}
        {todayMemos.length === 0 && activeBook && (
          <div className="card-beige" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <p style={{ fontSize: 13, color: 'var(--txt2)' }}>오늘의 메모가 없어요</p>
          </div>
        )}

      </div>
    </div>
  )
}
