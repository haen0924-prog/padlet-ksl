import { NextResponse } from 'next/server'

export async function POST(request) {
  const { opinions } = await request.json()

  if (!opinions || opinions.length === 0) {
    return NextResponse.json({ groups: [] })
  }

  const opinionText = opinions.map((o, i) => `${i + 1}. ${o.content}`).join('\n')

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `다음 의견들을 유사한 내용끼리 그룹으로 묶어주세요. 각 그룹에 짧은 제목을 붙여주세요. 반드시 JSON 형식으로만 답하세요. 다른 말은 하지 마세요.

형식: {"groups": [{"title": "그룹 제목", "indices": [1, 2, 3]}, ...]}

의견 목록:
${opinionText}`
        }]
      })
    })

    const data = await response.json()
    console.log('API 응답:', JSON.stringify(data))

    if (!data.content || !data.content[0]) {
      console.error('API 오류:', data)
      return NextResponse.json({ error: data.error?.message || '알 수 없는 오류', groups: [] }, { status: 500 })
    }

    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)

  } catch (e) {
    console.error('오류:', e)
    return NextResponse.json({ error: e.message, groups: [] }, { status: 500 })
  }
}