import { useState } from 'react'

const GENRES = ['판타지', '범죄/스릴러', '기록문', '에세이', '라이트노벨', '교양서', '심리학', '로맨스', '학습서', '웹소설', '인문학', '스릴러']

const INPUT_STYLE = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 12,
  padding: '14px 44px 14px 16px', fontSize: 15, fontFamily: 'inherit',
  background: 'white', color: 'var(--txt)', outline: 'none', boxSizing: 'border-box',
}

const STEP_CIRCLE = (active) => ({
  width: 32, height: 32, borderRadius: '50%',
  background: active ? '#C4956A' : 'var(--beige)',
  color: active ? 'white' : 'var(--txt3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 900, fontSize: 14,
})

export default function SignupScreen({ onBack, onGoLogin, onSignupSuccess }) {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPwC, setShowPwC] = useState(false)
  const [genres, setGenres] = useState([])
  const [errors, setErrors] = useState({})

  const toggleGenre = (g) => setGenres(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g])

  const validate = () => {
    const e = {}
    if (nickname.trim().length < 2 || nickname.trim().length > 10) e.nickname = '닉네임은 2~10자로 입력해주세요.'
    if (!email.includes('@')) e.email = '올바른 이메일을 입력해주세요.'
    if (!/(?=.*[a-zA-Z])(?=.*\d).{8,}/.test(pw)) e.pw = '영문+숫자 8자 이상으로 입력해주세요.'
    if (pw !== pwConfirm) e.pwConfirm = '비밀번호가 일치하지 않습니다.'
    return e
  }

  const handleSignup = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    const saved = localStorage.getItem('chekku_users')
    const users = saved ? JSON.parse(saved) : []
    if (users.find(u => u.email === email.trim())) { setErrors({ email: '이미 사용 중인 이메일입니다.' }); return }
    const user = { nickname: nickname.trim(), email: email.trim(), password: pw, genres }
    localStorage.setItem('chekku_users', JSON.stringify([...users, user]))
    localStorage.setItem('chekku_current_user', JSON.stringify(user))
    onSignupSuccess?.(user)
    onBack()
  }

  return (
    <div className="screen" style={{ background: 'var(--bg)' }}>
      {/* 헤더 */}
      <div style={{ padding: '50px 20px 16px', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--txt)', position: 'absolute', left: 20 }}>←</button>
        <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--txt)', width: '100%', textAlign: 'center' }}>회원가입</span>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        {/* 스텝 인디케이터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, padding: '0 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={STEP_CIRCLE(true)}>1</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C4956A' }}>기본 정보</span>
          </div>
          <div style={{ flex: 1, height: 2, background: 'var(--border)', margin: '0 8px', marginBottom: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={STEP_CIRCLE(genres.length > 0)}>2</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: genres.length > 0 ? '#C4956A' : 'var(--txt3)' }}>관심 장르</span>
          </div>
        </div>

        {/* 기본 정보 카드 */}
        <div className="card" style={{ padding: '22px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📝</div>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--txt)' }}>기본 정보를 입력해주세요</span>
          </div>

          {[
            { label: '닉네임', val: nickname, set: setNickname, placeholder: '2~10자 닉네임', type: 'text', err: errors.nickname, key: 'nickname' },
            { label: '이메일', val: email, set: setEmail, placeholder: 'example@email.com', type: 'email', err: errors.email, key: 'email' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#C4956A', marginBottom: 6, display: 'block' }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...INPUT_STYLE, borderColor: f.err ? 'var(--red)' : 'var(--border)' }}
                  type={f.type} placeholder={f.placeholder} value={f.val}
                  onChange={e => { f.set(e.target.value); setErrors(p => ({ ...p, [f.key]: '' })) }} />
                {f.val && <button onClick={() => f.set('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--txt3)' }}>✕</button>}
              </div>
              {f.err && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{f.err}</p>}
            </div>
          ))}

          {/* 비밀번호 */}
          {[
            { label: '비밀번호', val: pw, set: setPw, show: showPw, setShow: setShowPw, placeholder: '영문+숫자 8자 이상', err: errors.pw, key: 'pw' },
            { label: '비밀번호 확인', val: pwConfirm, set: setPwConfirm, show: showPwC, setShow: setShowPwC, placeholder: '비밀번호를 한 번 더 입력', err: errors.pwConfirm, key: 'pwConfirm' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#C4956A', marginBottom: 6, display: 'block' }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...INPUT_STYLE, borderColor: f.err ? 'var(--red)' : 'var(--border)' }}
                  type={f.show ? 'text' : 'password'} placeholder={f.placeholder} value={f.val}
                  onChange={e => { f.set(e.target.value); setErrors(p => ({ ...p, [f.key]: '' })) }} />
                <button onClick={() => f.setShow(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'var(--txt3)' }}>
                  {f.show ? '🙈' : '👁️'}
                </button>
              </div>
              {f.err && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{f.err}</p>}
            </div>
          ))}
        </div>

        {/* 관심 장르 카드 */}
        <div className="card" style={{ padding: '22px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--txt)' }}>관심 있는 책 장르</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6, marginBottom: 14 }}>
            좋아하는 장르를 선택해주세요.<br />선택한 장르를 기반으로 책을 추천해드립니다.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {GENRES.map(g => (
              <button key={g} onClick={() => toggleGenre(g)}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontFamily: 'inherit',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: genres.includes(g) ? '#C4956A' : 'white',
                  color: genres.includes(g) ? 'white' : 'var(--txt)',
                  border: `1.5px solid ${genres.includes(g) ? '#C4956A' : 'var(--border)'}`,
                  transition: 'all .15s',
                }}>
                {g}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--txt2)', fontWeight: 700 }}>{genres.length}개 선택됨</div>
        </div>

        {/* 가입하기 버튼 */}
        <button onClick={handleSignup}
          style={{ width: '100%', padding: '15px', border: '1.5px solid var(--border)', borderRadius: 14, background: 'white', fontSize: 16, fontWeight: 800, color: 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
          가입하기
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--txt2)' }}>
          이미 계정이 있으신가요?{' '}
          <button onClick={onGoLogin} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 800, color: '#C4956A', cursor: 'pointer' }}>로그인 하기</button>
        </div>
      </div>
    </div>
  )
}
