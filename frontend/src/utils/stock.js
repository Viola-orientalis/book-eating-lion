export const LOW_STOCK_THRESHOLD = 3

export const isOutOfStock = (stock) => (stock ?? 0) <= 0
export const isLowStock = (stock) => stock > 0 && stock <= LOW_STOCK_THRESHOLD
