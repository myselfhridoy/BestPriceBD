import { useEffect, useMemo, useRef, useState } from 'react'
import './fonts.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

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

function ProductCard({ product, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      className="group card overflow-hidden bg-base-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95 disabled:opacity-50"
      disabled={!product.details}
    >
      {/* Image */}
      <figure className="relative flex h-32 items-center justify-center overflow-hidden bg-base-200 p-2">
        {product.details?.productImage ? (
          <img
            src={product.details.productImage}
            alt={product.details.productName || product.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center text-xs text-base-content/40">Loading...</div>
        )}
      </figure>

      {/* Info */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-xs font-semibold text-base-content">{product.details?.productName || product.name}</h3>
        <p className="mt-1 text-xs text-base-content/60">{product.details?.unit || product.unit || '-'}</p>
      </div>
    </button>
  )
}

function ProductDetailsModal({ product, utilities, onClose }) {
  if (!product?.details) return null

  const comparableProducts = Array.isArray(product.details.products)
    ? product.details.products.filter((item) => Number.isFinite(Number(item?.data?.priceValue)))
    : []

  const lowestPriceValue = comparableProducts[0]?.data?.priceValue

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
          <div className="flex flex-col gap-3 sm:w-40 sm:flex-shrink-0">
            <figure className="flex h-40 items-center justify-center rounded-lg border border-base-300 bg-base-200 sm:h-48">
              {product.details.productImage ? (
                <img
                  src={product.details.productImage}
                  alt={product.details.productName}
                  className="h-full w-full object-contain p-2"
                />
              ) : null}
            </figure>
            
            {/* Info Cards */}
            <div className="space-y-2">
              <div className="rounded-lg border border-base-300 bg-base-200 p-3">
                <p className="text-xs font-bold text-base-content/60">Unit</p>
                <p className="text-sm font-semibold text-base-content">{product.details.unit}</p>
              </div>
              <div className="rounded-lg border border-primary bg-primary/10 p-3">
                <p className="text-xs font-bold text-primary">Best Choice</p>
                <div className="mt-1 flex items-center gap-2">
                  {getBestChoiceLabel(utilities, product.details['best-choice'])}
                </div>
              </div>
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
                <p className="text-xs font-bold text-warning/80">Max Discount</p>
                <p className="mt-1 text-sm font-bold text-warning">{formatCurrency(getHighestDiscount(product.details.products))}</p>
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

function DockNavigation({ onHome }) {
  const handleHomeClick = () => {
    if (typeof onHome === 'function') {
      onHome()
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  return (
    <nav className="dock fixed bottom-4 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/90 px-3 py-2 shadow-2xl backdrop-blur-xl sm:bottom-6">
      {/* Home */}
      <button
        onClick={handleHomeClick}
        className="dock-item group relative flex h-10 w-10 items-center justify-center rounded-full text-base-300 transition-all duration-300 hover:bg-primary/20 hover:text-primary"
        title="Home"
      >
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 11 12 2 23 11"></polyline>
          <path d="m5,13v7c0,1.105.895,2,2,2h10c1.105,0,2-.895,2-2v-7"></path>
          <line x1="12" y1="22" x2="12" y2="18"></line>
        </svg>
        <span className="dock-label text-xs">Home</span>
      </button>

      {/* Categories */}
      <button
        className="dock-item group relative flex h-10 w-10 items-center justify-center rounded-full text-base-300 transition-all duration-300 hover:bg-secondary/20 hover:text-secondary"
        title="Categories"
      >
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span className="dock-label text-xs">Categories</span>
      </button>

      {/* Compare/Favorites */}
      <button
        className="dock-item dock-active group relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition-all duration-300 hover:bg-primary/30"
        title="Compare"
      >
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 14 9 14 9 17 15 17 15 14 21 14"></polyline>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
        <span className="dock-label text-xs">Compare</span>
      </button>

      {/* Settings */}
      <button
        className="dock-item group relative flex h-10 w-10 items-center justify-center rounded-full text-base-300 transition-all duration-300 hover:bg-accent/20 hover:text-accent"
        title="Settings"
      >
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="m22,13.25v-2.5l-2.318-.966c-.167-.581-.395-1.135-.682-1.654l.954-2.318-1.768-1.768-2.318.954c-.518-.287-1.073-.515-1.654-.682l-.966-2.318h-2.5l-.966,2.318c-.581.167-1.135.395-1.654.682l-2.318-.954-1.768,1.768.954,2.318c-.287.518-.515,1.073-.682,1.654l-2.318.966v2.5l2.318.966c.167.581.395,1.135.682,1.654l-.954,2.318,1.768,1.768,2.318-.954c.518.287,1.073.515,1.654.682l.966,2.318h2.5l.966-2.318c.581-.167,1.135.395,1.654.682l2.318-.954,1.768,1.768-.954,2.318c.287.518.515,1.073.682,1.654l2.318.966Z"></path>
        </svg>
        <span className="dock-label text-xs">Settings</span>
      </button>
    </nav>
  )
}

function App() {
  const [catalog, setCatalog] = useState([])
  const [utilities, setUtilities] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSectionIndex, setActiveSectionIndex] = useState(null)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null)
  const [selectedView, setSelectedView] = useState(null)
  const menuRef = useRef(null)
  const contentRef = useRef(null)

  const activeSection = activeSectionIndex === null ? null : catalog[activeSectionIndex]
  const activeGroups = activeSection?.groups || []

  const allProductsCount = useMemo(
    () => catalog.reduce((sum, section) => sum + section.groups.reduce((s, group) => s + group.products.length, 0), 0),
    [catalog]
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

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        setLoading(true)
        setError('')

        const [catalogResponse, utilityResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/catalog`),
          fetch(`${API_BASE_URL}/api/utilities`)
        ])

        if (!catalogResponse.ok) {
          throw new Error(`Failed to load /api/catalog: ${catalogResponse.status}`)
        }

        if (!utilityResponse.ok) {
          throw new Error(`Failed to load /api/utilities: ${utilityResponse.status}`)
        }

        const catalogSections = await catalogResponse.json()
        const utilityItems = await utilityResponse.json()

        if (!Array.isArray(catalogSections)) {
          throw new Error('Invalid catalog response')
        }

        const loadedProducts = await Promise.all(
          catalogSections.flatMap((section) =>
            section.groups.flatMap((group) =>
              group.products.map(async (product) => {
                const res = await fetch(`${API_BASE_URL}${product.route}`)
                if (!res.ok) {
                  throw new Error(`Failed to load ${product.route}: ${res.status}`)
                }

                const details = await res.json()
                return {
                  ...product,
                  details
                }
              })
            )
          )
        )

        if (!isMounted) return

        let cursor = 0
        const nextCatalog = catalogSections.map((section) => ({
          ...section,
          groups: section.groups.map((group) => ({
            ...group,
            products: group.products.map((product) => loadedProducts[cursor++] || product)
          }))
        }))

        setCatalog(nextCatalog)
        setUtilities(Array.isArray(utilityItems) ? utilityItems : [])
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
    setSelectedView(null)
    setMenuOpen(false)
    setActiveSectionIndex(null)
    setSelectedGroupIndex(null)
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-base-content" data-theme="dark">
      {/* Animated Background Blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-secondary/5 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header - DaisyUI Navbar */}
      <header className="navbar sticky top-0 z-20 border-b border-slate-700 bg-slate-900 shadow-lg">
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
              BestPrice BD
            </span>
            <span className="text-xs font-medium text-base-content/50">Smart Shopping</span>
          </button>
        </div>

        {/* Navbar End - Search & Notifications */}
        <div className="navbar-end gap-2">
          <button className="btn btn-ghost btn-circle hover:bg-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="btn btn-ghost btn-circle hover:bg-secondary/20">
            <div className="indicator">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="badge badge-xs badge-primary indicator-item"></span>
            </div>
          </button>
        </div>
      </header>

      <main ref={contentRef} className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        {/* Hero Section */}
        {!selectedView ? (
        <section className="hero rounded-xl border border-slate-700 bg-gradient-to-br from-primary/10 via-slate-900 to-secondary/10 shadow-xl overflow-hidden">
          <div className="hero-content w-full flex-col items-start gap-4 p-4 md:p-5">
            <div className="max-w-3xl space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="badge badge-primary badge-md gap-2 px-3 py-2">
                  <span>📊</span>
                  Live Price Comparison
                </span>
              </div>
              <h1 className="text-2xl font-black text-base-content leading-tight md:text-3xl lg:text-4xl">
                Find the Best Prices
                <span className="block text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text">
                  Instantly
                </span>
              </h1>
              <p className="text-xs leading-relaxed text-base-content/70 md:text-sm">
                {loading
                  ? '⏳ Loading products from backend...'
                  : `Compare ${allProductsCount} products from ${2} shops. Save money on every purchase.`}
              </p>
              {error && <p className="text-sm font-medium text-error bg-error/10 rounded-lg p-3 border border-error/30">{error}</p>}
            </div>

            {/* Stats Grid */}
            <div className="w-full">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center">
                  <p className="text-xl font-black text-primary sm:text-2xl">{allProductsCount}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-primary/70">Products</p>
                </div>
                <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-3 text-center">
                  <p className="text-xl font-black text-secondary sm:text-2xl">2</p>
                  <p className="mt-1 text-xs font-bold uppercase text-secondary/70">Shops</p>
                </div>
                <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-center">
                  <p className="text-xl font-black text-accent sm:text-2xl">💰</p>
                  <p className="mt-1 text-xs font-bold uppercase text-accent/70">Savings</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        ) : null}

        {error && <div className="alert alert-error shadow-md border border-error/30">{error}</div>}

        {selectedView ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3">
            <div>
              <p className="text-xs text-slate-400">Filtered View</p>
              <p className="text-sm font-semibold text-slate-100">
                {visibleCatalog[0]?.category} / {toTitleCase(visibleCatalog[0]?.groups?.[0]?.name)}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setSelectedView(null)}
            >
              Show All
            </button>
          </div>
        ) : null}

        {visibleCatalog.map((section) => (
          <section key={section.category} className="space-y-6">
            <div className="flex items-end justify-between gap-3 border-b border-slate-700 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-1">Category</p>
                <h2 className="text-2xl font-black text-base-content md:text-3xl">{section.category}</h2>
              </div>
            </div>

            {section.groups.map((group) => (
              <div key={group.name} className="space-y-4">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h3 className="text-lg font-bold text-base-content sm:text-xl">{toTitleCase(group.name)}</h3>
                  <span className="badge badge-primary badge-sm">{group.products.length} items</span>
                </div>
                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {group.products.map((product) => (
                    <ProductCard key={`${group.name}-${product.id}`} product={product} onClick={setSelectedProduct} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700 bg-slate-900 py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 mb-8">
            <div className="space-y-2">
              <h4 className="font-bold text-base-content">BestPrice BD</h4>
              <p className="text-sm text-base-content/70">Smart shopping starts here. Compare prices instantly.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-base-content">Coverage</h4>
              <ul className="text-sm space-y-1 text-base-content/70">
                <li>✓ Shwapno</li>
                <li>✓ Chaldal</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-base-content">Made with ❤️</h4>
              <p className="text-sm text-base-content/70">By Hridoy</p>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-6 text-center text-xs text-base-content/50">
            <p>© 2026 BestPrice BD. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Dock Navigation */}
      <DockNavigation onHome={handleGoHome} />

      <ProductDetailsModal product={selectedProduct} utilities={utilities} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}

export default App
