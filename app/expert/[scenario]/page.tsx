import { notFound } from 'next/navigation'
import Link from 'next/link'
import { scenarios } from '@/data/scenarios'
import { ArrowRight, Activity, Database, AlertOctagon, RefreshCw, BarChart2 } from 'lucide-react'

export async function generateStaticParams() {
  return scenarios.map((s) => ({ scenario: s.id }))
}

export default function ExpertPage({ params }: { params: { scenario: string } }) {
  const scenario = scenarios.find((s) => s.id === params.scenario)
  if (!scenario) notFound()

  const arch = scenario.architecture

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Accueil</Link>
          <span>/</span>
          <Link href="/scenarios" className="hover:text-gray-700">Scénarios</Link>
          <span>/</span>
          <span className="text-gray-900">{scenario.title} — Vue experte</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{scenario.title}</h1>
            <p className="text-gray-500 mt-1">{scenario.description}</p>
          </div>
          <Link
            href={`/analysis/${scenario.id}`}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors flex-shrink-0 ml-4"
          >
            Analyser <ArrowRight size={14} />
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-blue-500" />
            <h2 className="font-medium text-gray-900">Flux fonctionnel</h2>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {arch.flow.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                  <span className="text-xs text-gray-400 font-medium">{i + 1}</span>
                  <span className="text-sm text-gray-700">{step}</span>
                </div>
                {i < arch.flow.length - 1 && <span className="text-gray-300 text-lg">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database size={16} className="text-purple-500" />
              <h2 className="font-medium text-gray-900">Données critiques</h2>
            </div>
            <div className="flex flex-col gap-1">
              {arch.criticalData.map((d) => (
                <code key={d} className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded font-mono text-gray-700">
                  {d}
                </code>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw size={16} className="text-teal-500" />
              <h2 className="font-medium text-gray-900">Cycle de statuts</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {arch.statusLifecycle.map((st, i) => (
                <div key={st} className="flex items-center gap-1.5">
                  <code className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded font-mono">{st}</code>
                  {i < arch.statusLifecycle.length - 1 && <span className="text-gray-300">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon size={16} className="text-red-500" />
            <h2 className="font-medium text-gray-900">Cas de défaillance et réponses</h2>
          </div>
          <div className="flex flex-col divide-y divide-gray-50">
            {arch.failureCases.map((fc) => (
              <div key={fc.failure} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full flex-shrink-0 mt-0.5">Échec</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fc.failure}</p>
                    <p className="text-xs text-teal-700 mt-1">→ {fc.response}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {arch.reconciliationNotes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-4">
            <h2 className="text-sm font-medium text-amber-800 mb-1">Réconciliation</h2>
            <p className="text-sm text-amber-700">{arch.reconciliationNotes}</p>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-blue-500" />
            <h2 className="font-medium text-gray-900">KPIs suggérés</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenario.kpis.map((kpi) => (
              <div key={kpi.label} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{kpi.label}</p>
                  {kpi.description && <p className="text-xs text-gray-500 mt-0.5">{kpi.description}</p>}
                </div>
                {kpi.unit && (
                  <span className="text-xs px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 flex-shrink-0 ml-auto">
                    {kpi.unit}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/analysis/${scenario.id}`}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Analyser ce scénario <ArrowRight size={14} />
          </Link>
          <Link
            href="/scenarios"
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Autres scénarios
          </Link>
        </div>
      </div>
    </main>
  )
}
