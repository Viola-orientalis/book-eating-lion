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

// axios 에러와 동일한 모양(err.response.data.message)으로 던져서
// 기존 catch(err => err.response?.data?.message) 처리 로직을 그대로 재사용
export const mockApiError = (message) => {
  const error = new Error(message)
  error.response = { data: { message } }
  return error
}
