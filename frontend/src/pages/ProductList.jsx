import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getBooks } from '../api/books'
import ProductCard from '../components/ProductCard'

const PAGE_SIZE = 12
const CATEGORIES = ['전체', '소설', '에세이', '역사', '인문', '과학', '자기계발', '미술']

export default function ProductList() {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('q') || ''
  const [products, setProducts] = useState([])
  const [pageInfo, setPageInfo] = useState(null)
  const [page, setPage] = useState(0)
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  // 검색어는 이미 불러온(카테고리 필터 반영된) 목록 안에서 제목 기준으로만 좁힌다
  const visibleProducts = keyword
    ? products.filter((p) => p.title.includes(keyword))
    : products

  useEffect(() => {
    setLoading(true)
    getBooks({ category, page, size: PAGE_SIZE })
      .then((res) => {
        setProducts(res.data.content)
        setPageInfo(res.data.pageInfo)
      })
      .finally(() => setLoading(false))
  }, [category, page])

  const handleCategorySelect = (value) => {
    setCategory(value)
    setPage(0)
  }

  // 마지막 페이지처럼 항목이 적게 채워진 페이지에서도 그리드 행 수가 유지되도록
  // 빈 자리를 보이지 않는 자리표시자로 채운다. 이렇게 하면 아래 버튼 위치가
  // 페이지마다 위아래로 흔들리지 않는다.
  const placeholderCount = loading ? 0 : Math.max(0, PAGE_SIZE - visibleProducts.length)

  return (
    <div className="pt-6">
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => {
          const value = c === '전체' ? '' : c
          const active = category === value
          return (
            <button
              key={c}
              onClick={() => handleCategorySelect(value)}
              className="px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150"
              style={
                active
                  ? { background: 'var(--color-clay)', borderColor: 'var(--color-clay)', color: '#fff' }
                  : { background: 'var(--color-paper-soft)', borderColor: 'var(--color-line)', color: 'var(--color-ink)' }
              }
            >
              {c}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>불러오는 중...</p>
      ) : visibleProducts.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          {keyword && products.length > 0 ? '검색 결과가 없습니다' : '해당 카테고리에 도서가 없습니다'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {visibleProducts.map((p) => (
              <ProductCard key={p.bookId} product={p} />
            ))}
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <div key={`placeholder-${i}`} aria-hidden="true" className="invisible">
                <div className="aspect-[3/4] rounded-lg" />
                <div className="p-3">
                  <div className="h-4" />
                  <div className="h-4 mt-1" />
                </div>
              </div>
            ))}
          </div>

          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageInfo.currentPage <= 0}
                className="px-3 py-1.5 rounded border disabled:opacity-40"
                style={{ borderColor: 'var(--color-line)' }}
              >
                이전
              </button>
              <span style={{ color: 'var(--color-clay)' }}>
                {pageInfo.currentPage + 1} / {pageInfo.totalPages} 페이지
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))}
                disabled={pageInfo.currentPage >= pageInfo.totalPages - 1}
                className="px-3 py-1.5 rounded border disabled:opacity-40"
                style={{ borderColor: 'var(--color-line)' }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
