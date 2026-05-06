'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function sendOtp() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) setError(error.message)
    else setStep('otp')
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) setError(error.message)
    else window.location.href = '/'
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="uv-logo" style={{ fontSize: 32, marginBottom: 8 }}>UrbanVault</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>La plataforma premium para México y LATAM</div>
        </div>

        <div className="uv-card" style={{ padding: 32, borderRadius: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>
            {step === 'phone' ? 'Bienvenido 👋' : 'Verificar número'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            {step === 'phone' ? 'Ingresa tu número para recibir un código' : `Código enviado a ${phone}`}
          </div>

          {step === 'phone' ? (
            <>
              <input
                className="uv-input"
                type="tel"
                placeholder="+52 55 1234 5678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ marginBottom: 16 }}
              />
              <button className="uv-btn-primary" style={{ width: '100%' }} onClick={sendOtp} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
            </>
          ) : (
            <>
              <input
                className="uv-input"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                style={{ marginBottom: 16, textAlign: 'center', letterSpacing: 12, fontSize: 24 }}
                maxLength={6}
              />
              <button className="uv-btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={verifyOtp} disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
              <button className="uv-btn-ghost" style={{ width: '100%' }} onClick={() => setStep('phone')}>
                Cambiar número
              </button>
            </>
          )}

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--accent-secondary)' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
            Al continuar aceptas nuestros términos de uso y política de privacidad.<br/>
            No se requiere contraseña.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          UrbanVault Chats © 2024 • México 🌮
        </div>
      </div>
    </div>
  )
}
