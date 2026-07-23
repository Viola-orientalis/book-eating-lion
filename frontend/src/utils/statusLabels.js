export const STATUS_LABELS = {
  APPROVED: '결제완료',
  CANCELLED: '취소됨',
  PAYMENT_FAILED: '결제실패',
  PENDING_PAYMENT: '결제대기',
  PAID: '결제완료',
}

export const getStatusLabel = (status) => STATUS_LABELS[status] ?? status

// 상태 배지 색상 — 결제내역/관리자 주문 조회에서 공통으로 사용
export const STATUS_BADGE_COLOR = {
  APPROVED: 'var(--color-forest)',
  PAID: 'var(--color-forest)',
  CANCELLED: 'var(--color-ink)',
  PAYMENT_FAILED: 'var(--color-danger)',
  PENDING_PAYMENT: 'var(--color-gold)',
}
