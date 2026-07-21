export const STATUS_LABELS = {
  APPROVED: '결제완료',
  CANCELLED: '취소됨',
  PAYMENT_FAILED: '결제실패',
  PENDING_PAYMENT: '결제대기',
  PAID: '결제완료',
}

export const getStatusLabel = (status) => STATUS_LABELS[status] ?? status
