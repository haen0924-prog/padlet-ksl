'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableCard({ opinion, hasSticker, stickerCount, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: opinion.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: '#fafafa',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px',
    width: '175px',
    minHeight: '110px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
    cursor: 'grab',
    zIndex: isDragging ? 999 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5', pointerEvents: 'none' }}>
        {opinion.content}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <small style={{ color: '#94a3b8', fontSize: '12px', pointerEvents: 'none' }}>{opinion.ksl_members?.name}</small>
        <button
          onClick={e => { e.stopPropagation(); onToggle(opinion.id) }}
          onPointerDown={e => e.stopPropagation()}
          style={{ background: hasSticker ? '#fef3c7' : '#f1f5f9', border: hasSticker ? '1px solid #fcd34d' : '1px solid #e2e8f0', borderRadius: '20px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: hasSticker ? '#d97706' : '#94a3b8' }}
        >
          {hasSticker ? '⭐' : '☆'} {stickerCount}
        </button>
      </div>
    </div>
  )
}

export default function BoardPage() {
  const [step, setStep] = useState('select')
  const [members, setMembers] = useState([])
  const [currentMember, setCurrentMember] = useState(null)
  const [questions, setQuestions] = useState([])
  const [opinions, setOpinions] = useState([])
  const [stickers, setStickers] = useState([])
  const [newOpinion, setNewOpinion] = useState({})
  const [orderedOpinions, setOrderedOpinions] = useState({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { fetchMembers() }, [])

  useEffect(() => {
    if (currentMember) {
      fetchQuestions()
      fetchOpinions()
      fetchStickers()
    }
  }, [currentMember])

  useEffect(() => {
    const ordered = {}
    questions.forEach(q => {
      ordered[q.id] = opinions.filter(o => o.question_id === q.id).map(o => o.id)
    })
    setOrderedOpinions(ordered)
  }, [opinions, questions])

  async function fetchMembers() {
    const { data } = await supabase.from('ksl_members').select('*, ksl_teams(name)').order('name')
    setMembers(data || [])
  }

  async function fetchQuestions() {
    const { data } = await supabase
      .from('ksl_questions').select('*')
      .eq('team_id', currentMember.team_id).order('order_num')
    setQuestions(data || [])
  }

  async function getQuestionIds() {
    const { data } = await supabase
      .from('ksl_questions').select('id')
      .eq('team_id', currentMember.team_id)
    return (data || []).map(q => q.id)
  }

  async function fetchOpinions() {
    const ids = await getQuestionIds()
    if (ids.length === 0) return
    const { data } = await supabase
      .from('ksl_opinions').select('*, ksl_members(name)')
      .in('question_id', ids).order('created_at')
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
      await supabase.from('ksl_stickers').insert([{ opinion_id: opinionId, member_id: currentMember.id }])
    }
    fetchStickers()
  }

  function handleDragEnd(event, questionId) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrderedOpinions(prev => {
      const oldOrder = prev[questionId] || []
      const oldIndex = oldOrder.indexOf(active.id)
      const newIndex = oldOrder.indexOf(over.id)
      return { ...prev, [questionId]: arrayMove(oldOrder, oldIndex, newIndex) }
    })
  }

  function getStickerCount(opinionId) {
    return stickers.filter(s => s.opinion_id === opinionId).length
  }

  function hasSticker(opinionId) {
    return stickers.some(s => s.opinion_id === opinionId && s.member_id === currentMember?.id)
  }

  function getOrderedOpinionsForQuestion(questionId) {
    const order = orderedOpinions[questionId] || []
    const qOpinions = opinions.filter(o => o.question_id === questionId)
    if (order.length === 0) return qOpinions
    return order.map(id => qOpinions.find(o => o.id === id)).filter(Boolean)
  }

  if (step === 'select') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✋</div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>수어교원 실습 나눔 보드</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>이름을 선택해서 입장하세요</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {members.map(m => (
              <button key={m.id}
                onClick={() => { setCurrentMember(m); setStep('board') }}
                style={{ padding: '14px 20px', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '15px', fontWeight: '600', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#f8f7ff' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}
              >
                <span>{m.name}</span>
                <span style={{ fontSize: '12px', background: '#ede9fe', color: '#6366f1', padding: '4px 10px', borderRadius: '20px' }}>{m.ksl_teams?.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>✋</span>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b' }}>실습 나눔 보드</span>
        </div>
        <span style={{ background: '#ede9fe', color: '#6366f1', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
          {currentMember.name} · {currentMember.ksl_teams?.name}
        </span>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px' }}>
        {questions.map((q, qi) => (
          <div key={q.id} style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ background: '#6366f1', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>Q{qi + 1}</span>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{q.content}</h2>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, q.id)}>
              <SortableContext items={orderedOpinions[q.id] || []} strategy={rectSortingStrategy}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                  {getOrderedOpinionsForQuestion(q.id).map(o => (
                    <SortableCard
                      key={o.id}
                      opinion={o}
                      hasSticker={hasSticker(o.id)}
                      stickerCount={getStickerCount(o.id)}
                      onToggle={toggleSticker}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                placeholder="의견을 입력하세요"
                value={newOpinion[q.id] || ''}
                onChange={e => setNewOpinion(prev => ({ ...prev, [q.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && submitOpinion(q.id)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
              />
              <button onClick={() => submitOpinion(q.id)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>등록</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}