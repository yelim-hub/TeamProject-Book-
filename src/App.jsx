import { useState, useEffect, useRef } from 'react'
import HomeScreen from './screens/HomeScreen'
import MemoScreen from './screens/MemoScreen'
import ChatScreen from './screens/ChatScreen'
import CalendarScreen from './screens/CalendarScreen'
import BookRecommendScreen from './screens/BookRecommendScreen'
import MyLibraryScreen from './screens/MyLibraryScreen'
import MyPageScreen from './screens/MyPageScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import BottomNav from './components/BottomNav'
import { testApiKey } from './services/groq'
import { getMemos } from './screens/MemoScreen'
import { shouldSendNotification, sendEmailNotification, getGenreBook } from './services/notification'

const ENV_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const SAMPLE_BOOKS = [
  { id:'sb1', title:'명상록',    author:'마르쿠스 아우렐리우스' },
  { id:'sb2', title:'사피엔스',  author:'유발 하라리' },
  { id:'sb3', title:'이솝우화',  author:'이솝' },
  { id:'sb4', title:'어린 왕자', author:'생텍쥐페리' },
  { id:'sb5', title:'죄와 벌',   author:'도스토예프스키' },
]

function useLS(key, init) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init }
    catch { return init }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(v)) }, [key, v])
  return [v, setV]
}

export default function App() {
  const [splash, setSplash]         = useState(true)
  const [tab, setTab]               = useState('home')
  const [showMyPage, setShowMyPage]   = useState(false)
  const [showLogin, setShowLogin]     = useState(false)
  const [showSignup, setShowSignup]   = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    try { const u = localStorage.getItem('chekku_current_user'); return u ? JSON.parse(u) : null } catch { return null }
  })
  const [chatRec, setChatRec]       = useState(null)
  const [chatBook, setChatBook]     = useState(null)
  const [showBook, setShowBook]     = useState(false)
  const [showApi, setShowApi]       = useState(false)
  const [keyInput, setKeyInput]     = useState('')
  const [testing, setTesting]       = useState(false)
  const [testMsg, setTestMsg]       = useState(null)
  const [bookTitle, setBookTitle]   = useState('')
  const [bookAuth, setBookAuth]     = useState('')

  const [storedKey, setStoredKey]       = useLS('chekku_key', '')
  const [books, setBooks]               = useLS('chekku_books', [])
  const [activeBookId, setActiveBookId] = useLS('chekku_active_book', null)
  const [records, setRecords]           = useLS('chekku_records', [])
  const [library, setLibrary]           = useLS('chekku_library', [])
  const [theme, setTheme]               = useLS('chekku_theme', 'light')
  const [language, setLanguage]         = useLS('chekku_language', 'ko')
  const [notifEnabled, setNotifEnabled] = useLS('chekku_notif_enabled', false)

  const notifChecked = useRef(false)

  const apiKey     = (ENV_KEY && ENV_KEY !== '여기에_API_키_붙여넣기') ? ENV_KEY : storedKey
  const activeBook = books.find((b) => b.id === activeBookId) || books[0] || null

  // 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // 알림 체크 (앱 첫 로드 시 1회)
  useEffect(() => {
    if (splash || notifChecked.current || !currentUser || !notifEnabled) return
    notifChecked.current = true
    const lastSent = localStorage.getItem('chekku_notif_last_sent')
    if (shouldSendNotification(records, notifEnabled, lastSent)) {
      const book = getGenreBook(currentUser.genres)
      sendEmailNotification(currentUser, book).then((sent) => {
        if (sent) localStorage.setItem('chekku_notif_last_sent', new Date().toISOString())
      })
    }
  }, [splash])

  useEffect(() => {
    const t = setTimeout(() => {
      setSplash(false)
      if (!apiKey) setShowApi(true)
    }, 1600)
    return () => clearTimeout(t)
  }, [])

  /* ── API 키 ── */
  const handleTestAndSave = async () => {
    const k = keyInput.trim()
    if (!k) return
    setTesting(true); setTestMsg(null)
    const result = await testApiKey(k)
    setTesting(false)
    if (result.ok) {
      setStoredKey(k); setKeyInput('')
      setTestMsg({ ok: true, msg: '연결 성공! 🎉' })
      setTimeout(() => { setShowApi(false); setTestMsg(null); if (books.length === 0) setShowBook(true) }, 900)
    } else {
      setTestMsg({ ok: false, msg: result.msg })
    }
  }

  /* ── 책 추가 ── */
  const handleAddBook = () => {
    const t = bookTitle.trim(), a = bookAuth.trim()
    if (!t || !a) return
    // 이미 같은 제목 있으면 그냥 활성화
    const dup = books.find((b) => b.title === t && b.author === a)
    if (dup) { setActiveBookId(dup.id); setBookTitle(''); setBookAuth(''); setShowBook(false); return }
    const nb = { id:`b_${Date.now()}`, title:t, author:a }
    setBooks((p) => [...p, nb])
    setActiveBookId(nb.id)
    setBookTitle(''); setBookAuth(''); setShowBook(false)
  }

  const handleAddSampleBook = (b) => {
    const dup = books.find((x) => x.id === b.id || (x.title === b.title && x.author === b.author))
    if (dup) { setActiveBookId(dup.id); setShowBook(false); return }
    setBooks((p) => [...p, b])
    setActiveBookId(b.id)
    setShowBook(false)
  }

  const handleRemoveBook = (id) => {
    setBooks((p) => p.filter((b) => b.id !== id))
    setRecords((p) => p.filter((r) => r.bookId !== id))   // 해당 책 메모·기록 전부 삭제
    if (activeBookId === id) setActiveBookId(books.find((b) => b.id !== id)?.id || null)
  }

  /* ── 메모 저장 ── */
  const handleSaveMemo = ({ memoText, pages, date, bookId, type, photos }) => {
    const targetBook = books.find((b) => b.id === bookId) || activeBook
    if (!targetBook) return
    const newMemo = { id:`m_${Date.now()}`, pages: pages||'', text: memoText, type: type||'text', photos: photos||[] }
    const ex = records.find((r) => r.date === date && r.bookId === targetBook.id)
    if (ex) {
      setRecords((p) => p.map((r) =>
        r.id === ex.id
          ? { ...r, memos:[...getMemos(r), newMemo] }
          : r
      ))
    } else {
      setRecords((p) => [{
        id:`r_${Date.now()}`, date,
        bookId: targetBook.id, bookTitle: targetBook.title, bookAuthor: targetBook.author,
        memos:[newMemo], chatHistory:[], sticker:null
      }, ...p])
    }
  }

  /* ── 메모 수정 ── */
  const handleEditMemo = (recordId, memoId, updates) => {
    setRecords((p) => p.map((r) => {
      if (r.id !== recordId) return r
      const newMemos = getMemos(r).map((m) => m.id === memoId ? { ...m, ...updates } : m)
      return { ...r, memos: newMemos }
    }))
  }

  /* ── 메모 삭제 ── */
  const handleDeleteMemo = (recordId, memoId) => {
    setRecords((p) => p.map((r) => {
      if (r.id !== recordId) return r
      const newMemos = getMemos(r).filter((m) => m.id !== memoId)
      return { ...r, memos: newMemos, memoText: null }
    }))
  }

  /* ── 레코드 저장 (채팅 완료) ── */
  const handleSaveRecord = (updated) => {
    setRecords((p) => p.map((r) => r.id===updated.id ? updated : r))
    setChatRec(updated)
  }

  /* ── 채팅으로 이동 ── */
  const goChat = (rec) => {
    const book = books.find((b) => b.id === rec.bookId)
      || { id: rec.bookId, title: rec.bookTitle, author: rec.bookAuthor || '' }
    setChatRec(rec)
    setChatBook(book)
    setTab('chat')
  }

  const changeTab = (t) => { if(t==='chat') return; setChatRec(null); setTab(t) }

  /* ── Splash ── */
  if (splash) return (
    <div className="splash">
      <div className="splash-logo">📋</div>
      <div className="splash-title">책꾸</div>
      <div className="splash-sub">AI 페르소나와 함께하는<br/>나만의 사고 가꾸기</div>
    </div>
  )

  return (
    <>
      {/* ── API 키 모달 ── */}
      {showApi && (
        <div className="overlay" onClick={() => apiKey && setShowApi(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">🔑 Groq API 키 설정</div>
            <div className="setup-key-box" style={{ marginBottom:14 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'var(--green-dark)', marginBottom:6 }}>Groq API 키란?</p>
              <p style={{ fontSize:12, color:'var(--txt2)', marginTop:4, lineHeight:1.6 }}>무료로 발급 가능한 AI API 키예요.<br/>Llama 70B 모델을 사용해 고품질 대화가 가능합니다.</p>
            </div>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--green-dark)', marginBottom:8 }}>API 키 입력</p>
            <p style={{ fontSize:12, color:'var(--txt2)', marginBottom:10 }}>발급: <span style={{ color:'var(--green-mid)', fontWeight:700 }}>console.groq.com</span> → API Keys → Create</p>
            <input className="inp" type="password" placeholder="gsk_..." value={keyInput}
              onChange={(e) => { setKeyInput(e.target.value); setTestMsg(null) }}
              onKeyDown={(e) => e.key==='Enter' && handleTestAndSave()}
              style={{ marginBottom:10 }} autoFocus
            />
            {testMsg && <div className={`key-status ${testMsg.ok?'ok':'err'}`} style={{ marginBottom:10 }}>{testMsg.msg}</div>}
            <button className="btn-p" onClick={handleTestAndSave} disabled={!keyInput.trim()||testing}>
              {testing ? '확인 중...' : '테스트 후 저장'}
            </button>
            {apiKey && <button className="btn-s" style={{ marginTop:8 }} onClick={() => setShowApi(false)}>취소</button>}
          </div>
        </div>
      )}

      {/* ── 책 추가 모달 ── */}
      {showBook && (
        <div className="overlay" onClick={() => setShowBook(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">📚 책 추가하기</div>
            {books.length > 0 && (
              <>
                <p className="sec" style={{ margin:'0 0 8px' }}>현재 읽고 있는 책</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                  {books.map((b) => (
                    <div key={b.id} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--green-light)', borderRadius:20, padding:'6px 12px' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--green-dark)' }}>{b.title}</span>
                      <button onClick={() => handleRemoveBook(b.id)}
                        style={{ background:'none', border:'none', fontSize:14, cursor:'pointer', color:'var(--txt3)', lineHeight:1, padding:0 }}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="divider" />
              </>
            )}
            <p className="sec" style={{ margin:'0 0 8px' }}>빠른 선택</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {SAMPLE_BOOKS.filter((s) => !books.find((b) => b.id===s.id || b.title===s.title)).map((b) => (
                <button key={b.id} onClick={() => handleAddSampleBook(b)}
                  style={{ background:'var(--beige)', color:'var(--txt)', border:'none', borderRadius:20, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  {b.title}
                </button>
              ))}
            </div>
            <div className="divider" />
            <p className="sec" style={{ margin:'0 0 10px' }}>직접 입력</p>
            <label className="inp-label">책 제목</label>
            <input className="inp" placeholder="예: 코스모스" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} style={{ marginBottom:10 }} />
            <label className="inp-label">저자</label>
            <input className="inp" placeholder="예: 칼 세이건" value={bookAuth} onChange={(e) => setBookAuth(e.target.value)} style={{ marginBottom:14 }}
              onKeyDown={(e) => e.key==='Enter' && handleAddBook()} />
            <button className="btn-p" onClick={handleAddBook} disabled={!bookTitle.trim()||!bookAuth.trim()}>+ 책 추가</button>
            <button className="btn-s" style={{ marginTop:8 }} onClick={() => setShowBook(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* ── 설정 버튼 ── */}
      {tab !== 'chat' && (
        <button onClick={() => { setKeyInput(storedKey); setShowApi(true) }}
          style={{ position:'absolute', top:16, right:16, zIndex:50, background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--txt3)' }}
          title="API 키 설정">⚙️</button>
      )}

      {/* ── 화면 ── */}
      {tab === 'chat' && chatRec ? (
        <ChatScreen apiKey={apiKey} currentBook={chatBook} record={chatRec}
          onBack={() => { setChatRec(null); setTab('memo') }}
          onSave={handleSaveRecord}
          nickname={currentUser?.nickname}
          language={language}
        />
      ) : showLogin ? (
        <LoginScreen
          onBack={() => setShowLogin(false)}
          onGoSignup={() => { setShowLogin(false); setShowSignup(true) }}
          onLoginSuccess={(user) => setCurrentUser(user)}
        />
      ) : showSignup ? (
        <SignupScreen
          onBack={() => setShowSignup(false)}
          onGoLogin={() => { setShowSignup(false); setShowLogin(true) }}
          onSignupSuccess={(user) => setCurrentUser(user)}
        />
      ) : showMyPage ? (
        <MyPageScreen
          currentUser={currentUser}
          onBack={() => setShowMyPage(false)}
          onLogin={() => setShowLogin(true)}
          onSignup={() => setShowSignup(true)}
          onLogout={() => { localStorage.removeItem('chekku_current_user'); setCurrentUser(null) }}
          theme={theme}           onChangeTheme={setTheme}
          language={language}     onChangeLanguage={setLanguage}
          notifEnabled={notifEnabled} onToggleNotif={setNotifEnabled}
        />
      ) : tab === 'home' ? (
        <HomeScreen
          onGoMemo={() => { setTab('memo'); if(books.length===0) setShowBook(true) }}
          onAddBook={() => setShowBook(true)}
          onOpenMyPage={() => setShowMyPage(true)}
        />
      ) : tab === 'memo' ? (
        <MemoScreen
          books={books} activeBookId={activeBookId}
          onSetActiveBook={setActiveBookId}
          records={records}
          onSaveMemo={handleSaveMemo}
          onEditMemo={handleEditMemo}
          onDeleteMemo={handleDeleteMemo}
          onGoChat={goChat}
          onAddBook={() => setShowBook(true)}
          apiKey={apiKey}
          nickname={currentUser?.nickname}
          language={language}
        />
      ) : tab === 'calendar' ? (
        <CalendarScreen records={records} books={books} onGoChat={goChat} />
      ) : tab === 'library' ? (
        <MyLibraryScreen
          library={library}
          apiKey={apiKey}
          onRemove={(id) => setLibrary((p) => p.filter((b) => b.id !== id))}
        />
      ) : (
        <BookRecommendScreen apiKey={apiKey} nickname={currentUser?.nickname} language={language} onAddBook={(b) => {
          const dup = library.find((x) => x.title === b.title && x.author === b.author)
          if (dup) return
          setLibrary((p) => [...p, { id: `lib_${Date.now()}`, title: b.title, author: b.author }])
        }} />
      )}

      {tab !== 'chat' && <BottomNav active={tab} onChange={changeTab} />}
    </>
  )
}
