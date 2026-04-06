import type { Scenario, AnalysisAnswers, Recommendation } from '@/types'

/**
 * Inference engine — V1 placeholder.
 * Computes a confidence-adjusted recommendation based on user answers.
 * In V2, replace with a proper rule engine or AI-backed scoring.
 */
export function computeRecommendation(
  scenario: Scenario,
  answers: AnalysisAnswers
): Recommendation & { adjustedConfidence: number } {
  const totalQuestions = scenario.questions.length
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length
  const completionRate = answeredCount / totalQuestions

  // Base confidence from scenario definition
  let confidence = scenario.recommendation.confidence

  // Boost confidence for complete questionnaires
  if (completionRate === 1) confidence = Math.min(98, confidence + 5)
  else if (completionRate >= 0.8) confidence = Math.min(95, confidence + 2)
  else if (completionRate < 0.5) confidence = Math.max(60, confidence - 10)

  // Scenario-specific rules (V1: simple heuristics)
  const rules = getScenarioRules(scenario.id, answers)
  confidence = Math.min(98, Math.max(50, confidence + rules.confidenceAdjustment))

  return {
    ...scenario.recommendation,
    adjustedConfidence: Math.round(confidence),
  }
}

interface RuleResult {
  confidenceAdjustment: number
  warnings: string[]
}

function getScenarioRules(scenarioId: string, answers: AnalysisAnswers): RuleResult {
  const warnings: string[] = []
  let confidenceAdjustment = 0

  switch (scenarioId) {
    case 'immediate': {
      if (answers['volume'] === 'very_high') confidenceAdjustment += 3
      if (answers['fraud_tolerance'] === 'high') {
        warnings.push('Tolérance fraude élevée : renforcer le monitoring post-transaction')
        confidenceAdjustment -= 2
      }
      if (answers['currencies'] === 'many') confidenceAdjustment += 2
      break
    }
    case 'subscription': {
      if (answers['dunning'] === 'none') {
        warnings.push('Absence de process dunning : risque élevé de churn involontaire')
        confidenceAdjustment -= 5
      }
      if (answers['dunning'] === 'advanced') confidenceAdjustment += 4
      if (answers['scale'] === 'enterprise') confidenceAdjustment += 3
      break
    }
    case 'parking': {
      if (answers['capture_vs_preauth'] === 'often_more') {
        warnings.push('Capture souvent supérieure à la pré-auth : vérifier le support incremental auth')
        confidenceAdjustment -= 3
      }
      if (answers['monitoring'] === 'realtime') confidenceAdjustment += 3
      if (answers['session_duration'] === 'very_long') confidenceAdjustment -= 2
      break
    }
    case 'debt': {
      if (answers['regulation'] === 'regulated') {
        warnings.push('Secteur réglementé : conformité obligatoire avant tout déploiement')
        confidenceAdjustment -= 3
      }
      if (answers['payment_plan'] === 'always') confidenceAdjustment += 2
      break
    }
    case 'sepa': {
      if (answers['r_transaction_rate'] === 'very_high') {
        warnings.push('Taux de R-transactions > 5% : investigation des causes requise')
        confidenceAdjustment -= 4
      }
      if (answers['pain008'] === 'direct') confidenceAdjustment += 4
      break
    }
    case 'refund': {
      if (answers['validation_process'] === 'auto') {
        warnings.push('Remboursement automatique : implémenter impérativement une idempotency key')
        confidenceAdjustment -= 2
      }
      if (answers['traceability'] === 'dedicated') confidenceAdjustment += 4
      if (answers['target_delay'] === 'instant') confidenceAdjustment += 2
      break
    }
  }

  return { confidenceAdjustment, warnings }
}
