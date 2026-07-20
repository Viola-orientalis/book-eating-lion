// 장바구니는 더 이상 전역 Context가 아니라 각 페이지가 api/cart.js를 직접 호출해서 관리한다.
// Layout의 장바구니 개수 배지처럼 다른 화면의 변경을 즉시 반영해야 하는 곳을 위한
// 최소한의 이벤트 버스. 장바구니를 변경하는 곳(담기/수량변경/삭제)에서 notifyCartChanged()를 호출한다.
const listeners = new Set()

export const notifyCartChanged = () => {
  listeners.forEach((listener) => listener())
}

export const subscribeCartChanged = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
