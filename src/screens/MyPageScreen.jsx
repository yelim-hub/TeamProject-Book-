import { useState } from 'react'

// ── 언어 옵션 ─────────────────────────────────────────────────────
const LANG_OPTIONS = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
]

// ── 알림 설정 모달 ────────────────────────────────────────────────
function NotifModal({ currentUser, notifEnabled, onToggle, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">🔔 알림 설정</div>

        <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
          <div className="toggle-wrap">
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
                독서 미활동 알림
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5 }}>
                7일간 메모가 없으면 이메일로 알림
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={notifEnabled} onChange={() => onToggle(!notifEnabled)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {notifEnabled && (
          <div className="card-beige" style={{ padding: '14px 16px', marginBottom: 14, borderRadius: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 6 }}>
              알림 수신 이메일
            </div>
            <div style={{ fontSize: 14, color: 'var(--txt)', fontWeight: 600 }}>
              {currentUser?.email || '로그인 후 이용 가능합니다'}
            </div>
          </div>
        )}

        <div className="card-beige" style={{ padding: '14px 16px', marginBottom: 16, borderRadius: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 6 }}>📬 알림 내용 미리보기</div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
            <strong style={{ color: 'var(--txt)' }}>[{currentUser?.nickname || '닉네임'}]</strong>님! 1주일간 독서를 진행하지 않으셨어요!{'\n'}
            혹시 흥미있는 책이 없으셨나요?{' '}
            이번달의 베스트셀러는 어떠실까요?
          </div>
        </div>

        {notifEnabled && !import.meta.env.VITE_EMAILJS_SERVICE_ID && (
          <div style={{ background: '#FFF3CD', borderRadius: 12, padding: '12px 14px', marginBottom: 14, fontSize: 12, color: '#856404', lineHeight: 1.6 }}>
            ⚠️ 실제 이메일 발송을 위해 <strong>.env</strong> 파일에 EmailJS 설정이 필요합니다.
            (<strong>VITE_EMAILJS_SERVICE_ID</strong> 등)
          </div>
        )}

        <button className="btn-p" onClick={onClose}>확인</button>
      </div>
    </div>
  )
}

// ── 테마 모달 ─────────────────────────────────────────────────────
function ThemeModal({ theme, onChangeTheme, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">🎨 테마 & 스타일</div>

        {[
          {
            value: 'light',
            label: '기본 (라이트)',
            desc: '밝고 따뜻한 베이지 톤',
            preview: { bg: '#F5F0E6', card: '#FFFFFF', accent: '#2C5F4A' },
          },
          {
            value: 'dark',
            label: '다크 모드',
            desc: '어두운 환경에 최적화된 다크 톤',
            preview: { bg: '#111111', card: '#1E1E1E', accent: '#5ABF8A' },
          },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => { onChangeTheme(t.value); }}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', marginBottom: 12,
            }}
          >
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: `2.5px solid ${theme === t.value ? 'var(--green-dark)' : 'var(--border)'}`,
              transition: 'border-color .2s',
            }}>
              {/* 미리보기 */}
              <div style={{ background: t.preview.bg, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 54, borderRadius: 8, background: t.preview.card, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 4, background: t.preview.accent, marginBottom: 6, width: '60%' }} />
                  <div style={{ height: 6, borderRadius: 4, background: t.preview.card, marginBottom: 4, width: '80%' }} />
                  <div style={{ height: 6, borderRadius: 4, background: t.preview.card, width: '50%' }} />
                </div>
                {theme === t.value && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 900, flexShrink: 0 }}>✓</div>
                )}
              </div>
              {/* 라벨 */}
              <div style={{ background: 'var(--card)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', textAlign: 'left' }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', textAlign: 'left' }}>{t.desc}</div>
                </div>
              </div>
            </div>
          </button>
        ))}

        <button className="btn-s" style={{ marginTop: 4 }} onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}

// ── 언어 모달 ─────────────────────────────────────────────────────
function LangModal({ language, onChangeLang, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">🌐 언어 설정</div>

        <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 16, lineHeight: 1.6, wordBreak: 'keep-all' }}>
          선택한 언어로 AI가 대화합니다. 앱 UI는 한국어를 유지합니다.
        </div>

        {LANG_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => { onChangeLang(opt.code); onClose() }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: language === opt.code ? 'var(--green-light)' : 'var(--card)',
              border: `2px solid ${language === opt.code ? 'var(--green-dark)' : 'var(--border)'}`,
              borderRadius: 14, padding: '16px 18px', marginBottom: 10,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28 }}>{opt.flag}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2 }}>
                  {opt.code === 'ko' && 'AI가 한국어로만 대화합니다'}
                  {opt.code === 'en' && 'AI responds in English only'}
                  {opt.code === 'ja' && 'AIが日本語のみで会話します'}
                </div>
              </div>
            </div>
            {language === opt.code && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 900 }}>✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 설정 행 컴포넌트 ──────────────────────────────────────────────
function SettingRow({ icon, label, value, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', padding: '16px 18px',
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {value && <span style={{ fontSize: 12, color: 'var(--green-mid)', fontWeight: 700 }}>{value}</span>}
        <span style={{ fontSize: 20, color: 'var(--txt3)' }}>›</span>
      </div>
    </button>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function MyPageScreen({
  currentUser, onBack, onLogin, onSignup, onLogout,
  theme, onChangeTheme,
  language, onChangeLanguage,
  notifEnabled, onToggleNotif,
}) {
  const [showNotif, setShowNotif] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const [showLang,  setShowLang]  = useState(false)

  const langLabel = LANG_OPTIONS.find((o) => o.code === language)?.label || '한국어'
  const themeLabel = theme === 'dark' ? '다크' : '기본'

  return (
    <div className="screen">
      {/* 모달들 */}
      {showNotif && (
        <NotifModal
          currentUser={currentUser}
          notifEnabled={notifEnabled}
          onToggle={onToggleNotif}
          onClose={() => setShowNotif(false)}
        />
      )}
      {showTheme && (
        <ThemeModal
          theme={theme}
          onChangeTheme={onChangeTheme}
          onClose={() => setShowTheme(false)}
        />
      )}
      {showLang && (
        <LangModal
          language={language}
          onChangeLang={onChangeLanguage}
          onClose={() => setShowLang(false)}
        />
      )}

      {/* 헤더 */}
      <div style={{
        padding: '50px 20px 16px', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--txt)', padding: '2px 6px' }}>
          ←
        </button>
        <span style={{ fontWeight: 900, fontSize: 17, color: 'var(--txt)', letterSpacing: 2 }}>MY PAGE</span>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--beige)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
      </div>

      <div className="content">
        {/* 계정 설정 */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#C4956A', marginBottom: 10 }}>계정 설정</div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: currentUser ? 'linear-gradient(135deg, #C4956A, #A0714A)' : 'var(--beige)',
            border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: currentUser ? 28 : 32, fontWeight: 900, color: 'white',
            margin: '0 auto 14px',
          }}>
            {currentUser ? currentUser.nickname[0].toUpperCase() : '👤'}
          </div>

          {currentUser ? (
            <>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--txt)', marginBottom: 4 }}>{currentUser.nickname}</div>
              <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 20 }}>{currentUser.email}</div>
              <button onClick={onLogout}
                style={{ padding: '12px 32px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--card)', fontSize: 14, fontWeight: 700, color: 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit' }}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--txt)', marginBottom: 6 }}>게스트</div>
              <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 20 }}>
                로그인하고 독서 기록을 저장해보세요
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onLogin}
                  style={{ flex: 1, padding: '13px 0', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--card)', fontSize: 15, fontWeight: 700, color: 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  로그인
                </button>
                <button onClick={onSignup}
                  style={{ flex: 1, padding: '13px 0', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--card)', fontSize: 15, fontWeight: 700, color: 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  회원가입
                </button>
              </div>
            </>
          )}
        </div>

        {/* 앱 설정 */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#C4956A', marginBottom: 10 }}>앱 설정</div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <SettingRow
            icon="🔔" label="알림 설정"
            value={notifEnabled ? 'ON' : 'OFF'}
            onClick={() => setShowNotif(true)}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 18px' }} />
          <SettingRow
            icon="🎨" label="테마 & 스타일"
            value={themeLabel}
            onClick={() => setShowTheme(true)}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 18px' }} />
          <SettingRow
            icon="🌐" label="언어 설정"
            value={langLabel}
            onClick={() => setShowLang(true)}
          />
        </div>
      </div>
    </div>
  )
}
