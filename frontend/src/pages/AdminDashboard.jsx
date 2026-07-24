import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  getAdminStatsSummary,
  getAdminStatsSalesTrend,
  getAdminStatsDemographicPreferences,
} from '../api/adminStats'

// index.css의 --color-gold/--color-clay/--color-forest/--color-danger와 동일한 값.
// recharts는 SVG 프레젠테이션 속성에 CSS 변수를 안정적으로 반영하지 못해 헥스값을 직접 쓴다.
const CHART_COLORS = ['#B8862E', '#8B5A2B', '#35502F', '#A6392B']
const AXIS_COLOR = '#8B5A2B'
const GRID_COLOR = '#DDD3BC'

function ChartCard({ title, children }) {
  return (
    <div
      className="rounded-xl border shadow-sm hover:shadow-md transition-shadow p-5"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
    >
      <h2 className="font-medium mb-3" style={{ color: 'var(--color-ink)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div
      className="rounded-xl border shadow-sm hover:shadow-md transition-shadow p-5"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
    >
      <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-gold)' }}>
        {value}
      </p>
    </div>
  )
}

function LoadingBlock({ height = 240 }) {
  return (
    <div
      className="animate-pulse rounded-lg"
      style={{ height, background: 'var(--color-line)' }}
    />
  )
}

function EmptyState({ height = 240 }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg text-sm"
      style={{ height, color: 'var(--color-clay)', background: 'var(--color-paper)' }}
    >
      데이터를 준비 중입니다
    </div>
  )
}

// 매출 추이 툴팁: 기본 Tooltip은 Line 하나(salesAmount)만 보여주므로, 같은 datePeriod의
// orderCount도 함께 노출하기 위해 커스텀 렌더러를 쓴다.
function SalesTrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)', color: 'var(--color-ink)' }}
    >
      <p className="font-medium mb-1">{label}</p>
      <p>매출액: {point.salesAmount?.toLocaleString()}원</p>
      <p>주문건수: {point.orderCount?.toLocaleString()}건</p>
    </div>
  )
}

// DemographicPreferenceDto[]는 (연령대, 성별, 도서) 조합별로 세분화된 원본 데이터라,
// 화면에서 쓰는 세 가지 관점(연령대별 집계 / 성별 집계 / 도서별 랭킹)은 여기서 reduce로 만든다.
const aggregateByAgeGroup = (rows) => {
  const byAgeGroup = new Map()
  rows.forEach((r) => {
    const prev = byAgeGroup.get(r.ageGroup) ?? 0
    byAgeGroup.set(r.ageGroup, prev + r.totalQuantitySold)
  })
  return Array.from(byAgeGroup.entries())
    .map(([ageGroup, totalQuantitySold]) => ({ ageGroup, totalQuantitySold }))
    .sort((a, b) => (a.ageGroup < b.ageGroup ? -1 : 1))
}

const aggregateByGender = (rows) => {
  const byGender = new Map()
  rows.forEach((r) => {
    const prev = byGender.get(r.gender) ?? 0
    byGender.set(r.gender, prev + r.totalQuantitySold)
  })
  return Array.from(byGender.entries()).map(([gender, totalQuantitySold]) => ({ gender, totalQuantitySold }))
}

const TOP_BOOKS_LIMIT = 5

const aggregateTopBooks = (rows) => {
  const byBook = new Map()
  rows.forEach((r) => {
    const prev = byBook.get(r.bookId) ?? { bookId: r.bookId, bookTitle: r.bookTitle, totalQuantitySold: 0 }
    prev.totalQuantitySold += r.totalQuantitySold
    byBook.set(r.bookId, prev)
  })
  return Array.from(byBook.values())
    .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
    .slice(0, TOP_BOOKS_LIMIT)
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [demographicPreferences, setDemographicPreferences] = useState(null)
  const [demographicsLoading, setDemographicsLoading] = useState(true)
  const [salesTrend, setSalesTrend] = useState(null)
  const [salesTrendLoading, setSalesTrendLoading] = useState(true)

  useEffect(() => {
    getAdminStatsSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false))
  }, [])

  useEffect(() => {
    getAdminStatsDemographicPreferences()
      .then((res) => setDemographicPreferences(res.data))
      .catch(() => setDemographicPreferences(null))
      .finally(() => setDemographicsLoading(false))
  }, [])

  useEffect(() => {
    getAdminStatsSalesTrend()
      .then((res) => setSalesTrend(res.data))
      .catch(() => setSalesTrend(null))
      .finally(() => setSalesTrendLoading(false))
  }, [])

  const hasSalesTrend = salesTrend?.length > 0
  const hasDemographics = demographicPreferences?.length > 0

  const ageGroupData = useMemo(
    () => (hasDemographics ? aggregateByAgeGroup(demographicPreferences) : []),
    [hasDemographics, demographicPreferences]
  )
  const genderData = useMemo(
    () => (hasDemographics ? aggregateByGender(demographicPreferences) : []),
    [hasDemographics, demographicPreferences]
  )
  const topBooks = useMemo(
    () => (hasDemographics ? aggregateTopBooks(demographicPreferences) : []),
    [hasDemographics, demographicPreferences]
  )

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--color-ink)' }}>
        통계 대시보드
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <LoadingBlock key={i} height={84} />)
        ) : summary ? (
          <>
            <SummaryCard label="총 매출액" value={`${summary.totalSalesAmount?.toLocaleString()}원`} />
            <SummaryCard label="오늘 매출액" value={`${summary.todaySalesAmount?.toLocaleString()}원`} />
            <SummaryCard label="총 주문건수" value={`${summary.totalOrderCount?.toLocaleString()}건`} />
            <SummaryCard label="재고부족 도서수" value={`${summary.lowStockCount?.toLocaleString()}권`} />
          </>
        ) : (
          <div className="col-span-2 sm:col-span-4">
            <EmptyState height={84} />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <ChartCard title="연령대별 선호">
          {demographicsLoading ? (
            <LoadingBlock />
          ) : ageGroupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ageGroupData}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
                <XAxis dataKey="ageGroup" stroke={AXIS_COLOR} fontSize={12} />
                <YAxis stroke={AXIS_COLOR} fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="totalQuantitySold" name="판매 수량" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="성별 선호">
          {demographicsLoading ? (
            <LoadingBlock />
          ) : genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={genderData} dataKey="totalQuantitySold" nameKey="gender" outerRadius={80} label>
                  {genderData.map((entry, i) => (
                    <Cell key={entry.gender} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <ChartCard title="최근 매출 추이">
          {salesTrendLoading ? (
            <LoadingBlock height={260} />
          ) : hasSalesTrend ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesTrend}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
                <XAxis dataKey="datePeriod" stroke={AXIS_COLOR} fontSize={12} />
                <YAxis stroke={AXIS_COLOR} fontSize={12} />
                <Tooltip content={<SalesTrendTooltip />} />
                <Line type="monotone" dataKey="salesAmount" name="매출액" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState height={260} />
          )}
        </ChartCard>

        <ChartCard title="인기 도서 TOP 5 (판매 수량)">
          {demographicsLoading ? (
            <LoadingBlock height={260} />
          ) : topBooks.length > 0 ? (
            <ul className="flex flex-col gap-2" style={{ height: 260, overflowY: 'auto' }}>
              {topBooks.map((book, i) => (
                <li
                  key={book.bookId}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--color-paper)' }}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: 'var(--color-gold)' }}>
                      {i + 1}
                    </span>
                    <span style={{ color: 'var(--color-ink)' }}>{book.bookTitle}</span>
                  </span>
                  <span style={{ color: 'var(--color-clay)' }}>{book.totalQuantitySold.toLocaleString()}권</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState height={260} />
          )}
        </ChartCard>
      </div>
    </div>
  )
}
