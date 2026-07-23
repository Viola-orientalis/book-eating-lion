// TODO: 백엔드 실제 API 스펙 확정되면 엔드포인트/필드명 재확인 필요.
// summary / demographics / revenue-trend 세 엔드포인트 모두 아직 백엔드에 없는 것으로
// 가정하고 만든 화면이며, 404 등으로 실패하면 에러를 노출하지 않고 조용한 빈 상태로 대체한다.
import { useEffect, useState } from 'react'
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
  getAdminStatsDemographics,
  getAdminStatsRevenueTrend,
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

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [demographics, setDemographics] = useState(null)
  const [demographicsLoading, setDemographicsLoading] = useState(true)
  const [revenueTrend, setRevenueTrend] = useState(null)
  const [revenueTrendLoading, setRevenueTrendLoading] = useState(true)

  useEffect(() => {
    getAdminStatsSummary()
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false))
  }, [])

  useEffect(() => {
    getAdminStatsDemographics()
      .then((res) => setDemographics(res.data))
      .catch(() => setDemographics(null))
      .finally(() => setDemographicsLoading(false))
  }, [])

  useEffect(() => {
    getAdminStatsRevenueTrend()
      .then((res) => setRevenueTrend(res.data))
      .catch(() => setRevenueTrend(null))
      .finally(() => setRevenueTrendLoading(false))
  }, [])

  const hasAgeGroups = demographics?.ageGroups?.length > 0
  const hasGenderPreference = demographics?.genderPreference?.length > 0
  const hasRevenueTrend = revenueTrend?.length > 0

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
            <SummaryCard label="회원 수" value={summary.totalMembers?.toLocaleString()} />
            <SummaryCard label="주문 수" value={summary.totalOrders?.toLocaleString()} />
            <SummaryCard label="총 매출" value={`${summary.totalRevenue?.toLocaleString()}원`} />
            <SummaryCard label="등록 도서 수" value={summary.totalBooks?.toLocaleString()} />
          </>
        ) : (
          <div className="col-span-2 sm:col-span-4">
            <EmptyState height={84} />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <ChartCard title="연령대별 분포">
          {demographicsLoading ? (
            <LoadingBlock />
          ) : hasAgeGroups ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={demographics.ageGroups}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke={AXIS_COLOR} fontSize={12} />
                <YAxis stroke={AXIS_COLOR} fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="성별 선호">
          {demographicsLoading ? (
            <LoadingBlock />
          ) : hasGenderPreference ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={demographics.genderPreference} dataKey="count" nameKey="gender" outerRadius={80} label>
                  {demographics.genderPreference.map((entry, i) => (
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

      <ChartCard title="최근 7일 매출 추이">
        {revenueTrendLoading ? (
          <LoadingBlock height={260} />
        ) : hasRevenueTrend ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={AXIS_COLOR} fontSize={12} />
              <YAxis stroke={AXIS_COLOR} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState height={260} />
        )}
      </ChartCard>
    </div>
  )
}
