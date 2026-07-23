import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'
import { getCart } from '../api/cart'
import { subscribeCartChanged } from '../api/cartEvents'
import { isAdminUser, subscribeDevAdminChanged } from '../utils/adminAccess'

export default function Layout() {
  const { isLoggedIn, user, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [, forceUpdateOnDevAdminChange] = useState(0)

  // devAdminMode는 localStorage 값이라 리렌더를 유발하지 않으므로, 켜고 끌 때마다
  // 강제로 다시 렌더링해서 관리자 메뉴 표시 여부를 즉시 반영한다.
  useEffect(
    () => subscribeDevAdminChanged(() => forceUpdateOnDevAdminChange((n) => n + 1)),
    []
  )

  const showAdminMenu = isAdminUser(user)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/')
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    navigate('/')
  }

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    if (!isLoggedIn) {
      setCartCount(0)
      return
    }

    const refreshCartCount = () => {
      getCart()
        .then((res) => setCartCount(res.data.length))
        .catch(() => setCartCount(0))
    }

    refreshCartCount()
    // 다른 페이지(장바구니/상품상세)에서 담기·수량변경·삭제가 일어나면 바로 반영
    return subscribeCartChanged(refreshCartCount)
  }, [isLoggedIn, location.pathname])

  const handleLogout = async () => {
    setMenuOpen(false)
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
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="도서를 검색해보세요"
                  className="w-32 sm:w-48 text-sm font-normal rounded-full border px-3.5 py-1.5 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-clay)] focus:border-[var(--color-clay)]"
                  style={{ borderColor: 'var(--color-line)', background: '#ffffff', color: 'var(--color-ink)' }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="검색어 지우기"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs leading-none text-gray-400 hover:text-gray-600 transition-colors duration-150"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="text-sm px-1"
                style={{ color: 'var(--color-clay)' }}
                aria-label="검색"
              >
                검색
              </button>
            </form>

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
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 text-sm font-medium"
                  style={{ color: 'var(--color-gold)' }}
                >
                  {user?.name}님
                  <span className="text-xs">▾</span>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-44 rounded-lg border overflow-hidden z-20"
                    style={{
                      borderColor: 'var(--color-line)',
                      background: 'var(--color-paper-soft)',
                      boxShadow: '0 1px 2px rgba(30,42,56,0.06), 0 14px 28px -14px rgba(30,42,56,0.35)',
                    }}
                  >
                    <Link
                      to="/payments"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-[var(--color-line)]/40"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      결제내역
                    </Link>
                    <Link
                      to="/cards"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-[var(--color-line)]/40"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      내 카드 관리
                    </Link>
                    <Link
                      to="/statements"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-[var(--color-line)]/40"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      명세서 다운로드
                    </Link>

                    {showAdminMenu && (
                      <>
                        <div className="border-t" style={{ borderColor: 'var(--color-line)' }} />
                        <Link
                          to="/admin/books"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm hover:bg-[var(--color-line)]/40"
                          style={{ color: 'var(--color-ink)' }}
                        >
                          도서 관리
                        </Link>
                        <Link
                          to="/admin/orders"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm hover:bg-[var(--color-line)]/40"
                          style={{ color: 'var(--color-ink)' }}
                        >
                          전체 주문 조회
                        </Link>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm hover:bg-[var(--color-line)]/40"
                          style={{ color: 'var(--color-ink)' }}
                        >
                          통계 대시보드
                        </Link>
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm border-t hover:bg-[var(--color-line)]/40"
                      style={{ color: 'var(--color-ink)', borderColor: 'var(--color-line)' }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
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
