export const formatDateTime = (dateString) => {
  const d = new Date(dateString)
  // dateString이 undefined/null이거나 파싱 불가능한 값이면 Invalid Date가 되어
  // getFullYear() 등이 전부 NaN을 반환한다 — "NaN.NaN.NaN NaN:NaN" 같은 깨진 문자열이
  // 그대로 노출되지 않도록 방어한다.
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
