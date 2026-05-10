import { CreateMLCEngine } from '@mlc-ai/web-llm'

// 가장 작은 모델 (~300MB 브라우저 캐시에 저장됨)
const MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

let engine = null

export function isWebGPUSupported() {
  return !!navigator.gpu
}

export async function initEngine(onProgress) {
  if (engine) return engine
  engine = await CreateMLCEngine(MODEL, {
    initProgressCallback: onProgress,
  })
  return engine
}

export function createAuthorChat(bookTitle, author, memoText) {
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
      const reply = await engine.chat.completions.create({
        messages,
        temperature: 0.8,
        max_tokens: 300,
      })
      const content = reply.choices[0].message.content
      messages.push({ role: 'assistant', content })
      return content
    },
  }
}

export async function generateSticker(bookTitle, chatMessages) {
  const summary = chatMessages
    .slice(0, 8)
    .map((m) => `${m.role === 'model' ? 'AI' : '독자'}: ${m.content}`)
    .join('\n')

  const prompt = `"${bookTitle}"에 관한 독서 대화:\n${summary}\n\n위 대화의 핵심 인사이트를 나타내는 스티커를 만드세요. 반드시 아래 JSON만 출력하세요:\n{"emoji":"이모지1-2개","title":"8자이내제목","summary":"40자이내깨달음한문장"}`

  try {
    const reply = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    })
    const text = reply.choices[0].message.content
    const match = text.match(/\{[\s\S]*?\}/)
    if (match) return JSON.parse(match[0])
  } catch (e) {
    console.error('[책꾸] 스티커 생성 실패:', e)
  }

  return { emoji: '📚', title: '독서의 기록', summary: '오늘도 책과 함께 한 걸음 성장했습니다' }
}
