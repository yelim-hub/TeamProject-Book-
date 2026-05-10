const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

async function callGroq(apiKey, messages, maxTokens = 300) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.8, max_tokens: maxTokens }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    if (res.status === 429) throw new Error('QUOTA_EXCEEDED')
    if (res.status === 401) throw new Error('INVALID_KEY')
    throw new Error(msg)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

export async function testApiKey(apiKey) {
  if (!apiKey?.trim()) return { ok: false, msg: 'API 키를 입력해주세요.' }
  try {
    await callGroq(apiKey.trim(), [{ role: 'user', content: '안녕' }], 10)
    return { ok: true }
  } catch (e) {
    if (e.message === 'QUOTA_EXCEEDED') return { ok: false, msg: '할당량 초과. 잠시 후 다시 시도하세요.' }
    if (e.message === 'INVALID_KEY') return { ok: false, msg: 'API 키가 올바르지 않습니다.' }
    return { ok: false, msg: e.message }
  }
}

export function createAuthorChat(apiKey, bookTitle, author, memoText) {
  const messages = [
    {
      role: 'system',
      content: `당신은 "${bookTitle}"의 저자 ${author}의 AI 페르소나입니다.

[언어 규칙 - 절대 준수]
- 무조건 한국어로만 답변하세요.
- 영어, 일본어, 중국어 등 어떤 외국어도 절대 사용하지 마세요.
- 사용자가 어떤 언어로 말하더라도 반드시 한국어로만 답변하세요.

[역할 규칙]
- ${author}의 철학과 문체를 반영하세요.
- 사용자의 독서 메모를 바탕으로 예상치 못한 질문이나 새로운 관점을 제시하세요.
- 도전적인 반론으로 비판적 사고를 자극하세요. (3~4문장 이내)
사용자의 독서 메모: "${memoText}"`,
    },
  ]

  return {
    async sendMessage(text) {
      messages.push({ role: 'user', content: text })
      const reply = await callGroq(apiKey, messages)
      messages.push({ role: 'assistant', content: reply })
      return reply
    },
  }
}

export function createBookRecommendChat(apiKey) {
  const messages = [
    {
      role: 'system',
      content: `당신은 '꾸'라는 이름의 책 큐레이터 AI입니다.

[언어 규칙 - 절대 준수]
- 무조건 한국어로만 답변하세요.
- 영어, 일본어, 중국어 등 어떤 외국어도 절대 사용하지 마세요.
- 사용자가 어떤 언어로 말하더라도 반드시 한국어로만 답변하세요.

[책 추천 시 형식]
1. 먼저 자연스러운 한국어 도입 문장을 작성하세요.
2. 다음 줄에 JSON 배열만 출력하세요:
[{"title":"제목","author":"저자","reason":"추천 이유 1~2문장"}]

일반 대화(추천이 아닌 경우)는 JSON 없이 자연스럽게 한국어로만 답변하세요.`,
    },
  ]

  return {
    async sendMessage(text) {
      messages.push({ role: 'user', content: text })
      const reply = await callGroq(apiKey, messages, 1000)
      messages.push({ role: 'assistant', content: reply })
      return reply
    },
  }
}

export async function generateSticker(apiKey, bookTitle, chatMessages) {
  const summary = chatMessages
    .slice(0, 8)
    .map((m) => `${m.role === 'model' ? 'AI' : '독자'}: ${m.content}`)
    .join('\n')

  const prompt = `"${bookTitle}"에 관한 독서 대화:\n${summary}\n\n위 대화의 핵심 인사이트를 나타내는 스티커를 만드세요. 반드시 아래 JSON만 출력하세요:\n{"emoji":"이모지1-2개","title":"8자이내제목","summary":"40자이내깨달음한문장"}`

  try {
    const text = await callGroq(apiKey, [{ role: 'user', content: prompt }], 200)
    const match = text.match(/\{[\s\S]*?\}/)
    if (match) return JSON.parse(match[0])
  } catch (e) {
    console.error('[책꾸] 스티커 생성 실패:', e)
  }

  return { emoji: '📚', title: '독서의 기록', summary: '오늘도 책과 함께 한 걸음 성장했습니다' }
}
