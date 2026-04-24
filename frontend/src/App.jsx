import { useEffect, useMemo, useRef, useState } from 'react'
import './fonts.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const INITIAL_GROUP_ITEMS = 10
const LOAD_MORE_ITEMS = 10

function formatCurrency(value) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return '-'
  return `৳${numberValue.toFixed(2)}`
}

function toTitleCase(value) {
  return String(value || '')
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function normalizeUtilityName(value) {
  return String(value || '').toLowerCase().replace(/[\s_-]+/g, '')
}

function getUtilityIcon(utilities, source) {
  const normalizedSource = normalizeUtilityName(source)
  const utility = utilities.find((item) => normalizeUtilityName(item?.name) === normalizedSource)
  return utility?.icon || ''
}

function UtilityLogo({ utilities, source, className = 'h-5 w-auto object-contain' }) {
  const [failed, setFailed] = useState(false)
  const icon = getUtilityIcon(utilities, source)

  if (!icon || failed) {
    return <span className="text-xs font-semibold text-base-content/70">{toTitleCase(source)}</span>
  }

  return (
    <img
      src={icon}
      alt={source}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

function getBestChoiceLabel(utilities, bestChoice) {
  if (!bestChoice) {
    return <span className="capitalize">Pick Nearest</span>
  }

  return <UtilityLogo utilities={utilities} source={bestChoice} className="h-6 w-auto object-contain" />
}

function getHighestDiscount(products) {
  const values = products.map((item) => Number(item?.data?.discountAmountValue || 0))
  return values.length ? Math.max(...values) : 0
}

function getCatalogSections(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.sections)) {
    return payload.sections
  }

  return []
}

function getGroupKey(sectionCategory, groupName) {
  return `${sectionCategory}::${groupName}`
}

function getComparablePriceOffers(products) {
  if (!Array.isArray(products)) return []

  return products
    .filter((item) => Number.isFinite(Number(item?.data?.priceValue)))
    .map((item) => ({
      source: item.source,
      priceValue: Number(item?.data?.priceValue || 0)
    }))
    .sort((a, b) => a.priceValue - b.priceValue)
}

function ProductCard({ product, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className="group card h-[205px] w-full min-w-0 overflow-hidden bg-base-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95"
    >
      {/* Image */}
      <figure className="relative flex h-32 items-center justify-center overflow-hidden bg-base-200 p-2">
        {product.productImage ? (
          <img
            src={product.productImage}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center text-xs text-base-content/40">Loading...</div>
        )}
      </figure>

      {/* Info */}
      <div className="flex h-[77px] flex-col justify-between p-3">
        <h3 className="line-clamp-2 text-xs font-semibold text-base-content">{product.name}</h3>
        <p className="mt-1 text-xs text-base-content/60">{product.unit || '-'}</p>
      </div>
    </button>
  )
}

function SkeletonLoader() {
  return (
    <div className="space-y-3">
      {/* Image Skeleton */}
      <div className="flex h-32 animate-pulse items-center justify-center rounded-lg border border-base-300/40 bg-base-200"></div>
      
      {/* Info Cards Skeleton */}
      <div className="flex flex-row gap-2 sm:flex-col">
        <div className="flex-1 rounded-lg border border-base-300/50 bg-base-200 p-3">
          <div className="h-2 w-10 animate-pulse rounded bg-base-300/70"></div>
          <div className="mt-2 h-3 w-16 animate-pulse rounded bg-base-300/70"></div>
        </div>
        <div className="flex-1 rounded-lg border border-base-300/50 bg-base-200 p-3">
          <div className="h-2 w-14 animate-pulse rounded bg-base-300/70"></div>
          <div className="mt-2 h-3 w-20 animate-pulse rounded bg-base-300/70"></div>
        </div>
      </div>
    </div>
  )
}

function ProductDetailsModal({ product, utilities, loading, error, onClose, onAddToCart }) {
  if (!product) return null

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm transition-all duration-300 sm:items-center sm:p-4" onClick={onClose}>
        <div className="w-full max-w-2xl rounded-t-3xl bg-base-100 shadow-2xl sm:rounded-2xl sm:max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
          {/* Header with Close Button */}
          <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-base-300 bg-base-100 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Product</p>
              <h3 className="mt-1 truncate text-lg font-bold text-base-content sm:text-xl">{product.name}</h3>
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-circle btn-ghost flex-shrink-0" 
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          
          {/* Skeleton Content */}
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
            <div className="sm:w-36 sm:flex-shrink-0">
              <SkeletonLoader />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="h-16 animate-pulse rounded-lg border border-base-300/50 bg-base-200"></div>
                <div className="h-16 animate-pulse rounded-lg border border-base-300/50 bg-base-200"></div>
              </div>
              <div className="overflow-hidden rounded-lg border border-base-300/50 bg-base-200/40">
                <div className="h-8 animate-pulse border-b border-base-300/40 bg-base-200"></div>
                <div className="space-y-2 p-2">
                  <div className="h-7 animate-pulse rounded bg-base-200"></div>
                  <div className="h-7 animate-pulse rounded bg-base-200"></div>
                  <div className="h-7 animate-pulse rounded bg-base-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm transition-all duration-300 sm:items-center sm:p-4" onClick={onClose}>
        <div className="w-full max-w-xl rounded-t-3xl bg-base-100 p-5 shadow-2xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
          <h3 className="text-lg font-bold text-base-content">{product.name}</h3>
          <p className="mt-3 text-sm text-error">{error}</p>
          <div className="mt-4">
            <button type="button" className="btn btn-sm btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  if (!product?.details) return null

  const comparableProducts = Array.isArray(product.details.products)
    ? product.details.products.filter((item) => Number.isFinite(Number(item?.data?.priceValue)))
    : []

  const lowestPriceValue = comparableProducts[0]?.data?.priceValue
  const highestPriceValue = comparableProducts[comparableProducts.length - 1]?.data?.priceValue
  const savingsValue = Number.isFinite(Number(lowestPriceValue)) && Number.isFinite(Number(highestPriceValue))
    ? Math.max(0, Number(highestPriceValue) - Number(lowestPriceValue))
    : 0

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm transition-all duration-300 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[95vh] max-w-2xl overflow-y-auto rounded-t-3xl bg-base-100 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-base-300 bg-base-100 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Product</p>
            <h3 className="mt-1 truncate text-lg font-bold text-base-content sm:text-xl">{product.details.productName}</h3>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-circle btn-ghost flex-shrink-0" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Main Content - Flex Layout */}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
          {/* Left: Image & Info */}
          <div className="flex flex-col gap-3 sm:w-36 sm:flex-shrink-0">
            <figure className="flex h-32 items-center justify-center rounded-lg bg-base-200 border-0 sm:h-40 sm:border sm:border-base-300/60">
              {product.details.productImage ? (
                <img
                  src={product.details.productImage}
                  alt={product.details.productName}
                  className="h-full w-full object-contain p-1"
                />
              ) : null}
            </figure>
            
            {/* Info Cards */}
            <div className="flex flex-row gap-2 sm:flex-col">
              <div className="flex-1 rounded-lg border border-base-300 bg-base-200 p-3">
                <p className="text-xs font-bold text-base-content/60">Unit</p>
                <p className="text-sm font-semibold text-base-content">{product.details.unit}</p>
              </div>
              <div className="flex-1 rounded-lg border border-primary bg-primary/10 p-3">
                <p className="text-xs font-bold text-primary">Best Choice</p>
                <div className="mt-1 flex items-center gap-2">
                  {getBestChoiceLabel(utilities, product.details['best-choice'])}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
              <div>
                <p className="text-[11px] font-semibold text-primary/80">Best Price</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(lowestPriceValue)}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm btn-circle"
                onClick={() => onAddToCart(product)}
                title="Add best price to cart"
                aria-label="Add best price to cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l1 5m0 0h13l-1.5 7h-10.5m-1-7h14m-12 11a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v4m-2-2h4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Price Table & Stats */}
          <div className="flex-1 min-w-0">
            {/* Summary Stats */}
            <div className="mb-4 grid gap-2 grid-cols-2">
              <div className="rounded-lg border border-success/30 bg-success/10 p-3">
                <p className="text-xs font-bold text-success/80">Lowest Price</p>
                <p className="mt-1 text-sm font-bold text-success">{formatCurrency(lowestPriceValue)}</p>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                <p className="text-xs font-bold text-warning/80">You Save</p>
                <p className="mt-1 text-sm font-bold text-warning">{formatCurrency(savingsValue)}</p>
              </div>
            </div>

            {/* Price Comparison Table */}
            <div className="overflow-x-auto rounded-lg border border-base-300">
              <table className="table table-xs sm:table-sm">
                <thead className="bg-base-200">
                  <tr>
                    <th className="text-xs">Shop</th>
                    <th className="text-xs text-right">Price</th>
                    <th className="text-xs text-right">Old</th>
                    <th className="text-xs text-right">Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {product.details.products.map((shopProduct, idx) => (
                    <tr key={shopProduct.source} className={idx % 2 === 0 ? '' : 'bg-base-200/40'}>
                      <td>
                        <UtilityLogo utilities={utilities} source={shopProduct.source} className="h-4 w-auto object-contain" />
                      </td>
                      <td className="text-right font-bold text-primary">{formatCurrency(shopProduct?.data?.priceValue)}</td>
                      <td className="text-right text-xs text-base-content/50 line-through">{formatCurrency(shopProduct?.data?.oldPriceValue)}</td>
                      <td className="text-right font-semibold text-success">{formatCurrency(shopProduct?.data?.discountAmountValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <div className="border-t border-base-300 bg-base-200 p-4 sm:hidden">
          <button
            type="button"
            className="btn btn-primary w-full btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function CartDrawer({ open, cartItems, utilities, onClose, onRemoveItem, onClear }) {
  if (!open) return null

  const totals = cartItems.reduce(
    (acc, item) => {
      acc.best += Number(item.bestPrice || 0)
      acc.highest += Number(item.highestPrice || 0)
      acc.savings += Number(item.savings || 0)
      return acc
    },
    { best: 0, highest: 0, savings: 0 }
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-md border-l border-slate-700 bg-slate-900 text-base-content shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-4">
            <div>
              <h3 className="text-lg font-bold">Cart Insights</h3>
              <p className="text-xs text-base-content/60">Best-price picks across stores</p>
            </div>
            <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-slate-700 px-4 py-3 text-center">
            <div className="rounded-lg bg-success/10 p-2">
              <p className="text-[10px] font-semibold text-success/80">Best Total</p>
              <p className="text-xs font-bold text-success">{formatCurrency(totals.best)}</p>
            </div>
            <div className="rounded-lg bg-error/10 p-2">
              <p className="text-[10px] font-semibold text-error/80">Highest Total</p>
              <p className="text-xs font-bold text-error">{formatCurrency(totals.highest)}</p>
            </div>
            <div className="rounded-lg bg-warning/10 p-2">
              <p className="text-[10px] font-semibold text-warning/80">Total Save</p>
              <p className="text-xs font-bold text-warning">{formatCurrency(totals.savings)}</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cartItems.length ? (
              cartItems.map((item) => (
                <article key={item.route} className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
                  <div className="flex gap-3">
                    <img src={item.productImage} alt={item.name} className="h-16 w-16 rounded-md object-contain bg-slate-700/70 p-1" />
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-semibold">{item.name}</h4>
                      <p className="mt-1 text-xs text-base-content/60">{item.unit || '-'}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-base-content/70">Best:</span>
                        <UtilityLogo utilities={utilities} source={item.bestStore} className="h-4 w-auto object-contain" />
                        <span className="font-bold text-success">{formatCurrency(item.bestPrice)}</span>
                      </div>
                      <p className="mt-1 text-xs text-base-content/70">
                        Highest: {formatCurrency(item.highestPrice)} | Save: <span className="font-bold text-warning">{formatCurrency(item.savings)}</span>
                      </p>
                    </div>
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => onRemoveItem(item.route)}>Remove</button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/50 p-6 text-center">
                <p className="text-sm text-base-content/70">Cart is empty. Add products from popup using best price.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 p-4">
            <button type="button" className="btn btn-outline btn-warning btn-sm w-full" onClick={onClear} disabled={!cartItems.length}>
              Clear Cart
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function DockNavigation({ onHome, onOpenCategory, onOpenCart, onOpenSearch, activeItem, cartCount = 0 }) {
  const handleHomeClick = () => {
    if (typeof onHome === 'function') {
      onHome()
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  return (
    <div
      className="dock dock-lg fixed bottom-0 left-0 right-0 z-40 grid w-full grid-cols-4 items-center justify-items-center border-t border-slate-700 bg-slate-900/95 backdrop-blur-md md:!hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      <button className={activeItem === 'home' ? 'dock-active' : ''} onClick={handleHomeClick}>
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt">
            <polyline points="1 11 12 2 23 11" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2" />
            <path d="m5,13v7c0,1.105.895,2,2,2h10c1.105,0,2-.895,2-2v-7" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2" />
            <line x1="12" y1="22" x2="12" y2="18" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2" />
          </g>
        </svg>
        <span className="dock-label">Home</span>
      </button>

      <button className={activeItem === 'category' ? 'dock-active' : ''} onClick={onOpenCategory}>
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <span className="dock-label">Category</span>
      </button>

      <button className={activeItem === 'cart' ? 'dock-active' : ''} onClick={onOpenCart}>
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l1 5m0 0h13l-1.5 7h-10.5m-1-7h14m-12 11a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2" />
        </svg>
        <span className="dock-label">Cart{cartCount > 0 ? ` (${cartCount})` : ''}</span>
      </button>

      <button className={activeItem === 'search' ? 'dock-active' : ''} onClick={onOpenSearch}>
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="dock-label">Search</span>
      </button>
    </div>
  )
}

function App() {
  const [catalog, setCatalog] = useState([])
  const [utilities, setUtilities] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [activePage, setActivePage] = useState('home')
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsCache, setDetailsCache] = useState({})
  const [showMobileDock, setShowMobileDock] = useState(false)
  const [groupVisibleCounts, setGroupVisibleCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSectionIndex, setActiveSectionIndex] = useState(null)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null)
  const [selectedView, setSelectedView] = useState(null)
  const menuRef = useRef(null)
  const contentRef = useRef(null)
  const searchInputRef = useRef(null)

  const activeSection = activeSectionIndex === null ? null : catalog[activeSectionIndex]
  const activeGroups = activeSection?.groups || []

  const allCatalogProducts = useMemo(
    () => catalog.flatMap((section) => section.groups.flatMap((group) => group.products.map((product) => ({
      ...product,
      category: section.category,
      groupName: group.name
    })))),
    [catalog]
  )

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const searchResults = useMemo(
    () => normalizedSearch
      ? allCatalogProducts.filter((product) => String(product.name || '').toLowerCase().includes(normalizedSearch))
      : [],
    [allCatalogProducts, normalizedSearch]
  )

  const visibleCatalog = useMemo(() => {
    if (!selectedView) return catalog

    const section = catalog[selectedView.sectionIndex]
    const group = section?.groups?.[selectedView.groupIndex]
    if (!section || !group) return catalog

    return [
      {
        ...section,
        groups: [group]
      }
    ]
  }, [catalog, selectedView])

  const isSubcategoryListView = Boolean(selectedView)
  const isSearchPage = activePage === 'search'
  const dockActiveItem = cartOpen
    ? 'cart'
    : menuOpen
      ? 'category'
      : (searchOpen || isSearchPage)
        ? 'search'
        : 'home'

  useEffect(() => {
    if (!searchOpen) return
    searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px) and (pointer: coarse)')
    const updateDockVisibility = () => setShowMobileDock(mediaQuery.matches)

    updateDockVisibility()
    mediaQuery.addEventListener('change', updateDockVisibility)

    return () => {
      mediaQuery.removeEventListener('change', updateDockVisibility)
    }
  }, [])

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('sera-dam-cart-v1')
      if (storedCart) {
        const parsed = JSON.parse(storedCart)
        if (Array.isArray(parsed)) {
          setCartItems(parsed)
        }
      }
    } catch {
      // no-op
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sera-dam-cart-v1', JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflowY = document.documentElement.style.overflowY

    if (selectedProduct) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflowY = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflowY = previousHtmlOverflowY
    }
  }, [selectedProduct])

  useEffect(() => {
    let isMounted = true

    async function loadUtilities() {
      try {
        const utilityResponse = await fetch(`${API_BASE_URL}/api/utilities`)

        if (!utilityResponse.ok) {
          throw new Error(`Failed to load /api/utilities: ${utilityResponse.status}`)
        }

        const utilityItems = await utilityResponse.json()

        if (!isMounted) return

        setUtilities(Array.isArray(utilityItems) ? utilityItems : [])
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load utilities')
      }
    }

    loadUtilities()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        setLoading(true)
        setError('')

        const catalogResponse = await fetch(`${API_BASE_URL}/api/catalog`)

        if (!catalogResponse.ok) {
          throw new Error(`Failed to load /api/catalog: ${catalogResponse.status}`)
        }

        const catalogPayload = await catalogResponse.json()
        const catalogSections = getCatalogSections(catalogPayload)

        if (!Array.isArray(catalogSections)) {
          throw new Error('Invalid catalog response')
        }

        if (!isMounted) return
        setCatalog(catalogSections)
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load catalog')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(event) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function handleGoHome() {
    setActivePage('home')
    setSelectedView(null)
    setSearchOpen(false)
    setMenuOpen(false)
    setActiveSectionIndex(null)
    setSelectedGroupIndex(null)
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSearchSubmit(event) {
    event?.preventDefault()
    if (!normalizedSearch) return
    setActivePage('search')
    setSelectedView(null)
    setSearchOpen(false)
    setMenuOpen(false)
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function getVisibleCount(sectionCategory, groupName) {
    return groupVisibleCounts[getGroupKey(sectionCategory, groupName)] || INITIAL_GROUP_ITEMS
  }

  function handleGroupScroll(sectionCategory, groupName, totalProductsInGroup, event) {
    const element = event.currentTarget
    const isNearEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 80

    if (!isNearEnd) return

    const groupKey = getGroupKey(sectionCategory, groupName)
    setGroupVisibleCounts((previous) => {
      const currentVisible = previous[groupKey] || INITIAL_GROUP_ITEMS
      const nextVisible = Math.min(totalProductsInGroup, currentVisible + LOAD_MORE_ITEMS)
      if (nextVisible === currentVisible) return previous
      return { ...previous, [groupKey]: nextVisible }
    })
  }

  async function handleProductClick(product) {
    setSelectedProduct(product)
    setDetailsError('')

    if (detailsCache[product.route]) {
      setSelectedProduct({ ...product, details: detailsCache[product.route] })
      return
    }

    setDetailsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}${product.route}`)
      if (!response.ok) {
        throw new Error(`Failed to load product details: ${response.status}`)
      }

      const details = await response.json()

      setDetailsCache((previous) => ({ ...previous, [product.route]: details }))
      setSelectedProduct({ ...product, details })
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Failed to load product details')
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleAddToCart(product) {
    let productWithDetails = product

    if (!productWithDetails?.details && detailsCache[product.route]) {
      productWithDetails = { ...productWithDetails, details: detailsCache[product.route] }
    }

    if (!productWithDetails?.details) {
      try {
        const response = await fetch(`${API_BASE_URL}${product.route}`)
        if (!response.ok) {
          throw new Error(`Failed to load product details: ${response.status}`)
        }
        const details = await response.json()
        setDetailsCache((previous) => ({ ...previous, [product.route]: details }))
        productWithDetails = { ...productWithDetails, details }
      } catch {
        return
      }
    }

    const offers = getComparablePriceOffers(productWithDetails?.details?.products)
    if (!offers.length) return

    const bestOffer = offers[0]
    const highestOffer = offers[offers.length - 1]
    const savings = Math.max(0, highestOffer.priceValue - bestOffer.priceValue)

    const cartItem = {
      route: productWithDetails.route,
      name: productWithDetails.details.productName || productWithDetails.name,
      unit: productWithDetails.details.unit || productWithDetails.unit,
      productImage: productWithDetails.details.productImage || productWithDetails.productImage,
      bestStore: bestOffer.source,
      bestPrice: bestOffer.priceValue,
      highestStore: highestOffer.source,
      highestPrice: highestOffer.priceValue,
      savings
    }

    setCartItems((previous) => {
      const existingIndex = previous.findIndex((item) => item.route === cartItem.route)
      if (existingIndex === -1) {
        return [cartItem, ...previous]
      }
      const updated = [...previous]
      updated[existingIndex] = cartItem
      return updated
    })
    setCartOpen(true)
  }

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-base-content" data-theme="dark">
      {/* Animated Background Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-secondary/5 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header - DaisyUI Navbar */}
      <header className="navbar fixed left-0 right-0 top-0 z-30 border-b border-slate-700 bg-slate-900/95 shadow-lg backdrop-blur-md">
        {/* Navbar Start - Shwapno style mega dropdown */}
        <div ref={menuRef} className="navbar-start relative">
          <button
            type="button"
            className="btn btn-ghost btn-circle"
            aria-label="Open categories"
            onClick={() => {
              setMenuOpen((prev) => {
                const next = !prev
                if (next) {
                  setActiveSectionIndex(null)
                  setSelectedGroupIndex(null)
                }
                return next
              })
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {menuOpen ? (
            <div className="absolute left-0 top-full z-40 mt-3 w-[min(92vw,520px)] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
              <div className="border-b border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-200">
                Shop By Category
              </div>

              <div className="grid min-h-[260px] grid-cols-1 md:grid-cols-[240px_1fr]">
                <div className="border-r border-slate-700 bg-slate-900 p-2">
                  {catalog.map((section, sectionIdx) => (
                    <button
                      key={section.category}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                        sectionIdx === activeSectionIndex ? 'bg-primary/20 font-semibold text-primary' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                      onClick={() => {
                        setActiveSectionIndex(sectionIdx)
                        setSelectedGroupIndex(null)
                      }}
                    >
                      <span>{section.category}</span>
                      <span className="text-xs">›</span>
                    </button>
                  ))}
                </div>

                <div className="bg-slate-800 p-2">
                  {activeGroups.length ? (
                    activeGroups.map((group, groupIdx) => (
                      <button
                        key={group.name}
                        type="button"
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                          groupIdx === selectedGroupIndex ? 'bg-error text-white' : 'text-slate-200 hover:bg-slate-700'
                        }`}
                        onClick={() => {
                          setSelectedGroupIndex(groupIdx)
                          if (activeSectionIndex !== null) {
                            setSelectedView({ sectionIndex: activeSectionIndex, groupIndex: groupIdx })
                          }
                          setMenuOpen(false)
                          setTimeout(() => {
                            contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }, 0)
                        }}
                      >
                        <span>{toTitleCase(group.name)}</span>
                        <span className="text-xs">{group.products.length}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Navbar Center - Brand */}
        <div className="navbar-center">
          <button type="button" className="btn btn-ghost flex flex-col gap-0" onClick={handleGoHome}>
            <span className="text-lg font-black bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">
              সেরা দাম
            </span>
            <span className="text-xs font-medium text-base-content/50">Smart Shopping</span>
          </button>
        </div>

        {/* Navbar End - Search & Cart */}
        <div className="navbar-end gap-2">
          <button
            type="button"
            className={`btn btn-ghost btn-circle transition ${searchOpen ? 'bg-primary/20 text-primary' : 'hover:bg-primary/20'}`}
            aria-label="Toggle search"
            onClick={() => setSearchOpen((previous) => !previous)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="btn btn-ghost btn-circle hover:bg-secondary/20" onClick={() => setCartOpen(true)} aria-label="Open cart">
            <div className="indicator">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l1 5m0 0h13l-1.5 7h-10.5m-1-7h14m-12 11a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2" />
              </svg>
              {cartItems.length ? <span className="badge badge-xs badge-primary indicator-item">{cartItems.length}</span> : null}
            </div>
          </button>
        </div>
      </header>

      <main ref={contentRef} className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 pt-24 pb-24 md:px-6 md:pt-28 md:pb-10">

        {searchOpen ? (
          <section className="rounded-xl border border-primary/40 bg-slate-900/90 p-3 shadow-lg sm:p-4">
            <form className="flex items-center gap-2" onSubmit={handleSearchSubmit}>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="text"
                placeholder="Search products from all stores..."
                className="input input-sm input-bordered w-full bg-slate-800"
              />
              <button type="submit" className="btn btn-sm btn-primary">Search</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSearchOpen(false)}>Close</button>
            </form>
          </section>
        ) : null}

        {error && <div className="alert alert-error shadow-md border border-error/30">{error}</div>}

        {isSearchPage ? (
          <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-base-content">Search Results</h2>
                <p className="text-xs text-base-content/60 break-words">{searchResults.length} matching products for "{searchQuery.trim()}"</p>
              </div>
              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost whitespace-nowrap"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchOpen(true)
                  }}
                >
                  New Search
                </button>
                <button type="button" className="btn btn-xs btn-primary whitespace-nowrap" onClick={handleGoHome}>Back Home</button>
              </div>
            </div>
            {normalizedSearch && searchResults.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {searchResults.map((product, idx) => (
                  <ProductCard key={`${product.route}-${idx}`} product={product} onClick={handleProductClick} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-600 p-6 text-center text-sm text-base-content/70">
                {normalizedSearch ? 'No products found. Try another keyword.' : 'Type a product name to search across stores.'}
              </div>
            )}
          </section>
        ) : null}

        {!isSearchPage ? visibleCatalog.map((section) => (
          <section key={section.category} className="space-y-6">
            <div className="flex items-end justify-between gap-3 border-b border-slate-700 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-1">Category</p>
                <h2 className="text-2xl font-black text-base-content md:text-3xl">{section.category}</h2>
              </div>
            </div>

            {section.groups.map((group, groupIndex) => (
              <div key={group.name} className="space-y-4">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h3 className="text-lg font-bold text-base-content sm:text-xl">{toTitleCase(group.name)}</h3>
                  {!isSubcategoryListView ? (
                    <button
                      type="button"
                      className="btn btn-xs btn-primary"
                      onClick={() => {
                        const sectionIndex = catalog.findIndex((item) => item.category === section.category)
                        if (sectionIndex >= 0) {
                          setSelectedView({ sectionIndex, groupIndex })
                          setMenuOpen(false)
                          setTimeout(() => {
                            contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }, 0)
                        }
                      }}
                    >
                      More
                    </button>
                  ) : null}
                </div>
                {isSubcategoryListView ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {group.products.map((product, productIndex) => (
                      <ProductCard key={`${group.name}-${productIndex}`} product={product} onClick={handleProductClick} />
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    onScroll={(event) => handleGroupScroll(section.category, group.name, group.products.length, event)}
                  >
                    {group.products.slice(0, getVisibleCount(section.category, group.name)).map((product, productIndex) => (
                      <div key={`${group.name}-${productIndex}`} className="w-28 sm:w-32 md:w-40 lg:w-44 flex-shrink-0 snap-start">
                        <ProductCard product={product} onClick={handleProductClick} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        )) : null}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 sm:p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h4 className="text-lg font-black text-base-content">সেরা দাম</h4>
                <p className="text-sm text-base-content/70">Compare smarter. Buy cheaper.</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center sm:max-w-sm sm:flex-1">
                <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-base-content/60">Stores</p>
                  <p className="text-sm font-bold text-primary">3+</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-base-content/60">Live Compare</p>
                  <p className="text-sm font-bold text-secondary">Yes</p>
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-base-content/60">Savings</p>
                  <p className="text-sm font-bold text-success">Tracked</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-slate-700 pt-4 text-xs text-base-content/60 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 সেরা দাম. All rights reserved.</p>
              <p>Built for smarter grocery decisions.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Dock Navigation */}
      {showMobileDock ? (
        <DockNavigation
          onHome={handleGoHome}
          activeItem={dockActiveItem}
          cartCount={cartItems.length}
          onOpenCategory={() => {
            setActivePage('home')
            setSearchOpen(false)
            setMenuOpen(true)
            setSelectedView(null)
          }}
          onOpenCart={() => setCartOpen(true)}
          onOpenSearch={() => {
            setSearchOpen(true)
            setMenuOpen(false)
          }}
        />
      ) : null}

      <CartDrawer
        open={cartOpen}
        cartItems={cartItems}
        utilities={utilities}
        onClose={() => setCartOpen(false)}
        onRemoveItem={(route) => setCartItems((previous) => previous.filter((item) => item.route !== route))}
        onClear={() => setCartItems([])}
      />

      <ProductDetailsModal
        product={selectedProduct}
        utilities={utilities}
        loading={detailsLoading}
        error={detailsError}
        onAddToCart={handleAddToCart}
        onClose={() => {
          setSelectedProduct(null)
          setDetailsError('')
          setDetailsLoading(false)
        }}
      />
    </div>
  )
}

export default App
