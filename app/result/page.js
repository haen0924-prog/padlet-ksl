'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResultPage() {
  const [teams, setTeams] = useState([])
  const [questions, setQuestions] = useState([])
  const [opinions, setOpinions] = useState([])
  const [stickers, setStickers] = useState([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data: t } = await supabase.from('ksl_teams').select('*')
    const { data: q } = await supabase.from('ksl_questions').select('*').order('order_num')
    const { data: o } = await supabase.from('ksl_opinions').select('*, ksl_members(name)').order('created_at')
    const { data: s } = await supabase.from('ksl_stickers').select('*')
    setTeams(t || [])
    setQuestions(q || [])
    setOpinions(o || [])
    setStickers(s || [])
  }

  function getStickerCount(opinionId) {
    return stickers.filter(s => s.opinion_id === opinionId).length
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📋</span>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b' }}>결과 보기</span>
        </div>
        <button onClick={() => window.print()} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          🖨️ 인쇄 / PDF 저장
        </button>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px' }}>
        {teams.map(team => (
          <div key={team.id} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#6366f1', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: '700', fontSize: '16px' }}>
                {team.name}
              </div>
            </div>

            {questions.filter(q => q.team_id === team.id).map((q, qi) => {
              const qOpinions = [...opinions.filter(o => o.question_id === q.id)]
                .sort((a, b) => getStickerCount(b.id) - getStickerCount(a.id))

              return (
                <div key={q.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ background: '#6366f1', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 }}>Q{qi + 1}</span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{q.content}</h3>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {qOpinions.map(o => (
                      <div key={o.id} style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', width: '175px', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>{o.content}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <small style={{ color: '#94a3b8', fontSize: '12px' }}>{o.ksl_members?.name}</small>
                          <span style={{ background: getStickerCount(o.id) > 0 ? '#fef3c7' : '#f1f5f9', border: getStickerCount(o.id) > 0 ? '1px solid #fcd34d' : '1px solid #e2e8f0', borderRadius: '20px', padding: '4px 10px', fontSize: '13px', fontWeight: '600', color: getStickerCount(o.id) > 0 ? '#d97706' : '#94a3b8' }}>
                            ⭐ {getStickerCount(o.id)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {qOpinions.length === 0 && (
                      <p style={{ color: '#94a3b8', fontSize: '14px' }}>아직 의견이 없어요</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
        }
      `}</style>
    </div>
  )
}