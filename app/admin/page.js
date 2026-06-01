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

  useEffect(() => {
    fetchAll()
  }, [])

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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>강사 관리 화면</h1>

      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}

      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>1. 조 생성</h2>
        {teams.length === 0
          ? <button onClick={initTeams} style={btnStyle}>1조 / 2조 생성하기</button>
          : <p>완료: {teams.map(t => t.name).join(', ')} 생성됨</p>
        }
      </section>

      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>2. 수강생 추가</h2>
        <input
          placeholder="이름 입력"
          value={memberName}
          onChange={e => setMemberName(e.target.value)}
          style={inputStyle}
        />
        <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={inputStyle}>
          <option value="">조 선택</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={addMember} style={btnStyle}>추가</button>
        <ul style={{ marginTop: '10px' }}>
          {members.map(m => (
            <li key={m.id}>
              {m.name} - {m.ksl_teams?.name}
              <button onClick={() => deleteMember(m.id)} style={delBtnStyle}>삭제</button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>3. 질문 추가 (조별 최대 3개)</h2>
        <select value={questionTeam} onChange={e => setQuestionTeam(e.target.value)} style={inputStyle}>
          <option value="">조 선택</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input
          placeholder="질문 내용 입력"
          value={questionContent}
          onChange={e => setQuestionContent(e.target.value)}
          style={inputStyle}
        />
        <button onClick={addQuestion} style={btnStyle}>추가</button>
        <ul style={{ marginTop: '10px' }}>
          {questions.map(q => (
            <li key={q.id}>
              {q.ksl_teams?.name} - {q.content}
              <button onClick={() => deleteQuestion(q.id)} style={delBtnStyle}>삭제</button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>4. 의견 초기화</h2>
        <p>새 연수 시작 전에 이전 의견과 스티커를 삭제합니다.</p>
        <button onClick={resetAll} style={{ ...btnStyle, backgroundColor: '#e74c3c' }}>전체 초기화</button>
      </section>
    </div>
  )
}

const btnStyle = {
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginLeft: '8px'
}

const delBtnStyle = {
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  padding: '4px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginLeft: '8px',
  fontSize: '12px'
}

const inputStyle = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  marginRight: '8px'
}