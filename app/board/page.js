'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function BoardPage() {
  const [step, setStep] = useState('select')
  const [members, setMembers] = useState([])
  const [currentMember, setCurrentMember] = useState(null)
  const [questions, setQuestions] = useState([])
  const [opinions, setOpinions] = useState([])
  const [stickers, setStickers] = useState([])
  const [newOpinion, setNewOpinion] = useState({})

  useEffect(() => { fetchMembers() }, [])

  useEffect(() => {
    if (currentMember) {
      fetchQuestions()
      fetchOpinions()
      fetchStickers()
    }
  }, [currentMember])

  async function fetchMembers() {
    const { data } = await supabase.from('ksl_members').select('*, ksl_teams(name)').order('name')
    setMembers(data || [])
  }

  async function fetchQuestions() {
    const { data } = await supabase
      .from('ksl_questions')
      .select('*')
      .eq('team_id', currentMember.team_id)
      .order('order_num')
    setQuestions(data || [])
  }

  async function getQuestionIds() {
    const { data } = await supabase
      .from('ksl_questions')
      .select('id')
      .eq('team_id', currentMember.team_id)
    return (data || []).map(q => q.id)
  }

  async function fetchOpinions() {
    const ids = await getQuestionIds()
    if (ids.length === 0) return
    const { data } = await supabase
      .from('ksl_opinions')
      .select('*, ksl_members(name)')
      .in('question_id', ids)
      .order('created_at')
    setOpinions(data || [])
  }

  async function fetchStickers() {
    const { data } = await supabase.from('ksl_stickers').select('*')
    setStickers(data || [])
  }

  async function submitOpinion(questionId) {
    const content = newOpinion[questionId]
    if (!content?.trim()) return
    await supabase.from('ksl_opinions').insert([{
      question_id: questionId,
      member_id: currentMember.id,
      content: content.trim()
    }])
    setNewOpinion(prev => ({ ...prev, [questionId]: '' }))
    fetchOpinions()
  }

  async function toggleSticker(opinionId) {
    const exists = stickers.find(s => s.opinion_id === opinionId && s.member_id === currentMember.id)
    if (exists) {
      await supabase.from('ksl_stickers').delete().eq('id', exists.id)
    } else {
      await supabase.from('ksl_stickers').insert([{
        opinion_id: opinionId,
        member_id: currentMember.id
      }])
    }
    fetchStickers()
  }

  function getStickerCount(opinionId) {
    return stickers.filter(s => s.opinion_id === opinionId).length
  }

  function hasSticker(opinionId) {
    return stickers.some(s => s.opinion_id === opinionId && s.member_id === currentMember?.id)
  }

  if (step === 'select') {
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <h1>수어교원 실습 나눔 보드</h1>
        <p>이름을 선택하세요</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => { setCurrentMember(m); setStep('board') }}
              style={memberBtnStyle}
            >
              {m.name} ({m.ksl_teams?.name})
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>실습 나눔 보드</h1>
        <span style={{ background: '#3498db', color: 'white', padding: '6px 14px', borderRadius: '20px' }}>
          {currentMember.name} ({currentMember.ksl_teams?.name})
        </span>
      </div>

      {questions.map((q, qi) => (
        <div key={q.id} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '15px', color: '#2c3e50' }}>Q{qi + 1}. {q.content}</h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
            {opinions.filter(o => o.question_id === q.id).map(o => (
              <div key={o.id} style={cardStyle}>
                <p style={{ margin: '0 0 8px 0' }}>{o.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: '#888' }}>{o.ksl_members?.name}</small>
                  <button
                    onClick={() => toggleSticker(o.id)}
                    style={{
                      background: hasSticker(o.id) ? '#f39c12' : '#ecf0f1',
                      border: 'none', borderRadius: '12px',
                      padding: '4px 10px', cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    {hasSticker(o.id) ? '⭐' : '☆'} {getStickerCount(o.id)}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              placeholder="의견을 입력하세요"
              value={newOpinion[q.id] || ''}
              onChange={e => setNewOpinion(prev => ({ ...prev, [q.id]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && submitOpinion(q.id)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            <button onClick={() => submitOpinion(q.id)} style={btnStyle}>등록</button>
          </div>
        </div>
      ))}
    </div>
  )
}

const memberBtnStyle = {
  padding: '14px', fontSize: '16px', borderRadius: '8px',
  border: '1px solid #ddd', background: 'white', cursor: 'pointer', textAlign: 'left'
}

const cardStyle = {
  background: '#fffde7', border: '1px solid #f9e44a', borderRadius: '8px',
  padding: '12px', width: '180px', minHeight: '100px',
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
}

const btnStyle = {
  backgroundColor: '#3498db', color: 'white', border: 'none',
  padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
}