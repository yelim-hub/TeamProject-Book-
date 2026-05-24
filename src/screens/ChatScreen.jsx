import { useState, useEffect, useRef } from 'react'
import { createAuthorChat, generateSticker } from '../services/groq'
import { getMemos, getCombinedText } from './MemoScreen'

export default function ChatScreen({ apiKey, currentBook, record, onBack, onSave, nickname, language = 'ko' }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  useEffect(() => {
    if (!record) return
    if (record.chatHistory?.length > 0) { setMsgs(record.chatHistory); return }
    start()
  }, [record?.id])

  const start = async () => {
    const memoText = record?._combinedText || getCombinedText(record) || record?.memoText || ''
    if (!apiKey || !currentBook || !memoText) {
      setError(!apiKey ? 'API 키가 없습니다. ⚙️ 버튼으로 키를 설정해주세요.' : '메모를 먼저 작성해주세요.')
      return
    }
    setLoading(true); setError(null)
    try {
      const s = createAuthorChat(apiKey, currentBook.title, currentBook.author, memoText, nickname, language)
      setSession(s)
      const reply = await s.sendMessage('메모를 읽었으니, 짧고 쉬운 질문 하나로 대화를 시작해주세요.')
      setMsgs([{ role: 'model', content: reply }])
    } catch (e) {
      setError(fmtErr(e))
    } finally {
      setLoading(false)
    }
  }

  const send = async () => {
    if (!input.trim() || loading || !session) return
    const userMsg = { role: 'user', content: input.trim() }
    setMsgs((p) => [...p, userMsg]); setInput(''); setLoading(true); setError(null)
    try {
      const reply = await session.sendMessage(userMsg.content)
      setMsgs((p) => [...p, { role: 'model', content: reply }])
    } catch (e) {
      setError(fmtErr(e))
    } finally {
      setLoading(false)
    }
  }

  const endChat = async () => {
    if (msgs.length < 2) return
    setGenerating(true)
    try {
      const sticker = await generateSticker(apiKey, currentBook.title, msgs)
      onSave({ ...record, chatHistory: msgs, sticker })
    } catch {
      onSave({ ...record, chatHistory: msgs, sticker: { emoji: '📚', title: '독서의 기록', summary: '오늘의 독서를 기록했습니다' } })
    } finally {
      setGenerating(false)
    }
  }

  const fmtErr = (e) => {
    const m = e?.message || ''
    if (m === 'QUOTA_EXCEEDED') return '할당량 초과. 잠시 후 다시 시도하세요.'
    if (m === 'INVALID_KEY') return 'API 키가 올바르지 않습니다. ⚙️ 버튼으로 다시 설정해주세요.'
    return `오류: ${m.slice(0, 80)}`
  }

  const readOnly = !!record?.sticker
  const canEnd = msgs.length >= 2 && !readOnly

  return (
    <div className="chat-wrap">
      {generating && (
        <div className="gen-overlay">
          <div className="gen-icon">✨</div>
          <p>AI가 스티커를 생성하고 있어요...</p>
        </div>
      )}

      <div className="chat-header">
        <div className="chat-header-top">
          <button className="back-btn" onClick={onBack}>←</button>
          <h1>Chat KKU</h1>
        </div>
        <div className="chat-sub">{currentBook?.author} AI</div>
      </div>

      <div className="chat-msgs">
        {msgs.length === 0 && !loading && (
          <div className="empty">
            <div className="empty-icon">💭</div>
            <p>{error || 'AI가 메모를 읽고 있어요...'}</p>
            {error && <button className="btn-s" style={{ marginTop: 12, width: 'auto', padding: '10px 20px' }} onClick={start}>다시 시도</button>}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`msg-row ${m.role === 'user' ? 'me' : ''}`}>
            {m.role === 'model' && <div className="msg-avatar">🗿</div>}
            <div className={`bubble ${m.role === 'model' ? 'ai' : 'me'}`}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="msg-row">
            <div className="msg-avatar">🗿</div>
            <div className="bubble ai"><div className="typing"><span /><span /><span /></div></div>
          </div>
        )}

        {error && msgs.length > 0 && (
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <p style={{ fontSize: 12, color: 'var(--red)' }}>{error}</p>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {readOnly && record?.sticker && (
        <div style={{ padding: '12px 16px', background: 'var(--beige)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 36 }}>{record.sticker.emoji}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--green-dark)' }}>{record.sticker.title}</div>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>{record.sticker.summary}</div>
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="chat-bottom">
          {canEnd && <button className="end-btn" onClick={endChat}>✨ AI와 토론 종료하기</button>}
          <div className="chat-input-row">
            <textarea className="chat-input" placeholder="chat ..." value={input}
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
      )}
    </div>
  )
}
