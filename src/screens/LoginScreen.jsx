import { useState } from 'react'

const INPUT_STYLE = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 12,
  padding: '14px 44px 14px 16px', fontSize: 15, fontFamily: 'inherit',
  background: 'white', color: 'var(--txt)', outline: 'none',
  boxSizing: 'border-box',
}

export default function LoginScreen({ onBack, onGoSignup, onLoginSuccess }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (!id.trim() || !pw.trim()) { setError('아이디와 비밀번호를 입력해주세요.'); return }
    const saved = localStorage.getItem('chekku_users')
    const users = saved ? JSON.parse(saved) : []
    const user = users.find(u => u.email === id.trim() && u.password === pw)
    if (!user) { setError('아이디 또는 비밀번호가 올바르지 않습니다.'); return }
    localStorage.setItem('chekku_current_user', JSON.stringify(user))
    onLoginSuccess?.(user)
    onBack()
  }

  return (
    <div className="screen" style={{ background: 'var(--bg)' }}>
      {/* 헤더 */}
      <div style={{ padding: '50px 20px 16px', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--txt)', position: 'absolute', left: 20 }}>←</button>
        <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--txt)', width: '100%', textAlign: 'center' }}>로그인</span>
      </div>

      <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 로고 */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, #C4956A, #A0714A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 14,
          boxShadow: '0 4px 16px rgba(196,149,106,.4)',
        }}>C</div>
        <div style={{ fontWeight: 900, fontSize: 24, color: 'var(--green-dark)', letterSpacing: 3, marginBottom: 6 }}>CHEKKU</div>
        <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 32 }}>나만의 독서 다이어리</div>

        {/* 로그인 카드 */}
        <div className="card" style={{ width: '100%', padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--txt)' }}>계정으로 로그인</span>
          </div>

          {/* 아이디 */}
          <label style={{ fontSize: 13, fontWeight: 700, color: '#C4956A', marginBottom: 6, display: 'block' }}>아이디</label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input style={INPUT_STYLE} placeholder="아이디를 입력해주세요"
              value={id} onChange={e => { setId(e.target.value); setError('') }} />
            {id && <button onClick={() => setId('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--txt3)' }}>✕</button>}
          </div>

          {/* 비밀번호 */}
          <label style={{ fontSize: 13, fontWeight: 700, color: '#C4956A', marginBottom: 6, display: 'block' }}>비밀번호</label>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input style={INPUT_STYLE} placeholder="비밀번호를 입력해주세요"
              type={showPw ? 'text' : 'password'}
              value={pw} onChange={e => { setPw(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--txt3)' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <button style={{ background: 'none', border: 'none', fontSize: 12, color: '#C4956A', cursor: 'pointer', textDecoration: 'underline' }}>비밀번호를 잊으셨나요?</button>
          </div>

          {error && <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12, textAlign: 'center' }}>{error}</div>}

          <button onClick={handleLogin}
            style={{ width: '100%', padding: '14px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'white', fontSize: 16, fontWeight: 800, color: 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit' }}>
            로그인
          </button>
        </div>

        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--txt2)' }}>
          아직 계정이 없으신가요?{' '}
          <button onClick={onGoSignup} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 800, color: '#C4956A', cursor: 'pointer', textDecoration: 'none' }}>회원가입 하기</button>
        </div>
      </div>
    </div>
  )
}
