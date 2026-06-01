'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [teams, setTeams] = useState([])
  const [memberName, setMemberName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [questionContent, setQuestionContent] = useState('')
  const [questionTeam, setQuestionTeam] = useState('')
  const [members, setMembers] = useState([])
  const [questions, setQuestions] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data: t } = await supabase.from('ksl_teams').select('*')
    const { data: m } = await supabase.from('ksl_members').select('*, ksl_teams(name)')
    const { data: q } = await supabase.from('ksl_questions').select('*, ksl_teams(name)')
    setTeams(t || [])
    setMembers(m || [])
    setQuestions(q || [])
  }

  async function initTeams() {
    await supabase.from('ksl_teams').insert([{ name: '1조' }, { name: '2조' }])
    fetchAll()
    setMessage('조가 생성되었습니다!')
  }

  async function addMember() {
    if (!memberName || !selectedTeam) return
    await supabase.from('ksl_members').insert([{ name: memberName, team_id: parseInt(selectedTeam) }])
    setMemberName('')
    fetchAll()
    setMessage('수강생이 추가되었습니다!')
  }

  async function addQuestion() {
    if (!questionContent || !questionTeam) return
    const teamQuestions = questions.filter(q => q.team_id === parseInt(questionTeam))
    await supabase.from('ksl_questions').insert([{
      content: questionContent,
      team_id: parseInt(questionTeam),
      order_num: teamQuestions.length + 1
    }])
    setQuestionContent('')
    fetchAll()
    setMessage('질문이 추가되었습니다!')
  }

  async function deleteMember(id) {
    await supabase.from('ksl_members').delete().eq('id', id)
    fetchAll()
  }

  async function deleteQuestion(id) {
    await supabase.from('ksl_questions').delete().eq('id', id)
    fetchAll()
  }

  async function resetAll() {
    if (!confirm('모든 의견과 스티커를 초기화할까요?')) return
    await supabase.from('ksl_stickers').delete().neq('id', 0)
    await supabase.from('ksl_opinions').delete().neq('id', 0)
    setMessage('초기화 완료!')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '24px' }}>🛠️</span>
        <span style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b' }}>강사 관리 화면</span>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px' }}>
        {message && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', color: '#166534', fontWeight: '600', fontSize: '14px' }}>
            ✅ {message}
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={sectionTitle}>1. 조 생성</h2>
          {teams.length === 0
            ? <button onClick={initTeams} style={btnStyle}>1조 / 2조 생성하기</button>
            : <div style={{ display: 'flex', gap: '8px' }}>
                {teams.map(t => (
                  <span key={t.id} style={{ background: '#ede9fe', color: '#6366f1', padding: '6px 16px', borderRadius: '20px', fontWeight: '600', fontSize: '14px' }}>{t.name}</span>
                ))}
              </div>
          }
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitle}>2. 수강생 추가</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              placeholder="이름 입력"
              value={memberName}
              onChange={e => setMemberName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMember()}
              style={inputStyle}
            />
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={inputStyle}>
              <option value="">조 선택</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={addMember} style={btnStyle}>추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>{m.name}</span>
                  <span style={{ fontSize: '12px', background: '#ede9fe', color: '#6366f1', padding: '2px 10px', borderRadius: '20px' }}>{m.ksl_teams?.name}</span>
                </div>
                <button onClick={() => deleteMember(m.id)} style={delBtnStyle}>삭제</button>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitle}>3. 질문 추가 (조별 최대 3개)</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <select value={questionTeam} onChange={e => setQuestionTeam(e.target.value)} style={inputStyle}>
              <option value="">조 선택</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input
              placeholder="질문 내용 입력"
              value={questionContent}
              onChange={e => setQuestionContent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQuestion()}
              style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
            />
            <button onClick={addQuestion} style={btnStyle}>추가</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {questions.map(q => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', background: '#ede9fe', color: '#6366f1', padding: '2px 10px', borderRadius: '20px' }}>{q.ksl_teams?.name}</span>
                  <span style={{ color: '#334155' }}>{q.content}</span>
                </div>
                <button onClick={() => deleteQuestion(q.id)} style={delBtnStyle}>삭제</button>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitle}>4. 의견 초기화</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>새 연수 시작 전에 이전 의견과 스티커를 삭제합니다.</p>
          <button onClick={resetAll} style={{ ...btnStyle, background: '#ef4444' }}>전체 초기화</button>
        </div>
      </div>
    </div>
  )
}

const cardStyle = { background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
const sectionTitle = { fontSize: '16px', fontWeight: '700', color: '#1e293b', marginTop: 0, marginBottom: '16px' }
const btnStyle = { background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }
const delBtnStyle = { background: 'white', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
const inputStyle = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }