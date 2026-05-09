const SETTING_ITEMS = [
  { icon: '🔔', label: '알림 설정' },
  { icon: '🎨', label: '테마 & 스타일' },
  { icon: '🌐', label: '언어 설정' },
]

function SettingRow({ icon, label, onClick }) {
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
      <span style={{ fontSize: 20, color: 'var(--txt3)' }}>›</span>
    </button>
  )
}

export default function MyPageScreen({ currentUser, onBack, onLogin, onSignup, onLogout }) {
  return (
    <div className="screen">

      {/* ── 헤더 ── */}
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

        {/* ── 계정 설정 ── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#C4956A', marginBottom: 10 }}>계정 설정</div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 24 }}>
          {/* 아바타 */}
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
                style={{ padding: '12px 32px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'white', fontSize: 14, fontWeight: 700, color: 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit' }}>
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
                  style={{ flex: 1, padding: '13px 0', border: '1.5px solid var(--border)', borderRadius: 12, background: 'white', fontSize: 15, fontWeight: 700, color: 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  로그인
                </button>
                <button onClick={onSignup}
                  style={{ flex: 1, padding: '13px 0', border: '1.5px solid var(--border)', borderRadius: 12, background: 'white', fontSize: 15, fontWeight: 700, color: 'var(--txt)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  회원가입
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── 앱 설정 ── */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#C4956A', marginBottom: 10 }}>앱 설정</div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {SETTING_ITEMS.map((item, i) => (
            <div key={item.label}>
              <SettingRow icon={item.icon} label={item.label} onClick={() => alert(`${item.label}은 준비 중입니다`)} />
              {i < SETTING_ITEMS.length - 1 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '0 18px' }} />
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
