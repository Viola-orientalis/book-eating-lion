import { useEffect, useState } from 'react'
import { getProducts } from '../api/products'
import ProductCard from '../components/ProductCard'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts()
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-6">
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
