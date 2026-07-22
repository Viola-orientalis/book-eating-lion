import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api/auth'

const GENDER_OPTIONS = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: '', label: '선택 안 함' },
]

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    age: '',
    gender: '',
  })
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
      await signup({
        ...form,
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-1" style={{ color: 'var(--color-ink)' }}>
          회원가입
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          책 먹는 사자와 함께 첫 페이지를 넘겨보세요
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl pl-7 pr-5 py-7 sm:pl-9 sm:pr-8 sm:py-9"
        style={{
          background: 'var(--color-paper-soft)',
          boxShadow: '0 1px 2px rgba(30,42,56,0.06), 0 20px 44px -22px rgba(30,42,56,0.4)',
        }}
      >
        {/* 시그니처: 하드커버 책등을 연상시키는 세로 스트립 */}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-4 border-0 p-0 m-0">
            <legend className="text-xs font-semibold tracking-wider" style={{ color: 'var(--color-gold)' }}>
              계정 정보
            </legend>
            <Field label="아이디" name="username" value={form.username} onChange={handleChange} />
            <Field
              label="비밀번호"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
            />
          </fieldset>

          <div className="border-t" style={{ borderColor: 'var(--color-line)' }} />

          <fieldset className="flex flex-col gap-4 border-0 p-0 m-0">
            <legend className="text-xs font-semibold tracking-wider" style={{ color: 'var(--color-gold)' }}>
              개인 정보
            </legend>
            <Field label="이름" name="name" value={form.name} onChange={handleChange} />

            <div className="flex flex-wrap gap-4">
              <div className="w-24 shrink-0">
                <Field
                  label="나이"
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  required={false}
                />
              </div>

              <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
                <span className="text-sm" style={{ color: 'var(--color-ink)' }}>
                  성별
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 h-full">
                  {GENDER_OPTIONS.map((opt) => (
                    <label
                      key={opt.label}
                      className="flex items-center gap-1.5 text-sm cursor-pointer"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={opt.value}
                        checked={form.gender === opt.value}
                        onChange={handleChange}
                        style={{ accentColor: 'var(--color-clay)' }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 py-3 rounded-lg text-white font-medium tracking-wide transition-[filter] duration-150 enabled:hover:brightness-90 disabled:opacity-50"
            style={{ background: 'var(--color-clay)' }}
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>
      </div>

      <p className="text-sm mt-6 text-center">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="underline" style={{ color: 'var(--color-gold)' }}>
          로그인
        </Link>
      </p>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text', required = true, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span style={{ color: 'var(--color-ink)' }}>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="border rounded-lg px-3 py-2.5 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-clay)] focus:border-[var(--color-clay)]"
        style={{ borderColor: 'var(--color-line)', background: '#ffffff' }}
        {...rest}
      />
    </label>
  )
}
