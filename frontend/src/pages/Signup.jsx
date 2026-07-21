import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api/auth'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // REQ-01: 일반 사용자로만 가입. 관리자 권한 부여 UI는 두지 않음(CloudTrail/IAM으로 대체)
      await signup(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--color-ink)' }}>
        회원가입
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-clay)' }}>
        책 먹는 사자와 함께 첫 페이지를 넘겨보세요
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="아이디" name="username" value={form.username} onChange={handleChange} />
        <Field label="비밀번호" name="password" type="password" value={form.password} onChange={handleChange} />
        <Field label="이름" name="name" value={form.name} onChange={handleChange} />

        {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-2.5 rounded text-white font-medium disabled:opacity-50"
          style={{ background: 'var(--color-ink)' }}
        >
          {loading ? '가입 중...' : '가입하기'}
        </button>
      </form>

      <p className="text-sm mt-6 text-center">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="underline" style={{ color: 'var(--color-gold)' }}>
          로그인
        </Link>
      </p>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text' }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span style={{ color: 'var(--color-ink)' }}>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        className="border rounded px-3 py-2 outline-none focus:ring-2"
        style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
      />
    </label>
  )
}
