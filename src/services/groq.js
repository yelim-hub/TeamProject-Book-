const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const DAILY_BESTSELLERS = [
  { title: '달러구트 꿈 백화점', author: '이미예' },
  { title: '불편한 편의점', author: '김호연' },
  { title: '사피엔스', author: '유발 하라리' },
  { title: '아몬드', author: '손원평' },
  { title: '채식주의자', author: '한강' },
  { title: '82년생 김지영', author: '조남주' },
  { title: '역행자', author: '자청' },
  { title: '지구 끝의 온실', author: '김초엽' },
  { title: '나미야 잡화점의 기적', author: '히가시노 게이고' },
  { title: '소년이 온다', author: '한강' },
  { title: '트렌드 코리아 2025', author: '김난도 외' },
  { title: '어떻게 살 것인가', author: '유시민' },
]

// ── 언어별 규칙 문자열 ──────────────────────────────────────────
function getLangRule(lang) {
  if (lang === 'en') return `[LANGUAGE RULES - STRICTLY FOLLOW]
- Always respond in English only. Never use Korean, Japanese, or any other language.
- Use natural, grammatically correct English at all times.`
  if (lang === 'ja') return `[言語ルール - 厳守]
- 必ず日本語のみで回答してください。韓国語・英語など他の言語は絶対に使用しないでください。
- 自然で文法的に正確な日本語を使用してください。`
  return `[언어 규칙 - 절대 준수]
- 무조건 한국어로만 답변하세요.
- 영어, 일본어, 중국어 등 어떤 외국어도 절대 사용하지 마세요.
- 사용자가 어떤 언어로 말하더라도 반드시 한국어로만 답변하세요.`
}

function getQuestionRule(lang) {
  if (lang === 'en') return `[QUESTION RULES - STRICTLY FOLLOW]
- Ask only ONE question at a time.
- Keep questions short, simple, and in a single sentence.
- Never ask multiple questions at once.
- After the user responds, naturally continue with one next question.`
  if (lang === 'ja') return `[質問ルール - 厳守]
- 一度に必ず一つだけ質問してください。
- 質問は短く、シンプルに、一文で書いてください。
- 複数の質問を一度に並べないでください。
- ユーザーの回答後、自然に次の一つの質問に続いてください。`
  return `[질문 규칙 - 반드시 준수]
- 한 번에 질문은 반드시 하나만 하세요.
- 질문은 짧고 쉽게, 한 문장으로 작성하세요.
- 여러 질문을 한꺼번에 나열하지 마세요.
- 사용자의 답변을 듣고 나서 자연스럽게 다음 질문 하나로 이어가세요.`
}

function getRoleRule(lang, author) {
  if (lang === 'en') return `[ROLE RULES]
- Reflect ${author}'s philosophy and writing style.
- Based on the user's reading notes, ask sharp questions to stimulate critical thinking.
- Keep responses concise (2-3 sentences) and end with one question.`
  if (lang === 'ja') return `[役割ルール]
- ${author}の哲学と文体を反映してください。
- ユーザーの読書メモをもとに、批判的思考を促す核心的な質問をしてください。
- 回答は2〜3文以内で簡潔にし、最後に一つの質問で締めくくってください。`
  return `[역할 규칙]
- ${author}의 철학과 문체를 반영하세요.
- 사용자의 독서 메모를 바탕으로 핵심을 찌르는 질문으로 비판적 사고를 자극하세요.
- 답변은 2~3문장 이내로 간결하게 하고, 마지막에 질문 하나로 마무리하세요.`
}

function getGreetingLine(lang, nickname) {
  if (!nickname) return ''
  if (lang === 'en') return `- Start your first message with "Hello, ${nickname}!" before asking your question.`
  if (lang === 'ja') return `- 最初のメッセージは必ず「こんにちは、${nickname}さん！」から始めてください。`
  return `- 첫 번째 메시지는 반드시 "안녕하세요~ ${nickname}님!" 으로 시작한 뒤 질문하세요.`
}

function getBookRecommendFirstMessage(lang, nickname) {
  if (lang === 'en') {
    const greet = nickname ? `Hello, ${nickname}!` : 'Hello!'
    return `${greet} What genre of books do you enjoy?`
  }
  if (lang === 'ja') {
    const greet = nickname ? `こんにちは、${nickname}さん！` : 'こんにちは！'
    return `${greet} どんなジャンルの本が好きですか？`
  }
  const greet = nickname ? `안녕하세요~ ${nickname}님!` : '안녕하세요!'
  return `${greet} 어떤 장르의 책을 좋아하시나요?`
}

// ── Groq 호출 ────────────────────────────────────────────────────
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

// ── 저자 페르소나 채팅 ────────────────────────────────────────────
export function createAuthorChat(apiKey, bookTitle, author, memoText, nickname = null, language = 'ko') {
  const langRule     = getLangRule(language)
  const questionRule = getQuestionRule(language)
  const roleRule     = getRoleRule(language, author)
  const greetingLine = getGreetingLine(language, nickname)

  const memoLabel = language === 'en' ? `User's reading notes: "${memoText}"`
    : language === 'ja' ? `ユーザーの読書メモ: "${memoText}"`
    : `사용자의 독서 메모: "${memoText}"`

  const authorIntro = language === 'en'
    ? `You are the AI persona of ${author}, the author of "${bookTitle}".`
    : language === 'ja'
    ? `あなたは「${bookTitle}」の著者${author}のAIペルソナです。`
    : `당신은 "${bookTitle}"의 저자 ${author}의 AI 페르소나입니다.`

  const messages = [
    {
      role: 'system',
      content: `${authorIntro}

${langRule}

${questionRule}

${roleRule}
${greetingLine ? greetingLine + '\n' : ''}${memoLabel}`,
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

// ── 책 추천 채팅 ─────────────────────────────────────────────────
export function createBookRecommendChat(apiKey, nickname = null, language = 'ko') {
  const firstMessage = getBookRecommendFirstMessage(language, nickname)
  const todayBest = DAILY_BESTSELLERS[new Date().getDate() % DAILY_BESTSELLERS.length]
  const langRule = getLangRule(language)

  const flowRule = language === 'en'
    ? `[CONVERSATION FLOW]
- You have already greeted with: "${firstMessage}"
- When the user tells you a genre, recommend books in that genre.
- If the user doesn't care about genre or is unsure, recommend today's bestseller: "${todayBest.title}" by ${todayBest.author}.
- Ask only one question at a time.`
    : language === 'ja'
    ? `[会話の流れ]
- すでに「${firstMessage}」と挨拶しました。
- ユーザーがジャンルを教えてくれたら、そのジャンルの本を推薦してください。
- ジャンルにこだわらない・わからない場合は、本日のベストセラー「${todayBest.title}」（${todayBest.author}）を推薦してください。
- 一度に一つだけ質問してください。`
    : `[대화 흐름 규칙]
- 이미 "${firstMessage}" 라고 인사를 마쳤습니다.
- 사용자가 장르를 알려주면 그 장르에 맞는 책을 추천하세요.
- 사용자가 장르 상관없이 추천을 원하거나 모르겠다고 하면, 오늘의 베스트셀러인 "${todayBest.title}" (저자: ${todayBest.author})를 추천하세요.
- 질문은 한 번에 하나씩만 하세요.`

  const formatRule = language === 'en'
    ? `[BOOK RECOMMENDATION FORMAT]
1. Write a natural introductory sentence first.
2. Then output only the JSON array:
[{"title":"title","author":"author","reason":"recommendation reason in 1-2 sentences"}]

For general conversation (not a recommendation), respond naturally without JSON.`
    : language === 'ja'
    ? `[本の推薦フォーマット]
1. まず自然な日本語の導入文を書いてください。
2. 次の行にJSONの配列のみを出力してください:
[{"title":"タイトル","author":"著者","reason":"推薦理由を1〜2文で"}]

推薦以外の一般会話はJSONなしで自然に答えてください。`
    : `[책 추천 시 형식]
1. 먼저 자연스러운 도입 문장을 작성하세요.
2. 다음 줄에 JSON 배열만 출력하세요:
[{"title":"제목","author":"저자","reason":"추천 이유 1~2문장"}]

일반 대화(추천이 아닌 경우)는 JSON 없이 자연스럽게 답변하세요.`

  const messages = [
    {
      role: 'system',
      content: `${language === 'en' ? "You are a book curator AI named 'KKU'."
        : language === 'ja' ? "あなたは'KKU'という名前の本のキュレーターAIです。"
        : "당신은 '꾸'라는 이름의 책 큐레이터 AI입니다."}

${langRule}

${flowRule}

${formatRule}`,
    },
    { role: 'assistant', content: firstMessage },
  ]

  return {
    firstMessage,
    async sendMessage(text) {
      messages.push({ role: 'user', content: text })
      const reply = await callGroq(apiKey, messages, 1000)
      messages.push({ role: 'assistant', content: reply })
      return reply
    },
  }
}

// ── 음성 전사 ────────────────────────────────────────────────────
const WHISPER_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions'
const VISION_MODEL = 'llama-3.2-11b-vision-preview'

export async function transcribeAudio(apiKey, audioBlob, language = 'ko') {
  const mimeType = audioBlob.type || 'audio/webm'
  const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a'
    : mimeType.includes('ogg') ? 'ogg'
    : mimeType.includes('wav') ? 'wav'
    : 'webm'
  const formData = new FormData()
  formData.append('file', audioBlob, `recording.${ext}`)
  formData.append('model', 'whisper-large-v3-turbo')
  formData.append('language', language === 'ja' ? 'ja' : language === 'en' ? 'en' : 'ko')
  formData.append('response_format', 'text')
  const res = await fetch(WHISPER_ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => `HTTP ${res.status}`)
    if (res.status === 429) throw new Error('QUOTA_EXCEEDED')
    if (res.status === 401) throw new Error('INVALID_KEY')
    throw new Error(msg.slice(0, 120))
  }
  return (await res.text()).trim()
}

// ── 사진 분석 ────────────────────────────────────────────────────
export async function analyzeBookPhoto(apiKey, dataUrls, language = 'ko') {
  const prompt = language === 'en'
    ? `Examine the image(s). Is this book content (text pages, e-book screen, or book cover with readable text)?
If YES: reply "VALID\n" then summarize the visible text in 2-3 sentences.
If NO (blurry, unrelated, no text): reply only "INVALID".
Respond in English only.`
    : language === 'ja'
    ? `画像を確認してください。書籍のコンテンツ（テキストページ・電子書籍画面・読める文字のある表紙）ですか？
YESの場合：「VALID\n」に続けて見えるテキストを2〜3文で要約してください。
NOの場合（不鮮明・無関係・文字なし）：「INVALID」とだけ答えてください。
日本語のみで回答してください。`
    : `사진을 확인해주세요. 책 내용(텍스트 페이지, 전자책 화면, 읽을 수 있는 글자가 있는 책 표지)인가요?
YES인 경우: "VALID\n" 다음에 보이는 텍스트를 2~3문장으로 요약해주세요.
NO인 경우(흐릿하거나 책과 무관하거나 글자 없음): "INVALID" 라고만 답해주세요.
반드시 한국어로만 답변하세요.`

  const imageContent = dataUrls.map((url) => ({ type: 'image_url', image_url: { url } }))

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: prompt }] }],
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    if (res.status === 429) throw new Error('QUOTA_EXCEEDED')
    if (res.status === 401) throw new Error('INVALID_KEY')
    throw new Error(msg)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim() || ''
  if (!text || text.toUpperCase().startsWith('INVALID')) return { valid: false, content: '' }
  const content = text.startsWith('VALID') ? text.replace(/^VALID\n?/i, '').trim() : text
  return { valid: true, content }
}

// ── 스티커 생성 ──────────────────────────────────────────────────
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
