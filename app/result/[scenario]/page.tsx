'use client'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { scenarios } from '@/data/scenarios'
import { computeRecommendation } from '@/lib/inference'
import type { AnalysisAnswers } from '@/types'
import { ArrowRight, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react'

const riskColors: Record<string, string> = {
  Faible: 'bg-green-50 text-green-700',
  Moyen: 'bg-amber-50 text-amber-700',
  Élevé: 'bg-red-50 text-red-700',
  Critique: 'bg-red-100 text-red-800 font-semibold',
}

export default function ResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const scenario = scenarios.find((s) => s.id === params.scenario)

  if (!scenario) return <div className="p-8 text-red-500">Scénario introuvable.</div>

  const answers: AnalysisAnswers = {}
  scenario.questions.forEach((q) => {
    const val = searchParams.get(q.id)
    if (val) answers[q.id] = val
  })

  const recommendation = computeRecommendation(scenario, answers)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Accueil</Link>
          <span>/</span>
          <Link href="/scenarios" className="hover:text-gray-700">Scénarios</Link>
          <span>/</span>
          <span className="text-gray-900">Résultat — {scenario.title}</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Modèle recommandé</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{recommendation.model}</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{recommendation.explanation}</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${recommendation.adjustedConfidence}%` }}
              />
            </div>
            <span className="text-sm font-medium text-green-700">{recommendation.adjustedConfidence}% de confiance</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-medium text-gray-900">Risques identifiés</h3>
          </div>
          <div className="flex flex-col gap-3">
            {scenario.risks.map((risk) => (
              <div key={risk.label} className="flex items-start gap-3">
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${riskColors[risk.level]}`}>
                  {risk.level}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{risk.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{risk.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-blue-500" />
              <h3 className="font-medium text-gray-900">KPIs à suivre</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {scenario.kpis.map((kpi) => (
                <span key={kpi.label} className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                  {kpi.label}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={16} className="text-purple-500" />
              <h3 className="font-medium text-gray-900">Questions clés</h3>
            </div>
            <ul className="flex flex-col gap-2">
              {recommendation.keyQuestions.map((q) => (
                <li key={q} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">•</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/expert/${scenario.id}`}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Vue experte complète <ArrowRight size={14} />
          </Link>
          <Link
            href={`/analysis/${scenario.id}`}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Recommencer
          </Link>
          <Link
            href="/scenarios"
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Autre scénario
          </Link>
        </div>
      </div>
    </main>
  )
}
