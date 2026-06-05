'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'

function DraggableCard({ opinion, hasSticker, stickerCount, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opinion.id })
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.3 : 1,
    background: '#fffde7',
    border: '1px solid #f9e44a',
    borderRadius: '10px',
    padding: '12px',
    width: '150px',
    minHeight: '100px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    cursor: 'grab',
    touchAction: 'none',
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155', lineHeight: '1.5', pointerEvents: 'none' }}>
        {opinion.content}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <small style={{ color: '#94a3b8', fontSize: '11px', pointerEvents: 'none' }}>{opinion.ksl_members?.name}</small>
        <button
          onClick={e => { e.stopPropagation(); onToggle(opinion.id) }}
          onPointerDown={e => e.stopPropagation()}
          style={{ background: hasSticker ? '#fef3c7' : '#f1f5f9', border: hasSticker ? '1px solid #fcd34d' : '1px solid #e2e8f0', borderRadius: '20px', padding: '3px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: hasSticker ? '#d97706' : '#94a3b8' }}
        >
          {hasSticker ? '⭐' : '☆'} {stickerCount}
        </button>
      </div>
    </div>
  )
}

function DroppableGroup({ group, opinions, hasSticker, getStickerCount, onToggle, onTitleChange, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: `group-${group.id}` })

  return (
    <div style={{ background: isOver ? '#f0f4ff' : '#f8fafc', border: `2px dashed ${isOver ? '#6366f1' : '#cbd5e1'}`, borderRadius: '14px', padding: '16px', minHeight: '160px', flex: '1 1 250px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <input
          value={group.title}
          onChange={e => onTitleChange(group.id, e.target.value)}
          placeholder="그룹 이름 입력"
          style={{ fontWeight: '700', fontSize: '14px', color: '#6366f1', background: 'transparent', border: 'none', borderBottom: '2px solid #c7d2fe', outline: 'none', width: '100%', padding: '2px 4px' }}
        />
        <button
          onClick={() => onDelete(group.id)}
          style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '16px', marginLeft: '8px', flexShrink: 0 }}
        >✕</button>
      </div>
      <div ref={setNodeRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '80px' }}>
        {opinions.map(o => (
          <DraggableCard
            key={o.id}
            opinion={o}
            hasSticker={hasSticker(o.id)}
            stickerCount={getStickerCount(o.id)}
            onToggle={onToggle}
          />
        ))}
        {opinions.length === 0 && (
          <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 'auto' }}>여기에 카드를 드래그하세요</p>
        )}
      </div>
    </div>
  )
}

function DroppableUnassigned({ opinions, hasSticker, getStickerCount, onToggle }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })

  return (
    <div ref={setNodeRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', minHeight: '80px', background: isOver ? '#f0f4ff' : 'transparent', borderRadius: '10px', padding: '4px', transition: 'background 0.2s' }}>
      {opinions.map(o => (
        <DraggableCard
          key={o.id}
          opinion={o}
          hasSticker={hasSticker(o.id)}
          stickerCount={getStickerCount(o.id)}
          onToggle={onToggle}
        />
      ))}
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
  const [groups, setGroups] = useState({})
  const [cardGroups, setCardGroups] = useState({})
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

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

  function addGroup(questionId) {
    const id = Date.now()
    setGroups(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), { id, title: '' }]
    }))
  }

  function deleteGroup(questionId, groupId) {
    setGroups(prev => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter(g => g.id !== groupId)
    }))
    setCardGroups(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(cardId => {
        if (updated[cardId] === groupId) delete updated[cardId]
      })
      return updated
    })
  }

  function updateGroupTitle(questionId, groupId, title) {
    setGroups(prev => ({
      ...prev,
      [questionId]: (prev[questionId] || []).map(g => g.id === groupId ? { ...g, title } : g)
    }))
  }

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const overId = over.id
    if (overId === 'unassigned') {
      setCardGroups(prev => { const u = { ...prev }; delete u[active.id]; return u })
    } else if (String(overId).startsWith('group-')) {
      const groupId = parseInt(overId.replace('group-', ''))
      setCardGroups(prev => ({ ...prev, [active.id]: groupId }))
    }
  }

  function getStickerCount(opinionId) {
    return stickers.filter(s => s.opinion_id === opinionId).length
  }

  function hasSticker(opinionId) {
    return stickers.some(s => s.opinion_id === opinionId && s.member_id === currentMember?.id)
  }

  function getActiveOpinion() {
    return opinions.find(o => o.id === activeId)
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
        {questions.map((q, qi) => {
          const qOpinions = opinions.filter(o => o.question_id === q.id)
          const qGroups = groups[q.id] || []
          const unassigned = qOpinions.filter(o => !cardGroups[o.id] || !qGroups.find(g => g.id === cardGroups[o.id]))

          return (
            <div key={q.id} style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ background: '#6366f1', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>Q{qi + 1}</span>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{q.content}</h2>
              </div>

              <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>📌 미분류 카드</p>
                  <DroppableUnassigned
                    opinions={unassigned}
                    hasSticker={hasSticker}
                    getStickerCount={getStickerCount}
                    onToggle={toggleSticker}
                  />
                </div>

                {qGroups.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    {qGroups.map(group => (
                      <DroppableGroup
                        key={group.id}
                        group={group}
                        opinions={qOpinions.filter(o => cardGroups[o.id] === group.id)}
                        hasSticker={hasSticker}
                        getStickerCount={getStickerCount}
                        onToggle={toggleSticker}
                        onTitleChange={(gid, title) => updateGroupTitle(q.id, gid, title)}
                        onDelete={(gid) => deleteGroup(q.id, gid)}
                      />
                    ))}
                  </div>
                )}

                <DragOverlay>
                  {activeId && getActiveOpinion() ? (
                    <div style={{ background: '#fffde7', border: '1px solid #f9e44a', borderRadius: '10px', padding: '12px', width: '150px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'rotate(3deg)' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>{getActiveOpinion().content}</p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              <button
                onClick={() => addGroup(q.id)}
                style={{ background: '#f8f7ff', color: '#6366f1', border: '2px dashed #c7d2fe', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '16px', width: '100%' }}
              >
                + 그룹 추가
              </button>

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
          )
        })}
      </div>
    </div>
  )
}