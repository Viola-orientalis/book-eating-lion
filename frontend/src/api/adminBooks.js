import apiClient from './client'
import {
  mockGetAdminBooks,
  mockCreateAdminBook,
  mockUpdateAdminBook,
  mockDeleteAdminBook,
} from './mockAdminBooks'

const buildBookFormData = (bookData, imageFile) => {
  const formData = new FormData()
  formData.append('bookData', new Blob([JSON.stringify(bookData)], { type: 'application/json' }))
  if (imageFile) {
    formData.append('image', imageFile)
  }
  return formData
}

export const getAdminBooks = async () => {
  try {
    return await apiClient.get('/api/admin/books')
  } catch {
    return mockGetAdminBooks()
  }
}

export const createAdminBook = async (bookData, imageFile) => {
  try {
    return await apiClient.post('/api/admin/books', buildBookFormData(bookData, imageFile), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  } catch {
    return mockCreateAdminBook(bookData, imageFile)
  }
}

export const updateAdminBook = async (bookId, bookData, imageFile) => {
  try {
    return await apiClient.put(`/api/admin/books/${bookId}`, buildBookFormData(bookData, imageFile), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  } catch {
    return mockUpdateAdminBook(bookId, bookData, imageFile)
  }
}

export const deleteAdminBook = async (bookId) => {
  try {
    return await apiClient.delete(`/api/admin/books/${bookId}`)
  } catch {
    return mockDeleteAdminBook(bookId)
  }
}
