'use client'
import Link from 'next/link'
import { scenarios } from '@/data/scenarios'
import { ArrowRight, ChevronLeft } from 'lucide-react'

const badgeStyles: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700',
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
  coral: 'bg-orange-50 text-orange-700',
}

export default function ScenariosPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ChevronLeft size={14} /> Accueil
        </Link>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Choisissez un scénario</h1>
        <p className="text-gray-500 mb-8">Sélectionnez le type d'architecture de paiement à analyser.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col hover:border-gray-200 hover:shadow-sm transition-all">
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-4 w-fit ${badgeStyles[s.badgeVariant]}`}>
                {s.badge}
              </span>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5">{s.description}</p>
              <div className="flex gap-2">
                <Link
                  href={`/analysis/${s.id}`}
                  className="flex-1 flex items-center justify-center gap-1 bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Analyser <ArrowRight size={14} />
                </Link>
                <Link
                  href={`/expert/${s.id}`}
                  className="flex items-center justify-center px-3 border border-gray-200 text-gray-700 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Expert
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
