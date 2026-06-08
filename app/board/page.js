'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'

function DrawingCanvas({ onSave, onClose }) {
  const canvasRef = React.useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(4)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fffde7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  function startDraw(e) {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
  }

  function draw(e) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  function endDraw(e) {
    e.preventDefault()
    setIsDrawing(false)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fffde7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function saveDrawing() {
    const canvas = canvasRef.current
    canvas.toBlob(blob => onSave(blob), 'image/png')
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', width: '90%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>🎨 그림 그리기</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: '#64748b' }}>색상:</label>
          {['#000000', '#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6'].map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: color === c ? '3px solid #6366f1' : '2px solid #e2e8f0', cursor: 'pointer' }} />
          ))}
          <label style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>굵기:</label>
          {[2, 4, 8].map(w => (
            <button key={w} onClick={() => setLineWidth(w)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: lineWidth === w ? '2px solid #6366f1' : '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: `${w * 2}px`, height: `${w * 2}px`, borderRadius: '50%', background: '#334155' }} />
            </button>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          width={460}
          height={300}
          style={{ border: '1px solid #e2e8f0', borderRadius: '8px', width: '100%', touchAction: 'none', cursor: 'crosshair', background: '#fffde7' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
          <button onClick={clearCanvas} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>지우기</button>
          <button onClick={saveDrawing} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>등록하기</button>
        </div>
      </div>
    </div>
  )
}

function DraggableCard({ opinion, hasSticker, stickerCount, onToggle, isAdmin, onDelete, currentMemberId }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opinion.id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `card-${opinion.id}` })
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.3 : 1,
    background: isOver ? '#fef9c3' : '#fffde7',
    border: isOver ? '2px solid #f59e0b' : '1px solid #f9e44a',
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
    <div ref={setDropRef} style={{ position: 'relative' }}>
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {opinion.video_url
        ? <video src={opinion.video_url} controls style={{ width: '100%', borderRadius: '6px', marginBottom: '8px' }} onPointerDown={e => e.stopPropagation()} />
        : opinion.image_url
          ? <img src={opinion.image_url} alt="그림" style={{ width: '100%', borderRadius: '6px', marginBottom: '8px', pointerEvents: 'none' }} />
          : <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155', lineHeight: '1.5', pointerEvents: 'none' }}>{opinion.content}</p>
      }
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!isAdmin && <small style={{ color: '#94a3b8', fontSize: '11px', pointerEvents: 'none' }}>{opinion.ksl_members?.name}</small>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          {(isAdmin || opinion.member_id === currentMemberId) && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(opinion) }}
              onPointerDown={e => e.stopPropagation()}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '14px', padding: '2px' }}
            >🗑️</button>
          )}
        <button
          onClick={e => { e.stopPropagation(); onToggle(opinion.id) }}
          onPointerDown={e => e.stopPropagation()}
          style={{ background: hasSticker ? '#fef3c7' : '#f1f5f9', border: hasSticker ? '1px solid #fcd34d' : '1px solid #e2e8f0', borderRadius: '20px', padding: '3px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: hasSticker ? '#d97706' : '#94a3b8' }}
        >
          {hasSticker ? '⭐' : '☆'} {stickerCount}
        </button>
        </div>
      </div>
    </div>
    </div>
  )
}

function DroppableGroup({ group, opinions, hasSticker, getStickerCount, onToggle, onTitleChange, onDelete, isAdmin, onDeleteOpinion, currentMemberId }) {
  const { setNodeRef, isOver } = useDroppable({ id: `group-${group.id}` })
  return (
    <div style={{ background: isOver ? '#f0f4ff' : '#f8fafc', border: `2px dashed ${isOver ? '#6366f1' : '#cbd5e1'}`, borderRadius: '14px', padding: '16px', minHeight: '160px', flex: '1 1 250px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span></span>
        {isAdmin && <button onClick={() => onDelete(group.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '16px', marginLeft: '8px', flexShrink: 0 }}>✕</button>}
      </div>
      <div ref={setNodeRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '80px' }}>
        {opinions.map(o => (
          <DraggableCard key={o.id} opinion={o} hasSticker={hasSticker(o.id)} stickerCount={getStickerCount(o.id)} onToggle={onToggle} isAdmin={isAdmin} onDelete={onDeleteOpinion} currentMemberId={currentMemberId} />
        ))}
        {opinions.length === 0 && <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 'auto' }}>여기에 카드를 드래그하세요</p>}
      </div>
    </div>
  )
}

function DroppableUnassigned({ opinions, hasSticker, getStickerCount, onToggle, isAdmin, onDelete, currentMemberId }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })
  return (
    <div ref={setNodeRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', minHeight: '80px', background: isOver ? '#f0f4ff' : 'transparent', borderRadius: '10px', padding: '4px', transition: 'background 0.2s' }}>
      {opinions.map(o => (
        <DraggableCard key={o.id} opinion={o} hasSticker={hasSticker(o.id)} stickerCount={getStickerCount(o.id)} onToggle={onToggle} isAdmin={isAdmin} onDelete={onDelete} currentMemberId={currentMemberId} />
      ))}
    </div>
  )
}

export default function BoardPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [step, setStep] = useState('select')
  const [view, setView] = useState('board')
  const [members, setMembers] = useState([])
  const [currentMember, setCurrentMember] = useState(null)
  const [questions, setQuestions] = useState([])
  const [opinions, setOpinions] = useState([])
  const [stickers, setStickers] = useState([])
  const [newOpinion, setNewOpinion] = useState({})
  const [groups, setGroups] = useState({})
  const [cardGroups, setCardGroups] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [teams, setTeams] = useState([])
  const [selectedTeamAdmin, setSelectedTeamAdmin] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showDrawing, setShowDrawing] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'admin') {
      setIsAdmin(true)
      setStep('board')
      fetchAllData()
    } else {
      fetchMembers()
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('realtime-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ksl_opinions' }, () => {
        fetchAllOpinions()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ksl_stickers' }, () => {
        fetchAllStickers()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ksl_groups' }, () => {
        fetchGroupData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ksl_card_groups' }, () => {
        fetchGroupData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchAllData() {
    const { data: t } = await supabase.from('ksl_teams').select('*')
    const { data: q } = await supabase.from('ksl_questions').select('*').order('team_id').order('order_num')
    const { data: o } = await supabase.from('ksl_opinions').select('*, ksl_members(name)').order('created_at')
    const { data: s } = await supabase.from('ksl_stickers').select('*')
    const { data: g } = await supabase.from('ksl_groups').select('*').order('order_num')
    const { data: cg } = await supabase.from('ksl_card_groups').select('*')
    setTeams(t || [])
    setQuestions(q || [])
    setOpinions(o || [])
    setStickers(s || [])

    const groupsMap = {}
    ;(g || []).forEach(group => {
      if (!groupsMap[group.question_id]) groupsMap[group.question_id] = []
      groupsMap[group.question_id].push(group)
    })
    setGroups(groupsMap)

    const cardGroupsMap = {}
    ;(cg || []).forEach(cg => { cardGroupsMap[cg.opinion_id] = cg.group_id })
    setCardGroups(cardGroupsMap)
  }

  async function fetchAllOpinions() {
    const { data } = await supabase.from('ksl_opinions').select('*, ksl_members(name)').order('created_at')
    setOpinions(data || [])
  }

  async function fetchAllStickers() {
    const { data } = await supabase.from('ksl_stickers').select('*')
    setStickers(data || [])
  }

  async function fetchGroupData() {
    const { data: g } = await supabase.from('ksl_groups').select('*').order('order_num')
    const { data: cg } = await supabase.from('ksl_card_groups').select('*')
    const groupsMap = {}
    ;(g || []).forEach(group => {
      if (!groupsMap[group.question_id]) groupsMap[group.question_id] = []
      groupsMap[group.question_id].push(group)
    })
    setGroups(groupsMap)
    const cardGroupsMap = {}
    ;(cg || []).forEach(cg => { cardGroupsMap[cg.opinion_id] = cg.group_id })
    setCardGroups(cardGroupsMap)
  }

  async function fetchMembers() {
    const { data } = await supabase.from('ksl_members').select('*, ksl_teams(name)').order('name')
    setMembers(data || [])
  }

  async function fetchQuestions() {
    const { data } = await supabase.from('ksl_questions').select('*').eq('team_id', currentMember.team_id).order('order_num')
    setQuestions(data || [])
  }

  async function getQuestionIds() {
    const { data } = await supabase.from('ksl_questions').select('id').eq('team_id', currentMember.team_id)
    return (data || []).map(q => q.id)
  }

  async function fetchOpinions() {
    const ids = await getQuestionIds()
    if (ids.length === 0) return
    const { data } = await supabase.from('ksl_opinions').select('*, ksl_members(name)').in('question_id', ids).order('created_at')
    setOpinions(data || [])
  }

  async function fetchStickers() {
    const { data } = await supabase.from('ksl_stickers').select('*')
    setStickers(data || [])
  }

  useEffect(() => {
    if (currentMember && !isAdmin) {
      fetchQuestions()
      fetchOpinions()
      fetchStickers()
      fetchGroupData()
    }
  }, [currentMember])

  async function deleteOpinion(opinion) {
    if (!confirm('이 카드를 삭제할까요?')) return
    if (opinion.image_url) {
      const fileName = opinion.image_url.split('/').pop()
      await supabase.storage.from('drawings').remove([fileName])
    }
    if (opinion.video_url) {
      const fileName = opinion.video_url.split('/').pop()
      await supabase.storage.from('videos').remove([fileName])
    }
    await supabase.from('ksl_card_groups').delete().eq('opinion_id', opinion.id)
    await supabase.from('ksl_stickers').delete().eq('opinion_id', opinion.id)
    await supabase.from('ksl_opinions').delete().eq('id', opinion.id)
    isAdmin ? fetchAllData() : fetchOpinions()
  }

  async function submitVideo(questionId, file) {
    if (file.size > 100 * 1024 * 1024) {
      alert('영상 파일이 너무 커요! 100MB 이하만 가능해요.')
      return
    }
    const fileName = `video-${Date.now()}.${file.name.split('.').pop()}`
    const { data, error } = await supabase.storage.from('videos').upload(fileName, file, { contentType: file.type })
    if (error) { console.error(error); return }
    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName)
    await supabase.from('ksl_opinions').insert([{
      question_id: questionId,
      member_id: currentMember.id,
      content: '(영상)',
      video_url: urlData.publicUrl
    }])
    fetchOpinions()
  }

  async function submitDrawing(questionId, blob) {
    const fileName = `drawing-${Date.now()}.png`
    const { data, error } = await supabase.storage.from('drawings').upload(fileName, blob, { contentType: 'image/png' })
    if (error) { console.error(error); return }
    const { data: urlData } = supabase.storage.from('drawings').getPublicUrl(fileName)
    await supabase.from('ksl_opinions').insert([{
      question_id: questionId,
      member_id: currentMember.id,
      content: '(그림)',
      image_url: urlData.publicUrl
    }])
    setShowDrawing(null)
    fetchOpinions()
  }

  async function submitOpinion(questionId) {
    const content = newOpinion[questionId]
    if (!content?.trim()) return
    await supabase.from('ksl_opinions').insert([{ question_id: questionId, member_id: currentMember.id, content: content.trim() }])
    setNewOpinion(prev => ({ ...prev, [questionId]: '' }))
    fetchOpinions()
  }

  async function toggleSticker(opinionId) {
    if (!currentMember) return
    const exists = stickers.find(s => s.opinion_id === opinionId && s.member_id === currentMember.id)
    if (exists) {
      await supabase.from('ksl_stickers').delete().eq('id', exists.id)
    } else {
      await supabase.from('ksl_stickers').insert([{ opinion_id: opinionId, member_id: currentMember.id }])
    }
    isAdmin ? fetchAllData() : fetchStickers()
  }

  async function addGroup(questionId) {
    const { data } = await supabase.from('ksl_groups').insert([{ question_id: questionId, title: '', order_num: (groups[questionId] || []).length }]).select()
    if (data && data[0]) {
      setGroups(prev => ({ ...prev, [questionId]: [...(prev[questionId] || []), data[0]] }))
    }
  }

  async function deleteGroup(questionId, groupId) {
    await supabase.from('ksl_card_groups').delete().eq('group_id', groupId)
    await supabase.from('ksl_groups').delete().eq('id', groupId)
    setGroups(prev => ({ ...prev, [questionId]: (prev[questionId] || []).filter(g => g.id !== groupId) }))
    setCardGroups(prev => { const u = { ...prev }; Object.keys(u).forEach(k => { if (u[k] === groupId) delete u[k] }); return u })
  }

  async function updateGroupTitle(questionId, groupId, title) {
    await supabase.from('ksl_groups').update({ title }).eq('id', groupId)
    setGroups(prev => ({ ...prev, [questionId]: (prev[questionId] || []).map(g => g.id === groupId ? { ...g, title } : g) }))
  }

  function handleDragStart(event) { setActiveId(event.active.id) }

  async function handleDragEnd(event) {
    const { active, over } = event
    
    setActiveId(null)
    if (!over) return
    const overId = over.id

    if (overId === 'unassigned') {
      await supabase.from('ksl_card_groups').delete().eq('opinion_id', active.id)
      setCardGroups(prev => { const u = { ...prev }; delete u[active.id]; return u })
    } else if (String(overId).startsWith('group-')) {
      const groupId = parseInt(overId.replace('group-', ''))
      await supabase.from('ksl_card_groups').upsert([{ opinion_id: active.id, group_id: groupId }], { onConflict: 'opinion_id' })
      setCardGroups(prev => ({ ...prev, [active.id]: groupId }))
    } else if (String(overId).startsWith('card-')) {
      const targetOpinionId = parseInt(overId.replace('card-', ''))
      if (targetOpinionId === active.id) return

      const activeOpinion = opinions.find(o => o.id === active.id)
      const targetOpinion = opinions.find(o => o.id === targetOpinionId)
      if (!activeOpinion || !targetOpinion) return

      const targetGroupId = cardGroups[targetOpinionId]

      if (targetGroupId) {
        // 타겟 카드가 이미 그룹에 있으면 그 그룹에 넣기
        await supabase.from('ksl_card_groups').upsert([{ opinion_id: active.id, group_id: targetGroupId }], { onConflict: 'opinion_id' })
        setCardGroups(prev => ({ ...prev, [active.id]: targetGroupId }))
      } else {
        // 둘 다 그룹이 없으면 새 그룹 생성
        const questionId = activeOpinion.question_id
        const { data } = await supabase.from('ksl_groups').insert([{ question_id: questionId, title: '', order_num: (groups[questionId] || []).length }]).select()
        if (data && data[0]) {
          const newGroupId = data[0].id
          await supabase.from('ksl_card_groups').upsert([{ opinion_id: active.id, group_id: newGroupId }], { onConflict: 'opinion_id' })
          await supabase.from('ksl_card_groups').upsert([{ opinion_id: targetOpinionId, group_id: newGroupId }], { onConflict: 'opinion_id' })
          setGroups(prev => ({ ...prev, [questionId]: [...(prev[questionId] || []), data[0]] }))
          setCardGroups(prev => ({ ...prev, [active.id]: newGroupId, [targetOpinionId]: newGroupId }))
        }
      }
    }
  }

  function getStickerCount(opinionId) { return stickers.filter(s => s.opinion_id === opinionId).length }
  function hasSticker(opinionId) { return stickers.some(s => s.opinion_id === opinionId && s.member_id === currentMember?.id) }
  function getActiveOpinion() { return opinions.find(o => o.id === activeId) }

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
              <button key={m.id} onClick={() => { setCurrentMember(m); setStep('board') }}
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

  const renderQuestion = (q, qi) => {
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
            <DroppableUnassigned opinions={unassigned} hasSticker={hasSticker} getStickerCount={getStickerCount} onToggle={toggleSticker} isAdmin={isAdmin} onDelete={deleteOpinion} currentMemberId={currentMember?.id} />
          </div>
          {qGroups.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              {qGroups.map(group => (
                <DroppableGroup key={group.id} group={group} opinions={qOpinions.filter(o => cardGroups[o.id] === group.id)} hasSticker={hasSticker} getStickerCount={getStickerCount} onToggle={toggleSticker} onTitleChange={(gid, title) => updateGroupTitle(q.id, gid, title)} onDelete={(gid) => deleteGroup(q.id, gid)} isAdmin={isAdmin} onDeleteOpinion={deleteOpinion} currentMemberId={currentMember?.id} />
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

        

        {!isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input placeholder="의견을 입력하세요" value={newOpinion[q.id] || ''} onChange={e => setNewOpinion(prev => ({ ...prev, [q.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && submitOpinion(q.id)} style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
              <button onClick={() => submitOpinion(q.id)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>등록</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowDrawing(q.id)} style={{ flex: 1, background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>🎨 그림으로 작성</button>
              <label style={{ flex: 1, background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>
                📹 영상 올리기
                <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) submitVideo(q.id, e.target.files[0]) }} />
              </label>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderResult = () => {
    const teamList = isAdmin ? teams : []
    const qList = isAdmin
      ? questions.filter(q => q.team_id === selectedTeamAdmin)
      : questions

    return (
      <div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {teams.map(team => (
              <button key={team.id} onClick={() => setSelectedTeamAdmin(team.id)}
                style={{ padding: '10px 24px', borderRadius: '20px', border: 'none', background: selectedTeamAdmin === team.id ? '#6366f1' : '#e2e8f0', color: selectedTeamAdmin === team.id ? 'white' : '#64748b', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
              >{team.name}</button>
            ))}
          </div>
        )}
        {qList.map((q, qi) => {
          const qOpinions = opinions.filter(o => o.question_id === q.id)
          const qGroups = groups[q.id] || []
          const unassigned = qOpinions.filter(o => !cardGroups[o.id] || !qGroups.find(g => g.id === cardGroups[o.id]))
          return (
            <div key={q.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ background: '#6366f1', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>Q{qi + 1}</span>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{q.content}</h2>
              </div>
              {qGroups.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  {qGroups.map(group => {
                    const gOpinions = qOpinions.filter(o => cardGroups[o.id] === group.id)
                    return (
                      <div key={group.id} style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '14px', padding: '16px', flex: '1 1 200px' }}>
                        <p style={{ fontWeight: '700', fontSize: '14px', color: '#6366f1', marginBottom: '12px' }}></p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {gOpinions.map(o => (
                            <div key={o.id} style={{ background: '#fffde7', border: '1px solid #f9e44a', borderRadius: '10px', padding: '10px', width: '140px', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#334155' }}>{o.content}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <small style={{ color: '#94a3b8', fontSize: '11px' }}>{o.ksl_members?.name}</small>
                                <span style={{ fontSize: '12px', color: '#d97706' }}>⭐ {getStickerCount(o.id)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {unassigned.length > 0 && (
                <div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>미분류</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {unassigned.map(o => (
                      <div key={o.id} style={{ background: '#fffde7', border: '1px solid #f9e44a', borderRadius: '10px', padding: '10px', width: '140px', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#334155' }}>{o.content}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <small style={{ color: '#94a3b8', fontSize: '11px' }}>{o.ksl_members?.name}</small>
                          <span style={{ fontSize: '12px', color: '#d97706' }}>⭐ {getStickerCount(o.id)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Noto Sans KR', sans-serif" }}>
      {showDrawing && <DrawingCanvas onSave={(blob) => submitDrawing(showDrawing, blob)} onClose={() => setShowDrawing(null)} />}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>✋</span>
          <span style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b' }}>실습 나눔 보드</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAdmin && (
            <button onClick={() => window.print()} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
              🖨️ 인쇄
            </button>
          )}
          <span style={{ background: isAdmin ? '#fef3c7' : '#ede9fe', color: isAdmin ? '#d97706' : '#6366f1', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
            {isAdmin ? '👩‍🏫 강사 모드' : `${currentMember?.name} · ${currentMember?.ksl_teams?.name}`}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px' }}>
        {view === 'result' ? renderResult() : isAdmin ? (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {teams.map(team => (
                <button key={team.id} onClick={() => setSelectedTeamAdmin(team.id)}
                  style={{ padding: '10px 24px', borderRadius: '20px', border: 'none', background: selectedTeamAdmin === team.id ? '#6366f1' : '#e2e8f0', color: selectedTeamAdmin === team.id ? 'white' : '#64748b', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
                >{team.name}</button>
              ))}
            </div>
            {selectedTeamAdmin
              ? questions.filter(q => q.team_id === selectedTeamAdmin).map((q, qi) => renderQuestion(q, qi))
              : <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>위에서 조를 선택하세요</p>
            }
          </div>
        ) : (
          <div>
            {questions.length > 0 && currentQuestionIndex < questions.length && renderQuestion(questions[currentQuestionIndex], currentQuestionIndex)}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {currentQuestionIndex > 0 && (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                  >
                    ← 이전
                  </button>
                )}
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>{currentQuestionIndex + 1} / {questions.length}</span>
              </div>
              {(() => {
                if (!questions[currentQuestionIndex]) return null
                const qId = questions[currentQuestionIndex].id
                const qOpinions = opinions.filter(o => o.question_id === qId)
                const myOpinion = qOpinions.filter(o => o.member_id === currentMember.id).length > 0
                const teamMembers = members.filter(m => m.team_id === currentMember.team_id)
                const allDone = teamMembers.every(m => qOpinions.some(o => o.member_id === m.id))
                const doneCount = teamMembers.filter(m => qOpinions.some(o => o.member_id === m.id)).length

                return currentQuestionIndex < questions.length - 1 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: allDone ? '#27ae60' : '#94a3b8' }}>
                      {doneCount}/{teamMembers.length}명 작성 완료
                    </span>
                    <button
                      onClick={() => {
                        if (!myOpinion) { alert('내 의견을 먼저 작성해주세요!'); return }
                        if (!allDone) { alert(`아직 ${teamMembers.length - doneCount}명이 작성 중이에요. 기다려주세요!`); return }
                        setCurrentQuestionIndex(prev => prev + 1)
                      }}
                      style={{ background: allDone && myOpinion ? '#6366f1' : '#cbd5e1', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                    >
                      다음 →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: allDone ? '#27ae60' : '#94a3b8' }}>
                      {doneCount}/{teamMembers.length}명 작성 완료
                    </span>
                    <button
                      onClick={() => {
                        if (!myOpinion) { alert('내 의견을 먼저 작성해주세요!'); return }
                        if (!allDone) { alert(`아직 ${teamMembers.length - doneCount}명이 작성 중이에요. 기다려주세요!`); return }
                        alert('모든 질문에 답변 완료했어요! 수고하셨습니다 😊')
                      }}
                      style={{ background: allDone && myOpinion ? '#27ae60' : '#cbd5e1', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}
                    >
                      완료 ✓
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      <style>{`@media print { button { display: none !important; } }`}</style>
    </div>
  )
}