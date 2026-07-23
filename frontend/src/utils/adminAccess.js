export const ADMIN_ROLE = 'ADMIN'

const DEV_ADMIN_MODE_KEY = 'devAdminMode'
const DEV_ADMIN_EVENT = 'bookmeogeun-dev-admin-changed'

export const isDevAdminModeEnabled = () => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEV_ADMIN_MODE_KEY) === 'true'
}

// 실제 role과 무관하게 관리자 화면을 미리 확인하기 위한 개발 편의 오버라이드.
// devAdminMode가 켜져 있으면 role이 무엇이든 관리자로 취급한다.
export const isAdminUser = (user) => user?.role === ADMIN_ROLE || isDevAdminModeEnabled()

export const subscribeDevAdminChanged = (callback) => {
  window.addEventListener(DEV_ADMIN_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(DEV_ADMIN_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

// 개발 전용 헬퍼: 브라우저 콘솔에서 window.enableDevAdmin() / window.disableDevAdmin()으로
// 관리자 메뉴·라우트를 즉시 켜고 끌 수 있다. main.jsx에서 개발 모드일 때만 설치된다.
// TODO: 배포 전 제거 필요 — 실제 role 기반 권한 체크로만 동작해야 하는 프로덕션에는 남아있으면 안 된다.
export const installDevAdminTools = () => {
  if (typeof window === 'undefined') return

  window.enableDevAdmin = () => {
    localStorage.setItem(DEV_ADMIN_MODE_KEY, 'true')
    window.dispatchEvent(new Event(DEV_ADMIN_EVENT))
    console.log('[devAdmin] 관리자 모드로 전환되었습니다. 메뉴/라우트가 즉시 갱신됩니다.')
  }

  window.disableDevAdmin = () => {
    localStorage.removeItem(DEV_ADMIN_MODE_KEY)
    window.dispatchEvent(new Event(DEV_ADMIN_EVENT))
    console.log('[devAdmin] 관리자 모드가 해제되었습니다.')
  }

  console.log(
    '[devAdmin] 개발용 도구가 등록되었습니다. window.enableDevAdmin(), window.disableDevAdmin() 을 콘솔에서 사용할 수 있습니다.'
  )
}
