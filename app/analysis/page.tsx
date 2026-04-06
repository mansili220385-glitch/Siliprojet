'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UNIVERSAL_QUESTIONS } from '@/data/questionnaire'
import { mockCases } from '@/data/mock/cases'
import type { AnalysisAnswers, InferenceSignals } from '@/types'
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'

export default function AnalysisPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnalysisAnswers>({})
  const [showMockCases, setShowMockCases] = useState(false)

  const questions = UNIVERSAL_QUESTIONS
  const currentQuestion = questions[currentIndex]
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100)

  const handleAnswer = (id: keyof InferenceSignals, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      submitAnswers(answers)
    }
  }

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1))

  const submitAnswers = (a: AnalysisAnswers) => {
    const params = new URLSearchParams(a as Record<string, string>)
    router.push(`/result?${params.toString()}`)
  }

  const loadMockCase = (caseId: string) => {
    const mc = mockCases.find((c) => c.id === caseId)
    if (!mc) return
    const mapped: AnalysisAnswers = {}
    for (const [k, v] of Object.entries(mc.signals)) {
      if (v !== null && v !== undefined) {
        if (k === 'paymentMethodType') {
          mapped[k as keyof InferenceSignals] = v as string
        } else {
          mapped[k as keyof InferenceSignals] = v ? 'true' : 'false'
        }
      }
    }
    submitAnswers(mapped)
  }

  const isAnswered = !!answers[currentQuestion.id as keyof InferenceSignals]
  const answeredCount = Object.keys(answers).length

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Accueil</Link>
          <span>/</span>
          <span className="text-gray-900">Analyse</span>
        </div>

        {/* Mock cases shortcut */}
        <div className="mb-6">
          <button
            onClick={() => setShowMockCases(!showMockCases)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Zap size={14} />
            {showMockCases ? 'Masquer les cas types' : 'Tester un cas type réaliste →'}
          </button>
          {showMockCases && (
            <div className="mt-3 grid grid-cols-1 gap-2">
              {mockCases.map((mc) => (
                <button
                  key={mc.id}
                  onClick={() => loadMockCase(mc.id)}
                  className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{mc.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{mc.description}</div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {mc.tags.map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Question {currentIndex + 1} / {questions.length}</span>
            <span>{answeredCount} réponse{answeredCount > 1 ? 's' : ''} enregistrée{answeredCount > 1 ? 's' : ''}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Signal {currentIndex + 1} — {currentQuestion.type === 'yesno' ? 'Oui / Non' : 'Choix'}
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-6 leading-snug">
            {currentQuestion.text}
          </h2>

          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id as keyof InferenceSignals] === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(currentQuestion.id as keyof InferenceSignals, opt.value)}
                  className={`flex items-center gap-3 p-4 border rounded-xl text-left transition-all ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-gray-900' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                  </div>
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 gap-3">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} /> Précédent
          </button>

          <div className="flex gap-2">
            {answeredCount >= 5 && currentIndex < questions.length - 1 && (
              <button
                onClick={() => submitAnswers(answers)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Analyser maintenant ({answeredCount} signaux)
              </button>
            )}
            <button
              onClick={goNext}
              className={`flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm transition-colors ${
                isAnswered
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isAnswered}
            >
              {currentIndex === questions.length - 1 ? 'Analyser →' : 'Suivant'}
              {currentIndex < questions.length - 1 && isAnswered && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
