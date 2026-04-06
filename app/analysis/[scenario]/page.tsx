'use client'
import { useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { scenarios } from '@/data/scenarios'
import type { AnalysisAnswers } from '@/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const scenario = scenarios.find((s) => s.id === params.scenario)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnalysisAnswers>({})

  if (!scenario) return <div className="p-8 text-red-500">Scénario introuvable.</div>

  const questions = scenario.questions
  const currentQuestion = questions[currentIndex]
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100)

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      const params = new URLSearchParams(answers as Record<string, string>)
      router.push(`/result/${scenario.id}?${params.toString()}`)
    }
  }

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1))

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-6 py-10 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Accueil</Link>
          <span>/</span>
          <Link href="/scenarios" className="hover:text-gray-700">Scénarios</Link>
          <span>/</span>
          <span className="text-gray-900">{scenario.title}</span>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Question {currentIndex + 1} sur {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 flex-1">
          <h2 className="text-xl font-medium text-gray-900 mb-6 leading-snug">
            {currentQuestion.text}
          </h2>

          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                  className={`flex items-center gap-3 p-4 border rounded-xl text-left transition-all ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
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

        <div className="flex justify-between mt-6">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} /> Précédent
          </button>
          <button
            onClick={goNext}
            className="flex items-center gap-1 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            {currentIndex === questions.length - 1 ? 'Voir les résultats' : 'Suivant'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </main>
  )
}
