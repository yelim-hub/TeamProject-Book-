import { useState, useMemo, useRef, useEffect } from 'react'
import { transcribeAudio, analyzeBookPhoto } from '../services/groq'

const DAY = ['일','월','화','수','목','금','토']
const toStr = (d) => d.toISOString().split('T')[0]

export function getMemos(record) {
  if (!record) return []
  if (record.memos?.length > 0) return record.memos
  if (record.memoText) return [{ id:'legacy', pages: record.pages||'', text: record.memoText }]
  return []
}

export function getCombinedText(record) {
  const memos = getMemos(record)
  if (memos.length === 0) return ''
  if (memos.length === 1) return memos[0].text
  return memos.map((m, i) => `메모 ${i+1}${m.pages ? ` (${m.pages})` : ''}: ${m.text}`).join('\n\n')
}

function getDays() {
  const today = new Date()
  return Array.from({ length: 57 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 28 + i)
    return d
  })
}

function VoiceRecordModal({ apiKey, nickname, language, onSave, onClose }) {
  const [state, setState] = useState('idle') // idle | requesting | recording | processing | done | error
  const [transcript, setTranscript] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async () => {
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const mimeType = mr.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setState('processing')
        try {
          const text = await transcribeAudio(apiKey, blob, language)
          if (!text) throw new Error('변환된 텍스트가 없습니다.')
          setTranscript(text)
          setState('done')
        } catch (e) {
          setErrMsg(e.message === 'QUOTA_EXCEEDED' ? '할당량 초과. 잠시 후 다시 시도하세요.'
            : e.message === 'INVALID_KEY' ? 'API 키가 올바르지 않습니다.'
            : e.message || '변환 중 오류가 발생했습니다.')
          setState('error')
        }
      }
      mediaRef.current = mr
      mr.start()
      setState('recording')
    } catch (e) {
      setErrMsg(
        e.name === 'NotAllowedError' ? '마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.'
        : e.name === 'NotFoundError' ? '마이크를 찾을 수 없습니다.'
        : e.message || '마이크 접근에 실패했습니다.'
      )
      setState('error')
    }
  }

  const stopRecording = () => { mediaRef.current?.stop() }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">🎤 음성 메모</div>

        {state === 'idle' && (
          <>
            <p style={{ fontSize:13, color:'var(--txt2)', marginBottom:20, lineHeight:1.6, wordBreak:'keep-all' }}>
              마이크로 음성을 녹음하면 AI가 텍스트로 변환해 메모에 저장합니다.
            </p>
            {!apiKey && (
              <p style={{ fontSize:13, color:'var(--red)', textAlign:'center', marginBottom:14 }}>
                API 키를 먼저 설정해주세요.
              </p>
            )}
            <button className="btn-p" onClick={startRecording} disabled={!apiKey}>🎙 녹음 시작</button>
          </>
        )}

        {state === 'requesting' && (
          <div className="empty" style={{ padding:'24px 0' }}>
            <p style={{ fontSize:14 }}>마이크 권한을 요청 중...</p>
          </div>
        )}

        {state === 'recording' && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, padding:'32px 0' }}>
              <span className="recording-pulse" />
              <span style={{ fontSize:15, fontWeight:700, color:'var(--txt)' }}>녹음 중...</span>
            </div>
            <button className="btn-p" style={{ background:'var(--red)' }} onClick={stopRecording}>
              ⏹ 녹음 중지
            </button>
          </>
        )}

        {state === 'processing' && (
          <div className="empty" style={{ padding:'24px 0' }}>
            <div className="empty-icon">✨</div>
            <p>AI가 음성을 텍스트로 변환하는 중...</p>
          </div>
        )}

        {state === 'done' && (
          <>
            <p style={{ fontSize:12, color:'var(--txt2)', marginBottom:8 }}>변환된 텍스트</p>
            <div className="memo-note" style={{ cursor:'default', marginBottom:14 }}>
              <div className="note-text">{transcript}</div>
            </div>
            <button className="btn-p" onClick={() => onSave(transcript)}>이 내용으로 메모 저장</button>
            <button className="btn-s" style={{ marginTop:8 }} onClick={() => { setState('idle'); setTranscript('') }}>
              다시 녹음
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>⚠️</div>
              <p style={{ fontSize:13, color:'var(--red)', fontWeight:700, wordBreak:'keep-all', lineHeight:1.6 }}>
                {errMsg}
              </p>
            </div>
            <button className="btn-p" onClick={() => setState('idle')}>다시 시도</button>
          </>
        )}

        <button className="btn-s" style={{ marginTop:8 }} onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}

function PhotoCaptureModal({ apiKey, nickname, language, onSave, onClose }) {
  const [photos, setPhotos] = useState([])
  const [state, setState] = useState('idle') // idle | analyzing | valid | invalid | error
  const [extractedText, setExtractedText] = useState('')
  const fileRef = useRef(null)

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const remaining = 5 - photos.length
    Promise.all(
      files.slice(0, remaining).map(
        (file) => new Promise((res) => {
          const reader = new FileReader()
          reader.onload = (ev) => res(ev.target.result)
          reader.readAsDataURL(file)
        })
      )
    ).then((newPhotos) => setPhotos((prev) => [...prev, ...newPhotos]))
    e.target.value = ''
  }

  const removePhoto = (i) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
    if (state !== 'idle') { setState('idle'); setExtractedText('') }
  }

  const analyze = async () => {
    if (!photos.length || !apiKey) return
    setState('analyzing')
    try {
      const result = await analyzeBookPhoto(apiKey, photos, language)
      if (result.valid) { setExtractedText(result.content); setState('valid') }
      else setState('invalid')
    } catch {
      setState('error')
    }
  }

  const invalidMsg = nickname
    ? `${nickname}님 사진이 불명확하여 진행할 수 없습니다.`
    : '사진이 불명확하여 진행할 수 없습니다.'

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">📷 사진 메모</div>

        {(state === 'idle' || state === 'error') && (
          <>
            {photos.length === 0 && (
              <p style={{ fontSize:13, color:'var(--txt2)', marginBottom:16, lineHeight:1.6, wordBreak:'keep-all' }}>
                책 페이지나 E-Book 화면을 촬영하면 AI가 내용을 분석해 메모에 저장합니다. (최대 5장)
              </p>
            )}

            {photos.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
                {photos.map((src, i) => (
                  <div key={i} style={{ position:'relative', width:78, height:78 }}>
                    <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }} />
                    <button onClick={() => removePhoto(i)} style={{
                      position:'absolute', top:-7, right:-7,
                      background:'var(--red)', color:'white', border:'none',
                      borderRadius:'50%', width:22, height:22, fontSize:11,
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {!apiKey && (
              <p style={{ fontSize:13, color:'var(--red)', textAlign:'center', marginBottom:14 }}>
                API 키를 먼저 설정해주세요.
              </p>
            )}

            {photos.length < 5 && (
              <>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple
                  style={{ display:'none' }} onChange={handleFileChange} />
                <button className="btn-s" onClick={() => fileRef.current?.click()}>
                  📷 사진 추가 ({photos.length}/5)
                </button>
              </>
            )}

            {photos.length > 0 && (
              <>
                {state === 'error' && (
                  <p style={{ fontSize:12, color:'var(--red)', textAlign:'center', marginTop:10 }}>
                    분석 중 오류가 발생했습니다. 다시 시도해주세요.
                  </p>
                )}
                <button className="btn-p" style={{ marginTop:10 }} onClick={analyze} disabled={!apiKey}>
                  AI로 분석하기
                </button>
              </>
            )}
          </>
        )}

        {state === 'analyzing' && (
          <div className="empty" style={{ padding:'24px 0' }}>
            <div className="empty-icon">🔍</div>
            <p>AI가 사진을 분석하는 중...</p>
          </div>
        )}

        {state === 'invalid' && (
          <>
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
              <p style={{ fontSize:14, color:'var(--red)', fontWeight:700, wordBreak:'keep-all', lineHeight:1.6 }}>
                {invalidMsg}
              </p>
            </div>
            <button className="btn-s" onClick={() => { setState('idle'); setPhotos([]) }}>
              사진 다시 선택
            </button>
          </>
        )}

        {state === 'valid' && (
          <>
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
              {photos.map((src, i) => (
                <img key={i} src={src} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} />
              ))}
            </div>
            <p style={{ fontSize:12, color:'var(--txt2)', marginBottom:8 }}>추출된 내용</p>
            <div className="memo-note" style={{ cursor:'default', marginBottom:14 }}>
              <div className="note-text">{extractedText}</div>
            </div>
            <button className="btn-p" onClick={() => onSave(extractedText, photos)}>
              이 내용으로 메모 저장
            </button>
            <button className="btn-s" style={{ marginTop:8 }} onClick={() => { setState('idle'); setPhotos([]) }}>
              다시 촬영
            </button>
          </>
        )}

        <button className="btn-s" style={{ marginTop:8 }} onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}

export default function MemoScreen({ books, activeBookId, onSetActiveBook, records, onSaveMemo, onGoChat, onAddBook, apiKey, nickname, language = 'ko' }) {
  const today = new Date()
  const todayStr = toStr(today)
  const [selDate, setSelDate] = useState(todayStr)
  const [showInput, setShowInput] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [pages, setPages] = useState('')
  const [text, setText] = useState('')

  const days = useMemo(getDays, [])
  const todayRef = useRef(null)
  useEffect(() => { todayRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' }) }, [])
  const minDate = (() => { const d = new Date(today); d.setDate(d.getDate()-7); return toStr(d) })()
  const maxDate = (() => { const d = new Date(today); d.setDate(d.getDate()+7); return toStr(d) })()
  const isEditable = selDate >= minDate && selDate <= maxDate
  const activeBook = books.find((b) => b.id === activeBookId) || books[0] || null
  const selRecord = records.find((r) => r.date === selDate && r.bookId === activeBook?.id)
  const memos = getMemos(selRecord)

  const save = () => {
    if (!text.trim() || !activeBook) return
    onSaveMemo({ memoText: text.trim(), pages: pages.trim(), date: selDate, bookId: activeBook.id, type: 'text' })
    setText(''); setPages(''); setShowInput(false)
  }

  const saveVoice = (transcript) => {
    if (!activeBook) return
    onSaveMemo({ memoText: transcript, pages: '', date: selDate, bookId: activeBook.id, type: 'voice' })
    setShowVoice(false)
  }

  const savePhoto = (content, photos) => {
    if (!activeBook) return
    onSaveMemo({ memoText: content, pages: '', date: selDate, bookId: activeBook.id, type: 'photo', photos })
    setShowPhoto(false)
  }

  return (
    <div className="screen">
      {showVoice && (
        <VoiceRecordModal apiKey={apiKey} nickname={nickname} language={language}
          onSave={saveVoice} onClose={() => setShowVoice(false)} />
      )}
      {showPhoto && (
        <PhotoCaptureModal apiKey={apiKey} nickname={nickname} language={language}
          onSave={savePhoto} onClose={() => setShowPhoto(false)} />
      )}

      <div className="s-header"><h1>MEMO</h1></div>

      {/* ── 책 선택 탭 ── */}
      <div style={{ padding:'10px 20px 0', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:10, scrollbarWidth:'none' }}>
          {books.map((b) => {
            const isActive = b.id === activeBookId || (!activeBookId && books[0]?.id === b.id)
            const hasToday = records.some((r) => r.bookId === b.id && r.date === selDate && getMemos(r).length > 0)
            return (
              <button key={b.id}
                onClick={() => { onSetActiveBook(b.id); setShowInput(false) }}
                style={{
                  flexShrink:0, background: isActive ? 'var(--green-dark)' : 'var(--beige)',
                  color: isActive ? 'white' : 'var(--txt)',
                  border:'none', borderRadius:20, padding:'7px 14px',
                  fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
                }}>
                {b.title}
                {hasToday && <span style={{ fontSize:10, opacity:.8 }}>📝</span>}
              </button>
            )
          })}
          <button onClick={onAddBook}
            style={{ flexShrink:0, background:'none', border:'1.5px dashed var(--border)', borderRadius:20, padding:'7px 14px', fontSize:13, fontWeight:700, cursor:'pointer', color:'var(--txt3)', whiteSpace:'nowrap' }}>
            + 책 추가
          </button>
        </div>
      </div>

      {/* ── 날짜 선택 스트립 ── */}
      <div style={{ display:'flex', gap:4, padding:'10px 20px 8px', overflowX:'auto', scrollbarWidth:'none' }}>
        {days.map((d) => {
          const ds = toStr(d)
          const isToday = ds === todayStr
          const hasRec = activeBook && records.some((r) => r.date === ds && r.bookId === activeBook.id && getMemos(r).length > 0)
          const isSel = ds === selDate
          const isFirst = d.getDate() === 1
          return (
            <div key={ds} ref={isToday ? todayRef : null}
              onClick={() => { setSelDate(ds); setShowInput(false) }}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                minWidth:44, padding:'4px 4px 6px', borderRadius:12, cursor:'pointer',
                transition:'background .15s', background: isSel ? 'var(--green-dark)' : 'transparent',
              }}>
              <span style={{ fontSize:9, fontWeight:700, color: isSel ? 'rgba(255,255,255,.7)' : 'var(--green-mid)', height:12, lineHeight:'12px' }}>
                {isFirst ? `${d.getMonth()+1}월` : ''}
              </span>
              <span style={{ fontSize:11, color: isSel ? 'rgba(255,255,255,.8)' : 'var(--txt2)', fontWeight:500 }}>
                {isToday ? '오늘' : DAY[d.getDay()]}
              </span>
              <span style={{ fontSize:15, fontWeight:700, color: isSel ? 'white' : 'var(--txt)', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>
                {d.getDate()}
              </span>
              <span style={{ fontSize:12 }}>{hasRec ? '📝' : ''}</span>
            </div>
          )
        })}
      </div>

      <div className="content">
        {/* 날짜 표시 */}
        <div style={{ fontSize:13, fontWeight:700, color:'var(--green-dark)', marginBottom:12 }}>
          📅 {selDate === todayStr ? '오늘' : selDate}
          {activeBook ? ` · ${activeBook.title}` : ''}
        </div>

        {/* 책 없음 */}
        {books.length === 0 && (
          <div className="card-beige" style={{ textAlign:'center', marginBottom:14 }}>
            <p style={{ fontSize:14, color:'var(--txt2)', marginBottom:12 }}>읽고 있는 책을 먼저 추가해주세요</p>
            <button className="btn-p" onClick={onAddBook}>+ 책 추가하기</button>
          </div>
        )}

        {/* 기존 메모 목록 */}
        {memos.map((m, i) => (
          <div key={m.id} className="memo-note" style={{ cursor:'default' }}>
            <div className="note-date">
              {selDate}{memos.length > 1 ? ` · 메모 ${i+1}` : ''}
              {m.type === 'voice' ? ' 🎤' : m.type === 'photo' ? ' 📷' : ''}
            </div>
            {m.pages && <div className="note-pages">{activeBook?.title} {m.pages}</div>}
            {m.type === 'photo' && m.photos?.length > 0 && (
              <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                {m.photos.map((src, pi) => (
                  <img key={pi} src={src} alt="" style={{ width:56, height:56, objectFit:'cover', borderRadius:6, border:'1px solid var(--border)' }} />
                ))}
              </div>
            )}
            <div className="note-text">{m.text}</div>
          </div>
        ))}

        {/* 스티커 완성 배지 */}
        {selRecord?.sticker && (
          <div className="card" style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', marginBottom:12 }}
            onClick={() => onGoChat({ ...selRecord, _combinedText: getCombinedText(selRecord) })}>
            <span style={{ fontSize:36 }}>{selRecord.sticker.emoji}</span>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--green-dark)' }}>{selRecord.sticker.title}</div>
              <div style={{ fontSize:12, color:'var(--txt2)', marginTop:2 }}>대화 기록 보기 →</div>
            </div>
          </div>
        )}

        {/* 메모 입력 (±7일 범위만 허용) */}
        {activeBook && isEditable && (
          showInput ? (
            <div className="card" style={{ marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--green-dark)', marginBottom:12 }}>
                ✏️ {selDate === todayStr ? '오늘' : selDate} 메모 추가
              </div>
              <label className="inp-label">페이지 (선택)</label>
              <input className="inp" placeholder="예: pp. 117-141" value={pages}
                onChange={(e) => setPages(e.target.value)} style={{ marginBottom:10 }} />
              <label className="inp-label">메모 내용</label>
              <textarea className="inp"
                placeholder="읽으면서 떠오른 생각, 의문, 인상적인 구절을 자유롭게 적어보세요..."
                value={text} onChange={(e) => setText(e.target.value)} autoFocus />
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button className="btn-s" style={{ flex:1 }} onClick={() => { setShowInput(false); setText(''); setPages('') }}>취소</button>
                <button className="btn-p" style={{ flex:2 }} onClick={save} disabled={!text.trim()}>저장</button>
              </div>
            </div>
          ) : (
            <div className="memo-bar">
              <button className="memo-icon" onClick={() => setShowInput(true)} title="텍스트 메모">✏️</button>
              <button className="memo-icon" onClick={() => setShowVoice(true)} title="음성 메모">🎤</button>
              <button className="memo-icon" onClick={() => setShowPhoto(true)} title="사진 메모">📷</button>
            </div>
          )
        )}

        {/* 범위 밖 날짜 안내 */}
        {activeBook && !isEditable && memos.length === 0 && (
          <div className="card-beige" style={{ textAlign:'center', padding:'14px', marginBottom:12 }}>
            <p style={{ fontSize:13, color:'var(--txt2)' }}>이 날짜는 조회만 가능합니다<br/>(오늘 기준 ±7일만 작성 가능)</p>
          </div>
        )}

        {/* AI 대화 버튼 */}
        {memos.length > 0 && !showInput && !selRecord?.sticker && (
          <button className="go-chat-btn"
            onClick={() => onGoChat({ ...selRecord, _combinedText: getCombinedText(selRecord) })}>
            <div className="go-chat-avatar">🗿</div>
            {activeBook?.author} AI와 대화하러 가기
          </button>
        )}

        {/* 빈 상태 */}
        {activeBook && memos.length === 0 && !showInput && (
          <div className="empty" style={{ marginTop:16 }}>
            <div className="empty-icon">📄</div>
            <p>{selDate === todayStr ? '오늘은' : `${selDate}은`} 아직 메모가 없어요<br/>✏️ 를 눌러 메모를 작성해보세요</p>
          </div>
        )}

        {/* 다른 날 메모 미리보기 */}
        {activeBook && (() => {
          const others = records
            .filter((r) => r.bookId === activeBook.id && r.date !== selDate && getMemos(r).length > 0)
            .sort((a,b) => b.date.localeCompare(a.date)).slice(0, 4)
          if (!others.length) return null
          return (
            <>
              <div className="sec">📋 다른 날의 메모</div>
              {others.map((r) => (
                <div key={r.id} className="memo-note" onClick={() => setSelDate(r.date)} style={{ opacity:.82 }}>
                  <div className="note-date">{r.date}{r.sticker ? ` · ${r.sticker.emoji}` : ''}</div>
                  {getMemos(r)[0]?.pages && <div className="note-pages">{r.bookTitle} {getMemos(r)[0].pages}</div>}
                  <div className="note-text" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {getMemos(r)[0]?.text}
                  </div>
                  {getMemos(r).length > 1 && <div style={{ fontSize:12, color:'var(--green-mid)', marginTop:5, fontWeight:700 }}>+{getMemos(r).length-1}개 더</div>}
                </div>
              ))}
            </>
          )
        })()}
      </div>
    </div>
  )
}
