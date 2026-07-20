// mock*.js 파일들이 공통으로 쓰는 localStorage 기반 저장소 헬퍼

export const readMockList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

export const writeMockList = (key, list) => {
  localStorage.setItem(key, JSON.stringify(list))
}

export const readMockObject = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key))
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export const writeMockObject = (key, obj) => {
  localStorage.setItem(key, JSON.stringify(obj))
}

export const nextMockId = (list) =>
  list.reduce((max, item) => Math.max(max, item.id), 0) + 1

// 실제 백엔드 에러 응답 형태({ errorCode, message })와 동일한 모양으로 던져서
// 기존 catch(err => err.response?.data?.message) 처리 로직을 그대로 재사용하면서
// errorCode가 필요한 곳에서는 err.response.data.errorCode로 꺼내 쓸 수 있게 한다.
export const mockApiError = (message, errorCode = 'BAD_REQUEST') => {
  const error = new Error(message)
  error.response = { data: { errorCode, message } }
  return error
}
