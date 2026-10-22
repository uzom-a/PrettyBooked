import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Conversation() {
  const { otherId } = useParams()
  const { user } = useAuth()
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    async function load() {
      const [{ data: other }, { data: msgs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', otherId).single(),
        supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true }),
      ])
      setOtherUser(other)
      setMessages(msgs || [])
      markIncomingRead()
    }
    load()

    async function markIncomingRead() {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherId)
        .eq('is_read', false)
    }

    const channel = supabase
      .channel(`conversation:${user.id}:${otherId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new
        if (msg.sender_id !== otherId) return
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
        markIncomingRead()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [otherId, user.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setSending(true)
    setText('')
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [...prev, { id: tempId, sender_id: user.id, receiver_id: otherId, content, created_at: new Date().toISOString(), is_read: false, pending: true }])
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: otherId, content })
      .select()
      .single()
    setMessages((prev) => {
      if (error) return prev.filter((m) => m.id !== tempId)
      return prev.map((m) => m.id === tempId ? data : m)
    })
    setSending(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/messages" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
        <div className="w-10 h-10 rounded-full bg-blush-200 flex items-center justify-center text-blush-600 font-bold">
          {otherUser?.full_name?.[0]}
        </div>
        <p className="font-semibold text-gray-900">{otherUser?.full_name}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            No messages yet. Say hi! 👋
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                isMine
                  ? 'bg-black text-white rounded-br-sm'
                  : 'bg-white border border-blush-100 text-gray-800 rounded-bl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-blush-200 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blush-300 bg-white"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
