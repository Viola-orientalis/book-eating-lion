import { useEffect, useState } from 'react'
import { getBooks } from '../api/books'
import ProductCard from '../components/ProductCard'

const PAGE_SIZE = 12

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [pageInfo, setPageInfo] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getBooks({ page, size: PAGE_SIZE })
      .then((res) => {
        setProducts(res.data.content)
        setPageInfo(res.data.pageInfo)
      })
      .finally(() => setLoading(false))
  }, [page])

  // 마지막 페이지처럼 항목이 적게 채워진 페이지에서도 그리드 행 수가 유지되도록
  // 빈 자리를 보이지 않는 자리표시자로 채운다. 이렇게 하면 아래 버튼 위치가
  // 페이지마다 위아래로 흔들리지 않는다.
  const placeholderCount = loading ? 0 : Math.max(0, PAGE_SIZE - products.length)

  return (
    <div className="pt-6">
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>불러오는 중...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {products.map((p) => (
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
