'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResultPage() {
  const [teams, setTeams] = useState([])
  const [questions, setQuestions] = useState([])
  const [opinions, setOpinions] = useState([])
  const [stickers, setStickers] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data: t } = await supabase.from('ksl_teams').select('*')
    const { data: q } = await supabase.from('ksl_questions').select('*').order('order_num')
    const { data: o } = await supabase.from('ksl_opinions').select('*, ksl_members(name)').order('created_at')
    const { data: s } = await supabase.from('ksl_stickers').select('*')
    const { data: m } = await supabase.from('ksl_members').select('*, ksl_teams(name)')
    setTeams(t || [])
    setQuestions(q || [])
    setOpinions(o || [])
    setStickers(s || [])
    setMembers(m || [])
  }

  function getStickerCount(opinionId) {
    return stickers.filter(s => s.opinion_id === opinionId).length
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }} className="no-print">
        <h1>결과 보기</h1>
        <button onClick={handlePrint} style={btnStyle}>🖨️ 인쇄 / PDF 저장</button>
      </div>

      {teams.map(team => (
        <div key={team.id} style={{ marginBottom: '40px' }}>
          <h2 style={{ background: '#3498db', color: 'white', padding: '10px 20px', borderRadius: '8px' }}>
            {team.name}
          </h2>

          {questions.filter(q => q.team_id === team.id).map((q, qi) => {
            const qOpinions = opinions.filter(o => o.question_id === q.id)
            const sorted = [...qOpinions].sort((a, b) => getStickerCount(b.id) - getStickerCount(a.id))

            return (
              <div key={q.id} style={{ marginBottom: '25px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Q{qi + 1}. {q.content}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {sorted.map(o => (
                    <div key={o.id} style={{
                      background: '#fffde7',
                      border: '1px solid #f9e44a',
                      borderRadius: '8px',
                      padding: '12px',
                      width: '180px',
                      minHeight: '100px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <p style={{ margin: '0 0 8px 0' }}>{o.content}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <small style={{ color: '#888' }}>{o.ksl_members?.name}</small>
                        <span style={{
                          background: getStickerCount(o.id) > 0 ? '#f39c12' : '#ecf0f1',
                          color: getStickerCount(o.id) > 0 ? 'white' : '#888',
                          borderRadius: '12px',
                          padding: '4px 10px',
                          fontSize: '14px'
                        }}>
                          ⭐ {getStickerCount(o.id)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <style>{`
        @media print {
          .no-print { display: none; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  )
}

const btnStyle = {
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px'
}