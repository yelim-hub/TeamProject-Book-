// Gemini REST API 호출 (공식 quickstart 문서 기준 - x-goog-api-key 헤더 방식)
// 문서: https://ai.google.dev/gemini-api/docs/quickstart

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

// 사용 가능한 무료 모델 목록 (순서대로 시도)
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
]

async function callGemini(apiKey, contents, modelIndex = 0) {
  if (modelIndex >= MODELS.length) {
    throw new Error('사용 가능한 모델을 찾지 못했습니다. API 키를 확인해주세요.')
  }

  const model = MODELS[modelIndex]

  const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,   // ← 공식 문서 권장 방식
    },
    body: JSON.stringify({ contents }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const msg = errData?.error?.message || `HTTP ${res.status}`

    // 모델 없음 → 다음 모델로 자동 재시도
    if (res.status === 404 || msg.includes('not found') || msg.includes('not supported')) {
      console.warn(`[책꾸] ${model} 불가 → ${MODELS[modelIndex + 1] ?? '없음'} 시도`)
      return callGemini(apiKey, contents, modelIndex + 1)
    }

    // 할당량 초과
    if (res.status === 429) throw new Error('QUOTA_EXCEEDED')

    // 인증 실패
    if (res.status === 400 || res.status === 403) throw new Error('INVALID_KEY')

    throw new Error(msg)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

// API 키 유효성 테스트
export async function testApiKey(apiKey) {
  if (!apiKey?.trim()) return { ok: false, msg: 'API 키를 입력해주세요.' }
  try {
    await callGemini(apiKey.trim(), [{ role: 'user', parts: [{ text: '안녕' }] }])
    return { ok: true }
  } catch (e) {
    if (e.message === 'QUOTA_EXCEEDED') return { ok: false, msg: '할당량 초과. 새 API 키를 발급받거나 내일 다시 시도하세요.' }
    if (e.message === 'INVALID_KEY') return { ok: false, msg: 'API 키가 올바르지 않습니다.' }
    return { ok: false, msg: e.message }
  }
}

// 저자 페르소나 채팅 세션 생성
export function createAuthorChat(apiKey, bookTitle, author, memoText) {
  const history = [
    {
      role: 'user',
      parts: [{
        text: `지금부터 당신은 "${bookTitle}"의 저자 ${author}의 AI 페르소나입니다.
규칙:
- 저자의 철학과 문체로 한국어로만 대화하세요
- 사용자의 메모를 바탕으로 '반전의 질문'이나 '새로운 관점'을 제시하세요
- 도전적으로 반박하여 비판적 사고를 유도하되, 3-4문장 이내로 간결하게 답하세요
사용자 독서 메모: "${memoText}"`
      }],
    },
    {
      role: 'model',
      parts: [{ text: `알겠습니다. 저는 ${author}입니다. 메모를 읽었습니다. 대화를 시작하겠습니다.` }],
    },
  ]

  return {
    async sendMessage(text) {
      history.push({ role: 'user', parts: [{ text }] })
      const reply = await callGemini(apiKey.trim(), history)
      history.push({ role: 'model', parts: [{ text: reply }] })
      return reply
    },
  }
}

// 대화 기반 스티커 생성
export async function generateSticker(apiKey, bookTitle, chatMessages) {
  const summary = chatMessages
    .slice(0, 8)
    .map((m) => `${m.role === 'model' ? 'AI' : '독자'}: ${m.content}`)
    .join('\n')

  const prompt = `"${bookTitle}"에 관한 독서 대화:\n${summary}\n\n위 대화의 핵심 인사이트를 나타내는 스티커를 만드세요. 반드시 아래 JSON만 출력하세요:\n{"emoji":"이모지1-2개","title":"8자이내제목","summary":"40자이내깨달음한문장"}`

  try {
    const text = await callGemini(apiKey.trim(), [
      { role: 'user', parts: [{ text: prompt }] },
    ])
    const match = text.match(/\{[\s\S]*?\}/)
    if (match) return JSON.parse(match[0])
  } catch (e) {
    console.error('[책꾸] 스티커 생성 실패:', e)
  }

  return { emoji: '📚', title: '독서의 기록', summary: '오늘도 책과 함께 한 걸음 성장했습니다' }
}