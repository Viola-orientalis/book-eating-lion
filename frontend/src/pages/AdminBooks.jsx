import { useEffect, useState } from 'react'
import { getAdminBooks, createAdminBook, updateAdminBook, deleteAdminBook } from '../api/adminBooks'
import ListSkeleton from '../components/skeletons/ListSkeleton'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'

const CATEGORIES = ['소설', '에세이', '역사', '인문', '과학', '자기계발', '미술']

function FormField({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span style={{ color: 'var(--color-ink)' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="border rounded-lg px-3 py-2 text-sm outline-none"
        style={{ borderColor: 'var(--color-line)' }}
      />
    </label>
  )
}

function AdminBookForm({ initialBook, submitting, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    title: initialBook?.title ?? '',
    author: initialBook?.author ?? '',
    publisher: initialBook?.publisher ?? '',
    isbn: initialBook?.isbn ?? '',
    price: initialBook?.price ?? '',
    stock: initialBook?.stock ?? '',
    category: initialBook?.category ?? CATEGORIES[0],
    description: initialBook?.description ?? '',
  }))
  const [imageFile, setImageFile] = useState(null)

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(
      {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      },
      imageFile
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border shadow-sm p-5 mb-6 flex flex-col gap-3"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
    >
      <h2 className="font-medium" style={{ color: 'var(--color-ink)' }}>
        {initialBook ? '도서 수정' : '도서 등록'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="제목" value={form.title} onChange={handleChange('title')} required />
        <FormField label="저자" value={form.author} onChange={handleChange('author')} required />
        <FormField label="출판사" value={form.publisher} onChange={handleChange('publisher')} />
        <FormField label="ISBN" value={form.isbn} onChange={handleChange('isbn')} />
        <FormField label="가격" type="number" value={form.price} onChange={handleChange('price')} required />
        <FormField label="재고" type="number" value={form.stock} onChange={handleChange('stock')} required />

        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--color-ink)' }}>카테고리</span>
          <select
            value={form.category}
            onChange={handleChange('category')}
            className="border rounded-lg px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--color-line)' }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--color-ink)' }}>표지 이미지</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--color-ink)' }}>설명</span>
        <textarea
          rows={3}
          value={form.description}
          onChange={handleChange('description')}
          className="border rounded-lg px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--color-line)' }}
        />
      </label>

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--color-ink)' }}
        >
          {submitting ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 py-2 rounded-lg border text-sm disabled:opacity-50"
          style={{ borderColor: 'var(--color-line)', color: 'var(--color-clay)' }}
        >
          취소
        </button>
      </div>
    </form>
  )
}

export default function AdminBooks() {
  const { showError } = useToast()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState(null) // null | 'create' | 'edit'
  const [editingBook, setEditingBook] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminBooks()
      .then((res) => setBooks(res.data.content))
      .catch((err) => showError(getErrorMessage(err, '도서 목록을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [])

  const openCreateForm = () => {
    setEditingBook(null)
    setFormMode('create')
  }

  const openEditForm = (book) => {
    setEditingBook(book)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingBook(null)
  }

  const handleSubmit = async (bookData, imageFile) => {
    setSubmitting(true)
    try {
      if (formMode === 'edit') {
        await updateAdminBook(editingBook.bookId, bookData, imageFile)
      } else {
        await createAdminBook(bookData, imageFile)
      }
      closeForm()
      load()
    } catch (err) {
      showError(getErrorMessage(err, '도서 저장에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAdminBook(deleteTarget.bookId)
      setDeleteTarget(null)
      load()
    } catch (err) {
      showError(getErrorMessage(err, '삭제에 실패했습니다.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>
          도서 관리
        </h1>
        {!formMode && (
          <button
            onClick={openCreateForm}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: 'var(--color-ink)' }}
          >
            도서 등록
          </button>
        )}
      </div>

      {formMode && (
        <AdminBookForm
          initialBook={editingBook}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : books.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          등록된 도서가 없습니다
        </p>
      ) : (
        <div>
          {books.map((book) => {
            const stopped = book.status === 'STOPPED'
            const badgeColor = stopped ? 'var(--color-danger)' : 'var(--color-forest)'
            return (
              <div
                key={book.bookId}
                className="rounded-xl border shadow-sm hover:shadow-md transition-shadow px-4 py-4 mb-3 flex items-center justify-between"
                style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
              >
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
                    {book.title}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-clay)' }}>
                    {book.author} · {book.price?.toLocaleString()}원 · 재고 {book.stock}
                  </p>
                  <span
                    className="inline-block mt-2 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      color: badgeColor,
                      background: `color-mix(in srgb, ${badgeColor} 15%, white)`,
                    }}
                  >
                    {stopped ? '판매중지' : '판매중'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditForm(book)}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--color-line)]/40"
                    style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setDeleteTarget(book)}
                    disabled={stopped}
                    className="text-sm underline transition-colors disabled:opacity-50 text-[var(--color-danger)] hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <Modal onClose={() => !deleting && setDeleteTarget(null)}>
          <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
            «{deleteTarget.title}»의 판매를 중지하시겠습니까?
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="flex-1 py-2 rounded-lg border text-sm disabled:opacity-50"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-clay)' }}
            >
              닫기
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--color-danger)' }}
            >
              {deleting ? '처리 중...' : '판매중지'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
