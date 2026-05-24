import emailjs from '@emailjs/browser'

// 장르별 추천 도서 매핑
const GENRE_BOOKS = {
  '판타지':     [{ title: '해리포터와 마법사의 돌', author: 'J.K. 롤링' },      { title: '반지의 제왕', author: 'J.R.R. 톨킨' }],
  '범죄/스릴러':[{ title: '셜록 홈즈 전집', author: '아서 코난 도일' },          { title: '그리고 아무도 없었다', author: '애거사 크리스티' }],
  '에세이':     [{ title: '나는 나로 살기로 했다', author: '김수현' },            { title: '괜찮지 않아도 괜찮아', author: '최설희' }],
  '심리학':     [{ title: '미움받을 용기', author: '기시미 이치로' },             { title: '자존감 수업', author: '윤홍균' }],
  '인문학':     [{ title: '사피엔스', author: '유발 하라리' },                   { title: '총균쇠', author: '재레드 다이아몬드' }],
  '로맨스':     [{ title: '오만과 편견', author: '제인 오스틴' },                { title: '폭풍의 언덕', author: '에밀리 브론테' }],
  '교양서':     [{ title: '부의 추월차선', author: 'MJ 드마르코' },              { title: '타이탄의 도구들', author: '팀 페리스' }],
  '학습서':     [{ title: '완벽한 공부법', author: '고영성' },                   { title: '어떻게 공부할 것인가', author: '헨리 뢰디거' }],
  '기록문':     [{ title: '안네의 일기', author: '안네 프랑크' },                { title: '빅터 프랭클의 죽음의 수용소에서', author: '빅터 프랭클' }],
  '라이트노벨': [{ title: '소드 아트 온라인', author: '카와하라 레키' },          { title: '이 멋진 세계에 축복을', author: '아카츠키 나츠메' }],
  '스릴러':     [{ title: '파이트 클럽', author: '척 팔라닉' },                  { title: '나를 찾아줘', author: '길리언 플린' }],
  '웹소설':     [{ title: '전지적 독자 시점', author: '싱숑' },                  { title: '나 혼자만 레벨업', author: '추공' }],
}

const DEFAULT_BOOKS = [
  { title: '달러구트 꿈 백화점', author: '이미예' },
  { title: '불편한 편의점', author: '김호연' },
  { title: '사피엔스', author: '유발 하라리' },
]

export function getGenreBook(genres) {
  if (!genres || genres.length === 0) {
    return DEFAULT_BOOKS[new Date().getDate() % DEFAULT_BOOKS.length]
  }
  const genre = genres[new Date().getDate() % genres.length]
  const books = GENRE_BOOKS[genre] || DEFAULT_BOOKS
  return books[new Date().getDate() % books.length]
}

export function shouldSendNotification(records, notifEnabled, lastSentDate) {
  if (!notifEnabled) return false

  // 마지막 알림 전송 후 7일이 지나지 않았으면 전송 안 함
  if (lastSentDate) {
    const daysSince = (Date.now() - new Date(lastSentDate).getTime()) / 86400000
    if (daysSince < 7) return false
  }

  // 최근 7일 내 메모가 있으면 알림 안 보냄
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const hasRecentMemo = records.some(
    (r) => r.date >= cutoffStr && (r.memos?.length > 0 || r.memoText)
  )
  return !hasRecentMemo
}

export async function sendEmailNotification(user, book) {
  const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey) return false

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email:    user.email,
        nickname:    user.nickname,
        book_title:  book.title,
        book_author: book.author,
        genre:       user.genres?.[0] || '추천 도서',
      },
      { publicKey }
    )
    return true
  } catch (e) {
    console.error('[책꾸] 이메일 전송 실패:', e)
    return false
  }
}
