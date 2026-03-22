/**
 * DiceGame.jsx
 * Socket events: emit rollDice → receive diceResult
 */
import { useState, useEffect } from 'react'

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export default function DiceGame({ socket, onClose }) {
  const [bet,     setBet]    = useState(10)
  const [result,  setResult] = useState(null)
  const [rolling, setRoll]   = useState(false)

  useEffect(() => {
    if (!socket) return
    const fn = r => { setResult(r); setRoll(false) }
    socket.on('diceResult', fn)
    return () => socket.off('diceResult', fn)
  }, [socket])

  function roll() {
    if (rolling) return
    setRoll(true)
    setResult(null)
    socket?.emit('rollDice', { bet })
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#111827', borderRadius: 18, maxWidth: 320, width: '100%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.5)', textAlign: 'center' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #374151' }}>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1rem', color: '#fff' }}>🎲 Dice — Roll 4-6 to win!</span>
          <button onClick={onClose} style={{ background: '#374151', border: 'none', color: '#9ca3af', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            <i className="fi fi-sr-cross-small" />
          </button>
        </div>

        <div style={{ padding: '24px 20px' }}>
          {/* Dice face */}
          <div style={{ fontSize: 80, marginBottom: 16, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: rolling ? 'spin .3s linear infinite' : 'none' }}>
            {result ? DICE_FACES[result.roll - 1] : DICE_FACES[Math.floor(Math.random() * 6)]}
          </div>

          {/* Result */}
          {result && (
            <div style={{ background: result.won ? '#064e3b' : '#450a0a', border: `1px solid ${result.won ? '#22c55e' : '#ef4444'}`, borderRadius: 9, padding: '10px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: result.won ? '#22c55e' : '#ef4444' }}>
                {result.won ? `🎉 Rolled ${result.roll}! Won ${result.payout} Gold!` : `Rolled ${result.roll}. Lost ${result.bet} Gold.`}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Payout: 2x on roll 4, 5, or 6</div>
            </div>
          )}

          {/* Bet selector */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            {[5, 10, 25, 50, 100, 500].map(b => (
              <button key={b} onClick={() => setBet(b)} style={{ padding: '6px 12px', borderRadius: 7, border: `1.5px solid ${bet === b ? '#7c3aed' : '#374151'}`, background: bet === b ? '#7c3aed22' : '#1f2937', color: bet === b ? '#a78bfa' : '#9ca3af', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                {b}
              </button>
            ))}
          </div>

          <button
            onClick={roll}
            disabled={rolling}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: rolling ? '#374151' : 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff', fontWeight: 800, cursor: rolling ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontFamily: 'Outfit,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {rolling
              ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />Rolling...</>
              : `🎲 Roll Dice — Bet ${bet} Gold`}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
