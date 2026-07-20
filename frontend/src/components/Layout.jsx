import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'
import { getCart } from '../api/cart'
import { subscribeCartChanged } from '../api/cartEvents'

export default function Layout() {
  const { isLoggedIn, user, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (!isLoggedIn) {
      setCartCount(0)
      return
    }

    const refreshCartCount = () => {
      getCart()
        .then((res) => setCartCount(res.data.items.length))
        .catch(() => setCartCount(0))
    }

    refreshCartCount()
    // 다른 페이지(장바구니/상품상세)에서 담기·수량변경·삭제가 일어나면 바로 반영
    return subscribeCartChanged(refreshCartCount)
  }, [isLoggedIn, location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setUser(null)
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b" style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
              책 먹는 사자
            </span>
            <span className="divider-dot" />
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link to="/" style={{ color: 'var(--color-ink)' }}>도서</Link>
            <Link to="/cart" className="relative" style={{ color: 'var(--color-ink)' }}>
              장바구니
              {cartCount > 0 && (
                <span
                  className="absolute -top-2 -right-3 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center"
                  style={{ background: 'var(--color-clay)' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <>
                <Link to="/cards" style={{ color: 'var(--color-ink)' }}>내 카드</Link>
                <Link to="/payments" style={{ color: 'var(--color-ink)' }}>결제내역</Link>
                <span style={{ color: 'var(--color-gold)' }}>{user?.name}님</span>
                <button onClick={handleLogout} className="text-sm underline">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: 'var(--color-ink)' }}>로그인</Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 rounded text-white text-sm"
                  style={{ background: 'var(--color-clay)' }}
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-xs" style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink)' }}>
      </footer>
    </div>
  )
}
