import { Eye, EyeOff, LockKeyhole, Mail, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi, saveAuthSession } from '../../services/tslApi'
import Home from '../Home'
import '../auth/Auth.css'

type LoginLocationState = { email?: string } | null

export default function CounselLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state ?? null) as LoginLocationState
  const [showPassword, setShowPassword] = useState(false)
  const [closed, setClosed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: locationState?.email ?? '',
    password: '',
  })

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
        portal: 'counsel',
      })

      if (!response.success || !response.data) {
        setError(response.message ?? 'Unable to sign in to the counsel portal.')
        return
      }

      if (response.data.role !== 'counsel') {
        setError('This account is not enabled for the Counsel Portal.')
        return
      }

      saveAuthSession(response.data)

      if (response.data.mustResetPassword) {
        navigate('/counsel/reset-password', {
          state: {
            email: response.data.email,
            token: response.data.token,
          },
        })
        return
      }

      navigate('/counsel/dashboard')
    } catch {
      setError('Mock API is not reachable. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Home />
      {!closed && createPortal(
        <div className="auth-overlay">
          <form className="auth-overlay__card" onSubmit={submitLogin} noValidate>
            {/* Gold header */}
            <div className="auth-overlay__header">
              <button
                type="button"
                className="auth-overlay__close"
                aria-label="Close"
                onClick={() => setClosed(true)}
              >
                <X size={18} />
              </button>
              <p className="auth-overlay__header-title">Welcome Back to the TSL Counsel Portal</p>
              <p className="auth-overlay__header-sub">Sign in to review assigned legal requests and manage your availability.</p>
            </div>

            {/* Body */}
            <div className="auth-overlay__body">
              <label>
                <span>Email Address</span>
                <div className="auth-page__field">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label>
                <span>Password</span>
                <div className="auth-page__field">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {error && <p className="auth-page__error" role="alert">{error}</p>}

              <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                <Link to="/forgot-password?role=counsel" style={{ fontSize: '13px', color: '#c79a3b', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-page__btn--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}
