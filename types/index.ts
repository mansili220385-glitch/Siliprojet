// ─── Core question/answer types ──────────────────────────────────────────────

export interface AnswerOption {
  label: string
  value: string
}

export interface Question {
  id: keyof InferenceSignals
  text: string
  type: 'select' | 'radio' | 'yesno'
  options: AnswerOption[]
  weight?: number
}

// ─── Inference signals ───────────────────────────────────────────────────────

export interface InferenceSignals {
  amountKnownUpfront: boolean | null
  amountVariable: boolean | null
  customerPresentAtFinalDebit: boolean | null
  serviceConsumedBeforePayment: boolean | null
  paymentDeferred: boolean | null
  paymentMethodReusable: boolean | null
  paymentMethodType: 'card' | 'bank' | null
  initialConsent: boolean | null
  mandateRequired: boolean | null
  failureCreatesDebt: boolean | null
  isSubscription: boolean | null
  isRefund: boolean | null
  futureDebitWithoutCustomer: boolean | null
  strongReconciliationNeeded: boolean | null
  highOperationalRisk: boolean | null
}

// ─── Recommendation models ────────────────────────────────────────────────────

export type PaymentModel =
  | 'one-off'
  | 'recurring'
  | 'mit-post-service'
  | 'pre-auth-capture'
  | 'multi-authorization'
  | 'sepa-sdd'
  | 'debt-recovery'
  | 'refund'
  | 'hybrid'

// ─── Inference result ─────────────────────────────────────────────────────────

export interface RiskItem {
  label: string
  level: 'Faible' | 'Moyen' | 'Eleve' | 'Critique'
  description: string
}

export interface FailureScenario {
  trigger: string
  consequence: string
  mitigation: string
}

export interface KPIItem {
  label: string
  description?: string
  unit?: string
}

export interface DecisionStep {
  signal: string
  value: string
  impact: string
}

export interface InferenceResult {
  model: PaymentModel
  modelLabel: string
  confidence: number

  simpleSummary: string
  businessReading: string
  strategicReading: string
  expertLens: string

  alternatives: Array<{
    model: PaymentModel
    label: string
    reason: string
    score: number
  }>

  businessRisks: RiskItem[]
  operationalRisks: RiskItem[]
  reconciliationRisks: RiskItem[]

  criticalDataPoints: string[]
  statusesToDistinguish: string[]
  failureScenarios: FailureScenario[]
  kpis: KPIItem[]

  decisionTree: DecisionStep[]

  ambiguousSignals?: string[]
  clarifyingQuestions?: string[]
}

// ─── Scenario & questionnaire ─────────────────────────────────────────────────

export interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeVariant: 'blue' | 'teal' | 'amber' | 'red' | 'purple' | 'coral'
  questions: Question[]
  risks: RiskItem[]
  kpis: KPIItem[]
  architecture: ArchitectureBlock
  recommendation: LegacyRecommendation
}

export interface ArchitectureBlock {
  actors: string[]
  flow: string[]
  criticalData: string[]
  statusLifecycle: string[]
  failureCases: Array<{ failure: string; response: string }>
  reconciliationNotes?: string
}

export interface LegacyRecommendation {
  model: string
  explanation: string
  confidence: number
  keyQuestions: string[]
  dataPoints: string[]
}

export type AnalysisAnswers = Partial<Record<keyof InferenceSignals, string>>

// ─── Mock cases ───────────────────────────────────────────────────────────────

export interface MockCase {
  id: string
  title: string
  description: string
  signals: Partial<InferenceSignals>
  expectedModel: PaymentModel
  tags: string[]
}
