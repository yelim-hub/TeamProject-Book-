import { useState } from 'react'
import { getMemos, getCombinedText } from './MemoScreen'

const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const toStr = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

export default function CalendarScreen({ records, books, onGoChat }) {
  const today = new Date()
  const [y, setY] = useState(today.getFullYear())
  const [m, setM] = useState(today.getMonth())
  const [sel, setSel] = useState(null)

  const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate())
  const daysIn = new Date(y, m+1, 0).getDate()
  const firstDow = new Date(y, m, 1).getDay()

  // 날짜 → [record, ...] 맵 (모든 책 포함)
  const dateMap = {}
  records.forEach((r) => {
    if (getMemos(r).length > 0 || r.sticker) {
      if (!dateMap[r.date]) dateMap[r.date] = []
      dateMap[r.date].push(r)
    }
  })

  const cells = [...Array(firstDow).fill(null), ...Array.from({length:daysIn},(_,i)=>i+1)]

  const prev = () => { if(m===0){setY(y-1);setM(11)}else setM(m-1); setSel(null) }
  const next = () => { if(m===11){setY(y+1);setM(0)}else setM(m+1); setSel(null) }

  const displayDate = sel || todayStr
  const displayRecs = dateMap[displayDate] || []

  return (
    <div className="screen">
      <div className="s-header"><h1>CHEKKU</h1></div>

      <div className="content">
        <div className="month-nav">
          <button className="mnav-btn" onClick={prev}>‹</button>
          <h2>{y}년 {m+1}월</h2>
          <button className="mnav-btn" onClick={next}>›</button>
        </div>

        <div className="cal-labels">{DAYS.map((d)=><div key={d} className="cal-label">{d}</div>)}</div>

        <div className="cal-grid">
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="cal-cell empty" />
            const ds = toStr(y, m, day)
            const recs = dateMap[ds] || []
            const dow = (firstDow + day - 1) % 7
            // 스티커 있는 첫 번째 레코드 우선
            const stickerRec = recs.find((r) => r.sticker)
            const hasMemo = recs.some((r) => getMemos(r).length > 0)

            return (
              <div key={ds}
                className={`cal-cell ${ds===todayStr?'today':''} ${ds===sel?'selected':''}`}
                onClick={() => setSel(ds===sel?null:ds)}
              >
                <span className={`cal-num ${dow===0?'sun':dow===6?'sat':''}`}>{day}</span>
                {/* 책 읽은 날: 스티커 이모지 또는 점 */}
                {stickerRec
                  ? <span className="cal-sk">{stickerRec.sticker.emoji}</span>
                  : hasMemo
                    ? <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green-sage)', marginTop:3, display:'block' }}/>
                    : null
                }
              </div>
            )
          })}
        </div>

        {/* 선택 날짜 기록 */}
        <div className="sec">
          {sel ? `📖 ${sel.slice(5).replace('-','월 ')}일 기록` : '📖 오늘의 기록'}
          {displayRecs.length > 1 && (
            <span style={{ fontSize:12, color:'var(--green-sage)', marginLeft:6 }}>({displayRecs.length}권)</span>
          )}
        </div>

        {displayRecs.length > 0 ? (
          displayRecs.map((rec) => {
            const memos = getMemos(rec)
            return (
              <div key={rec.id} style={{ marginBottom:16 }}>
                {/* 책 제목 헤더 */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <div className="book-badge" style={{ fontSize:12, padding:'4px 10px' }}>📖 {rec.bookTitle}</div>
                  {rec.bookAuthor && <span style={{ fontSize:12, color:'var(--txt2)' }}>{rec.bookAuthor}</span>}
                </div>

                {/* 스티커 카드 */}
                {rec.sticker && (
                  <div className="card" style={{ cursor:'pointer', marginBottom:8 }}
                    onClick={() => onGoChat({ ...rec, _combinedText: getCombinedText(rec) })}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ fontSize:44, filter:'drop-shadow(2px 4px 8px rgba(0,0,0,.1))' }}>{rec.sticker.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:15, color:'var(--green-dark)', marginBottom:4 }}>{rec.sticker.title}</div>
                        <div style={{ fontSize:13, color:'var(--txt2)', lineHeight:1.5, wordBreak:'keep-all' }}>{rec.sticker.summary}</div>
                        <div style={{ fontSize:11, color:'var(--txt3)', marginTop:5 }}>대화 보기 →</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 모든 메모 내용 표시 */}
                {memos.length > 0 && (
                  <>
                    {memos.map((memo, i) => (
                      <div key={memo.id} className="memo-note" style={{ cursor:'default' }}>
                        <div className="note-date">
                          {displayDate}{memos.length > 1 ? ` · 메모 ${i+1}` : ''}
                        </div>
                        {memo.pages && <div className="note-pages">{rec.bookTitle} {memo.pages}</div>}
                        <div className="note-text">{memo.text}</div>
                      </div>
                    ))}
                  </>
                )}

              </div>
            )
          })
        ) : (
          <div className="card-beige" style={{ textAlign:'center', padding:'24px 20px' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
            <p style={{ fontSize:13, color:'var(--txt2)' }}>이 날은 독서 기록이 없어요</p>
          </div>
        )}

        {/* 통계 */}
        {records.length > 0 && (
          <div className="card-beige" style={{ marginTop:8 }}>
            <div className="stats">
              <div>
                <div className="stats-num">{records.filter((r)=>r.sticker).length}</div>
                <div className="stats-label">완성 기록</div>
              </div>
              <div>
                <div className="stats-num">{records.filter((r)=>getMemos(r).length>0).length}</div>
                <div className="stats-label">총 메모일</div>
              </div>
              <div>
                <div className="stats-num">{books.length}</div>
                <div className="stats-label">읽는 책</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}