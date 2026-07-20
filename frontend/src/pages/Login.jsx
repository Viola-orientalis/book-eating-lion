import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ loginId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form)
      // 로그인 응답은 평탄한 형태: { accessToken, memberId, name, role }
      const { accessToken, ...member } = res.data
      localStorage.setItem('accessToken', accessToken)
      setUser(member)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '아이디 또는 비밀번호를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--color-ink)' }}>
        로그인
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-clay)' }}>
        다시 오셨네요, 반갑습니다
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>아이디</span>
          <input
            name="loginId"
            value={form.loginId}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>비밀번호</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
          />
        </label>

        {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-2.5 rounded text-white font-medium disabled:opacity-50"
          style={{ background: 'var(--color-ink)' }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="text-sm mt-6 text-center">
        계정이 없으신가요?{' '}
        <Link to="/signup" className="underline" style={{ color: 'var(--color-gold)' }}>
          회원가입
        </Link>
      </p>
    </div>
  )
}
