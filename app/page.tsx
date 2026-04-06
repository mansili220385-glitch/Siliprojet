import Link from 'next/link'
import { ArrowRight, BarChart3, Shield, Zap, Brain } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-3">
          <span className="inline-block text-xs font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full uppercase tracking-wide">
            Moteur de raisonnement paiement
          </span>
        </div>

        <h1 className="text-4xl font-semibold text-gray-900 leading-tight mb-4">
          Coach Architecture<br />
          <span className="text-blue-600">Paiement</span>
        </h1>

        <p className="text-lg text-gray-600 max-w-xl mb-8 leading-relaxed">
          Répondez à 15 questions sur votre contexte métier.
          Le moteur de raisonnement identifie le modèle de paiement optimal
          et génère une analyse complète — risques, KPIs, données critiques,
          statuts, scénarios de défaillance.
        </p>

        <div className="flex gap-4 mb-16 flex-wrap">
          <Link
            href="/analysis"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Démarrer l'analyse
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/scenarios"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Vue experte par scénario
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-100 pt-12">
          {[
            { icon: <Brain size={18} />, title: 'Moteur de règles', desc: '15 signaux métier analysés pour inférer le bon modèle' },
            { icon: <BarChart3 size={18} />, title: '9 modèles', desc: 'One-off, MIT, pré-auth, SEPA, recouvrement, remboursement...' },
            { icon: <Zap size={18} />, title: 'Cas types', desc: '5 cas réalistes préconfigurés pour tester le moteur' },
            { icon: <Shield size={18} />, title: 'Vue experte', desc: 'Flux, données critiques, KPIs, cas de défaillance par scénario' },
          ].map((item) => (
            <div key={item.title} className="p-5 border border-gray-100 rounded-xl">
              <div className="text-blue-600 mb-3">{item.icon}</div>
              <h3 className="font-medium text-gray-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
