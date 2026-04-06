'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { inferPaymentModel, parseSignals } from '@/lib/rules/paymentInference'
import type { InferenceResult, RiskItem } from '@/types'
import {
  AlertTriangle, BarChart2, CheckCircle2, ChevronRight,
  Database, HelpCircle, RefreshCw, Shield, Zap, Eye, BookOpen, TrendingUp
} from 'lucide-react'

const riskColors: Record<string, string> = {
  Faible: 'bg-green-50 text-green-700 border-green-100',
  Moyen: 'bg-amber-50 text-amber-700 border-amber-100',
  Eleve: 'bg-red-50 text-red-700 border-red-100',
  Critique: 'bg-red-100 text-red-800 border-red-200 font-semibold',
}

const modelColors: Record<string, string> = {
  'one-off': 'bg-blue-50 text-blue-700',
  'recurring': 'bg-teal-50 text-teal-700',
  'mit-post-service': 'bg-amber-50 text-amber-700',
  'pre-auth-capture': 'bg-purple-50 text-purple-700',
  'multi-authorization': 'bg-orange-50 text-orange-700',
  'sepa-sdd': 'bg-indigo-50 text-indigo-700',
  'debt-recovery': 'bg-red-50 text-red-700',
  'refund': 'bg-green-50 text-green-700',
  'hybrid': 'bg-gray-100 text-gray-700',
}

function RiskList({ risks, title, icon }: { risks: RiskItem[], title: string, icon: React.ReactNode }) {
  if (!risks.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <div className="flex flex-col gap-3">
        {risks.map((r) => (
          <div key={r.label} className="flex items-start gap-3">
            <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 mt-0.5 ${riskColors[r.level] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
              {r.level}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{r.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function ResultContent() {
  const searchParams = useSearchParams()
  const rawAnswers: Record<string, string> = {}
  searchParams.forEach((v, k) => { rawAnswers[k] = v })

  const signals = parseSignals(rawAnswers as any)
  const result: InferenceResult = inferPaymentModel(signals)

  const colorClass = modelColors[result.model] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-gray-700">Accueil</Link>
        <span>/</span>
        <Link href="/analysis" className="hover:text-gray-700">Analyse</Link>
        <span>/</span>
        <span className="text-gray-900">Résultat</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-3 ${colorClass}`}>
          {result.modelLabel}
        </span>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Architecture recommandée</h1>
        <p className="text-sm text-gray-500">Basée sur {Object.keys(rawAnswers).length} signaux analysés</p>
      </div>

      {/* Confidence + summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Modèle recommandé</span>
          <span className="text-sm font-medium text-green-700">{result.confidence}% de confiance</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">{result.modelLabel}</h2>
        <div className="h-1.5 bg-gray-100 rounded-full mb-5">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${result.confidence}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{result.simpleSummary}</p>
      </div>

      {/* Arbre de décision */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight size={16} className="text-purple-500" />
          <h3 className="font-medium text-gray-900">Arbre de décision</h3>
        </div>
        <div className="flex flex-col gap-2">
          {result.decisionTree.map((step, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 font-medium ${
                  step.value === 'Oui' ? 'bg-green-50 text-green-700' :
                  step.value === 'Non' ? 'bg-gray-100 text-gray-600' :
                  'bg-blue-50 text-blue-700'
                }`}>{step.value}</span>
                <span className="text-xs text-gray-600 truncate">{step.signal}</span>
              </div>
              <span className="text-xs text-gray-400 text-right flex-shrink-0 max-w-[45%] leading-relaxed">{step.impact}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">→ {result.modelLabel}</span>
        </div>
      </div>

      {/* Business / Strategic readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Section title="Lecture métier" icon={<BookOpen size={16} className="text-blue-500" />}>
          <p className="text-sm text-gray-600 leading-relaxed">{result.businessReading}</p>
        </Section>
        <Section title="Lecture stratégique" icon={<TrendingUp size={16} className="text-teal-500" />}>
          <p className="text-sm text-gray-600 leading-relaxed">{result.strategicReading}</p>
        </Section>
      </div>

      {/* Expert lens */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={16} className="text-amber-600" />
          <h3 className="font-medium text-amber-900">Ce qu'un expert regarderait</h3>
        </div>
        <p className="text-sm text-amber-800 leading-relaxed">{result.expertLens}</p>
      </div>

      {/* Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <RiskList
          risks={result.businessRisks}
          title="Risques métier"
          icon={<AlertTriangle size={16} className="text-red-500" />}
        />
        <RiskList
          risks={result.operationalRisks}
          title="Risques opérationnels"
          icon={<Shield size={16} className="text-orange-500" />}
        />
      </div>

      {/* Reconciliation risks */}
      {result.reconciliationRisks.length > 0 && (
        <div className="mb-4">
          <RiskList
            risks={result.reconciliationRisks}
            title="Risques de réconciliation"
            icon={<RefreshCw size={16} className="text-purple-500" />}
          />
        </div>
      )}

      {/* Failure scenarios */}
      <Section title="Scénarios de défaillance à surveiller" icon={<Zap size={16} className="text-red-400" />}>
        <div className="flex flex-col divide-y divide-gray-50">
          {result.failureScenarios.map((f) => (
            <div key={f.trigger} className="py-4 first:pt-0 last:pb-0">
              <div className="text-sm font-medium text-gray-900 mb-1">{f.trigger}</div>
              <div className="text-xs text-gray-500 mb-1">Conséquence : {f.consequence}</div>
              <div className="text-xs text-green-700">→ {f.mitigation}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Critical data + statuses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
        <Section title="Données critiques à tracer" icon={<Database size={16} className="text-gray-500" />}>
          <div className="flex flex-col gap-1">
            {result.criticalDataPoints.map((d) => (
              <code key={d} className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded font-mono text-gray-700 block">
                {d}
              </code>
            ))}
          </div>
        </Section>

        <Section title="Statuts à distinguer" icon={<RefreshCw size={16} className="text-teal-500" />}>
          <div className="flex flex-wrap gap-2">
            {result.statusesToDistinguish.map((st, i) => (
              <div key={st} className="flex items-center gap-1">
                <code className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded font-mono">{st}</code>
                {i < result.statusesToDistinguish.length - 1 && <span className="text-gray-300 text-xs">→</span>}
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* KPIs */}
      <Section title="KPIs de pilotage" icon={<BarChart2 size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.kpis.map((kpi) => (
            <div key={kpi.label} className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">{kpi.label}</p>
                {kpi.description && <p className="text-xs text-gray-500 mt-0.5">{kpi.description}</p>}
              </div>
              {kpi.unit && (
                <span className="text-xs px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-400 flex-shrink-0">
                  {kpi.unit}
                </span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div className="mt-4">
          <Section title="Modèles alternatifs à considérer" icon={<CheckCircle2 size={16} className="text-gray-400" />}>
            <div className="flex flex-col gap-3">
              {result.alternatives.map((alt) => (
                <div key={alt.model} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl">
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${modelColors[alt.model] ?? 'bg-gray-100 text-gray-600'}`}>
                    {alt.label}
                  </span>
                  <div>
                    <p className="text-xs text-gray-600 leading-relaxed">{alt.reason}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="h-1 w-16 bg-gray-100 rounded-full">
                        <div className="h-full bg-gray-400 rounded-full" style={{ width: `${Math.min(100, alt.score)}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">Score : {alt.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Clarifying questions if hybrid or ambiguous */}
      {(result.clarifyingQuestions?.length ?? 0) > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={16} className="text-blue-600" />
            <h3 className="font-medium text-blue-900">Questions à clarifier</h3>
          </div>
          <ul className="flex flex-col gap-2">
            {result.clarifyingQuestions!.map((q) => (
              <li key={q} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ambiguous signals */}
      {(result.ambiguousSignals?.length ?? 0) > 0 && (
        <div className="mt-4 border border-amber-100 bg-amber-50 rounded-2xl p-5">
          <p className="text-xs font-medium text-amber-700 mb-2">Signaux ambigus détectés</p>
          <ul className="flex flex-col gap-1">
            {result.ambiguousSignals!.map((s) => (
              <li key={s} className="text-xs text-amber-600 flex items-start gap-1.5">
                <span className="flex-shrink-0">⚠</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap mt-8">
        <Link
          href="/analysis"
          className="flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-gray-800 transition-colors"
        >
          Recommencer l'analyse
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          Accueil
        </Link>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="max-w-3xl mx-auto px-6 py-10 text-center text-gray-400 text-sm">
          Analyse en cours…
        </div>
      }>
        <ResultContent />
      </Suspense>
    </main>
  )
}
