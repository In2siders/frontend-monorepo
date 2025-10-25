import React, { useState } from 'react'
import '@repo/common/chat-style.css'

const sampleChats = [
  { id: 1, name: 'Alice', last: 'Hey — you free later?' },
  { id: 2, name: 'Dev Team', last: 'Sprint planning at 10' },
  { id: 3, name: 'Bob', last: 'Sent the files.' },
]

const sampleMessages = [
  { id: 1, from: 'them', text: 'Hola! Bienvenido al chat.' },
  { id: 2, from: 'you', text: 'Gracias — esto es un placeholder.' },
  { id: 3, from: 'them', text: 'Perfecto. Aquí irán los mensajes reales.' },
]

const ChatPage = () => {
  const [activeChat] = useState(sampleChats[0])
  const [messages] = useState(sampleMessages)

  return (
    <div className="container chat-layout">
      <aside className="left">
        <button className="chat-global-btn">global chat</button>
        <h3 className="chat-column-title">Chats</h3>
        <ul className="chat-list">
          {sampleChats.map((c) => (
            <li key={c.id} className={`chat-item ${c.id === activeChat.id ? 'active' : ''}`}>
              <div className="chat-item-name">{c.name}</div>
              <div className="chat-item-last">{c.last}</div>
            </li>
          ))}        
        <div className="left-footer">
          <div className="mini-user">user</div>
          <div className="mini-actions">•••</div>
        </div>
        </ul>

      </aside>

      <main className="right">
        <div className="chat-window">
          <div className="chat-window-header">{activeChat.name}</div>
          <div className="messages" role="log" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`message ${m.from === 'you' ? 'you' : 'them'}`}>
                {m.text}
              </div>
            ))}
          </div>

          <form className="chat-input-form" onSubmit={(e) => e.preventDefault()}>
            <input type="text" className="message-input" placeholder="Type your message..." />
            <button type="submit" className="send-button">Send</button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ChatPage