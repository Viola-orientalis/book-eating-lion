import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const { showError } = useToast()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(form)
      // 로그인 응답은 평탄한 형태: { accessToken, memberId, name, role }
      const { accessToken, ...member } = res.data
      localStorage.setItem('accessToken', accessToken)
      setUser(member)
      navigate('/')
    } catch (err) {
      showError(getErrorMessage(err, '아이디 또는 비밀번호를 확인해주세요.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--color-ink)' }}>
          로그인
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          다시 오셨네요, 반갑습니다
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl pl-7 pr-5 py-7 sm:pl-9 sm:pr-8 sm:py-9"
        style={{
          background: 'var(--color-paper-soft)',
          boxShadow: '0 1px 2px rgba(30,42,56,0.06), 0 20px 44px -22px rgba(30,42,56,0.4)',
        }}
      >
        {/* 시그니처: 하드커버 책등을 연상시키는 세로 스트립 (Signup.jsx와 동일) */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-3"
          style={{
            background:
              'linear-gradient(90deg, var(--color-clay), color-mix(in srgb, var(--color-clay) 78%, black))',
          }}
        />
        <span
          aria-hidden="true"
          className="absolute left-3 top-0 bottom-0 w-px"
          style={{ background: 'rgba(0,0,0,0.18)' }}
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="아이디" name="username" value={form.username} onChange={handleChange} />
          <Field
            label="비밀번호"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-lg text-white font-medium tracking-wide transition-[filter] duration-150 enabled:hover:brightness-90 disabled:opacity-50"
            style={{ background: 'var(--color-clay)' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>

      <p className="text-sm mt-6 text-center">
        계정이 없으신가요?{' '}
        <Link to="/signup" className="underline" style={{ color: 'var(--color-gold)' }}>
          회원가입
        </Link>
      </p>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text' }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: 'var(--color-ink)' }}>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        className="border rounded-lg px-3 py-2.5 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-clay)] focus:border-[var(--color-clay)]"
        style={{ borderColor: 'var(--color-line)', background: '#ffffff' }}
      />
    </label>
  )
}
