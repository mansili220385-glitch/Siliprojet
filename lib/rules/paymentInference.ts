import type {
  InferenceSignals,
  InferenceResult,
  PaymentModel,
  DecisionStep,
  RiskItem,
} from '@/types'
import {
  MODEL_LABELS,
  MODEL_DESCRIPTIONS,
  MODEL_CRITICAL_DATA,
  MODEL_STATUSES,
  MODEL_KPIS,
  MODEL_FAILURES,
} from './paymentModels'

// ─── Scoring engine ───────────────────────────────────────────────────────────
// Each model receives a score from 0-100 based on the signals.
// Rules are additive (positive signals boost) and subtractive (contradicting signals penalize).

interface ModelScore {
  model: PaymentModel
  score: number
  matchedSignals: string[]
}

function scoreModels(s: InferenceSignals): ModelScore[] {
  const scores: ModelScore[] = [
    { model: 'one-off', score: 0, matchedSignals: [] },
    { model: 'recurring', score: 0, matchedSignals: [] },
    { model: 'mit-post-service', score: 0, matchedSignals: [] },
    { model: 'pre-auth-capture', score: 0, matchedSignals: [] },
    { model: 'multi-authorization', score: 0, matchedSignals: [] },
    { model: 'sepa-sdd', score: 0, matchedSignals: [] },
    { model: 'debt-recovery', score: 0, matchedSignals: [] },
    { model: 'refund', score: 0, matchedSignals: [] },
    { model: 'hybrid', score: 0, matchedSignals: [] },
  ]

  const add = (model: PaymentModel, pts: number, reason: string) => {
    const entry = scores.find((x) => x.model === model)!
    entry.score += pts
    if (pts > 0) entry.matchedSignals.push(reason)
  }

  // ── REFUND — highest priority discriminator ──────────────────────────────
  if (s.isRefund === true) {
    add('refund', 60, "Le cas est explicitement un remboursement")
    add('one-off', -40, "Cas de remboursement — non applicable")
    add('recurring', -40, "Cas de remboursement — non applicable")
    add('sepa-sdd', -30, "Cas de remboursement — non applicable")
  }
  if (s.isRefund === false) {
    add('refund', -30, "Ce n'est pas un remboursement")
  }

  // ── SEPA SDD ──────────────────────────────────────────────────────────────
  if (s.paymentMethodType === 'bank') {
    add('sepa-sdd', 40, "Moyen de paiement bancaire (virement/prélèvement)")
    add('one-off', -20, "Moyen bancaire — one-off carte non applicable")
    add('recurring', -10, "SEPA plus adapté pour les débits bancaires récurrents")
  }
  if (s.mandateRequired === true) {
    add('sepa-sdd', 30, "Un mandat est requis")
    add('one-off', -15, "Mandat requis — one-off sans mandat non applicable")
  }
  if (s.paymentMethodType === 'card') {
    add('sepa-sdd', -30, "Moyen de paiement carte — SEPA non applicable")
  }

  // ── ONE-OFF ────────────────────────────────────────────────────────────────
  if (s.amountKnownUpfront === true) {
    add('one-off', 20, "Montant connu à l'avance")
    add('pre-auth-capture', 10, "Montant connu — pré-auth plausible")
  }
  if (s.amountVariable === false) {
    add('one-off', 15, "Montant fixe")
    add('pre-auth-capture', -10, "Montant fixe — pré-auth moins pertinente")
    add('multi-authorization', -20, "Montant fixe — multi-auth non justifiée")
  }
  if (s.customerPresentAtFinalDebit === true) {
    add('one-off', 25, "Client présent au moment du débit")
    add('recurring', -15, "Client présent — MIT sans présence non applicable")
    add('mit-post-service', -20, "Client présent au débit — MIT post-service non applicable")
  }
  if (s.paymentDeferred === false) {
    add('one-off', 20, "Paiement immédiat")
    add('pre-auth-capture', -15, "Paiement immédiat — capture différée non applicable")
    add('mit-post-service', -25, "Paiement immédiat — MIT post-service non applicable")
  }
  if (s.isSubscription === false && s.isRefund === false && s.failureCreatesDebt === false) {
    add('one-off', 10, "Cas simple sans abonnement ni dette")
  }

  // ── RECURRING MIT ─────────────────────────────────────────────────────────
  if (s.isSubscription === true) {
    add('recurring', 40, "Le cas est un abonnement")
    add('sepa-sdd', 15, "Abonnement compatible SEPA SDD en zone euro")
    add('one-off', -30, "Abonnement — one-off non applicable")
  }
  if (s.futureDebitWithoutCustomer === true) {
    add('recurring', 30, "Des débits futurs se font sans présence du client (MIT)")
    add('sepa-sdd', 20, "Débit sans présence client — SEPA SDD ou MIT")
    add('one-off', -25, "Débit sans présence — one-off non applicable")
  }
  if (s.paymentMethodReusable === true) {
    add('recurring', 20, "Le moyen de paiement est réutilisable")
    add('mit-post-service', 10, "Moyen réutilisable — MIT post-service plausible")
    add('sepa-sdd', 10, "Moyen réutilisable — SEPA possible")
  }
  if (s.initialConsent === true && s.futureDebitWithoutCustomer === true) {
    add('recurring', 20, "Consentement initial + débits futurs MIT — modèle récurrent classique")
    add('sepa-sdd', 15, "Consentement initial — mandat SEPA compatible")
  }

  // ── MIT POST-SERVICE ──────────────────────────────────────────────────────
  if (s.serviceConsumedBeforePayment === true) {
    add('mit-post-service', 35, "Le service est consommé avant le paiement final")
    add('pre-auth-capture', 20, "Service avant paiement — pré-auth alternative crédible")
    add('one-off', -20, "Service avant paiement — one-off immédiat non applicable")
  }
  if (s.amountVariable === true && s.serviceConsumedBeforePayment === true) {
    add('mit-post-service', 20, "Montant variable + service avant paiement — MIT post-service")
    add('pre-auth-capture', 15, "Montant variable — pré-auth pour sécuriser")
  }
  if (s.customerPresentAtFinalDebit === false && s.serviceConsumedBeforePayment === true) {
    add('mit-post-service', 25, "Client absent au débit final + service consommé = MIT post-service")
    add('pre-auth-capture', 10, "Client absent — pré-auth pour sécuriser les fonds avant service")
  }

  // ── PRE-AUTH CAPTURE ──────────────────────────────────────────────────────
  if (s.amountVariable === true && s.customerPresentAtFinalDebit === false) {
    add('pre-auth-capture', 25, "Montant variable et client absent au débit — pré-auth recommandée")
  }
  if (s.paymentDeferred === true && s.amountKnownUpfront === true) {
    add('pre-auth-capture', 25, "Paiement différé mais montant connu — delayed capture ou pré-auth")
    add('one-off', -5, "Paiement différé — one-off immédiat moins adapté")
  }
  if (s.paymentMethodType === 'card' && s.serviceConsumedBeforePayment === true && s.customerPresentAtFinalDebit === false) {
    add('pre-auth-capture', 20, "Carte + service avant paiement + client absent — pré-auth protège le marchand")
  }
  if (s.highOperationalRisk === true) {
    add('pre-auth-capture', 10, "Risque opérationnel élevé — pré-auth sécurise les fonds")
  }

  // ── MULTI-AUTHORIZATION ───────────────────────────────────────────────────
  if (s.amountVariable === true && s.paymentDeferred === true && s.serviceConsumedBeforePayment === true) {
    add('multi-authorization', 25, "Montant variable + différé + service en cours — multi-auth envisageable")
    add('pre-auth-capture', 15, "Même contexte — pré-auth alternative")
  }
  if (s.highOperationalRisk === true && s.amountVariable === true) {
    add('multi-authorization', 15, "Risque élevé + montant variable — ajustements successifs utiles")
  }
  // Multi-auth nécessite un support réseau spécifique
  if (s.paymentMethodType === 'bank') {
    add('multi-authorization', -30, "Multi-auth non applicable sur moyen bancaire")
  }

  // ── DEBT RECOVERY ─────────────────────────────────────────────────────────
  if (s.failureCreatesDebt === true) {
    add('debt-recovery', 50, "Un échec de paiement crée une dette — flux recouvrement nécessaire")
    add('recurring', 10, "Debt recovery souvent couplé à un flux récurrent")
  }
  if (s.strongReconciliationNeeded === true && s.failureCreatesDebt === true) {
    add('debt-recovery', 15, "Réconciliation forte + risque dette — recouvrement structuré indispensable")
  }
  if (s.isSubscription === true && s.failureCreatesDebt === true) {
    add('debt-recovery', 20, "Abonnement avec risque de dette — dunning + recovery à planifier")
  }

  // ── STRONG RECONCILIATION BOOST ───────────────────────────────────────────
  if (s.strongReconciliationNeeded === true) {
    add('sepa-sdd', 10, "Réconciliation forte — SEPA offre une traçabilité interbancaire")
    add('recurring', 5, "Réconciliation forte — paiement récurrent structuré")
  }

  // ── HYBRID BOOST (ambiguous cases) ───────────────────────────────────────
  // Hybrid gets a baseline if many signals are null
  const nullCount = Object.values(s).filter((v) => v === null).length
  if (nullCount >= 8) {
    add('hybrid', 30, "Trop peu de signaux renseignés — cas ambigu")
  }
  if (nullCount >= 5) {
    add('hybrid', 10, "Plusieurs signaux manquants")
  }

  return scores.sort((a, b) => b.score - a.score)
}

// ─── Decision tree builder ────────────────────────────────────────────────────

function buildDecisionTree(s: InferenceSignals, winner: PaymentModel): DecisionStep[] {
  const steps: DecisionStep[] = []

  const sig = (label: string, value: boolean | string | null, impact: string) => {
    if (value !== null) {
      steps.push({
        signal: label,
        value: value === true ? 'Oui' : value === false ? 'Non' : String(value),
        impact,
      })
    }
  }

  sig("Montant connu à l'avance", s.amountKnownUpfront,
    s.amountKnownUpfront ? "Favorise les modèles à montant fixe (one-off, SEPA)" : "Oriente vers pré-auth ou MIT post-service")

  sig("Montant variable", s.amountVariable,
    s.amountVariable ? "Oriente vers pré-auth, multi-auth ou MIT post-service" : "Simplifie le choix vers one-off ou récurrent")

  sig("Client présent au débit final", s.customerPresentAtFinalDebit,
    s.customerPresentAtFinalDebit ? "Favorise le one-off ou CIT" : "Oriente vers MIT, récurrent ou SEPA")

  sig("Service consommé avant paiement", s.serviceConsumedBeforePayment,
    s.serviceConsumedBeforePayment ? "Favorise MIT post-service ou pré-auth (protection marchand)" : "Paiement standard possible")

  sig("Paiement différé", s.paymentDeferred,
    s.paymentDeferred ? "Exclut le one-off immédiat, oriente vers pré-auth ou MIT" : "Simplifie vers one-off immédiat")

  sig("Moyen de paiement réutilisable", s.paymentMethodReusable,
    s.paymentMethodReusable ? "Nécessaire pour récurrent, MIT ou SEPA" : "Cas unique, one-off probable")

  sig("Type de moyen de paiement", s.paymentMethodType,
    s.paymentMethodType === 'bank' ? "Oriente fortement vers SEPA SDD" :
    s.paymentMethodType === 'card' ? "Exclut SEPA, oriente vers carte" : "Non déterminé")

  sig("Consentement initial recueilli", s.initialConsent,
    s.initialConsent ? "Requis pour MIT et SEPA — bonne pratique documentée" : "Attention aux règles réseau sur les MIT sans CIT")

  sig("Mandat requis", s.mandateRequired,
    s.mandateRequired ? "Oriente fortement vers SEPA SDD" : "SEPA moins probable")

  sig("Échec crée une dette", s.failureCreatesDebt,
    s.failureCreatesDebt ? "Flux de recouvrement indispensable en parallèle" : "Pas de risque de dette résiduelle")

  sig("Abonnement", s.isSubscription,
    s.isSubscription ? "Oriente fortement vers récurrent (MIT carte) ou SEPA SDD" : "Cas ponctuel ou post-service")

  sig("Remboursement", s.isRefund,
    s.isRefund ? "Oriente vers flux refund dédié" : "Flux de paiement standard")

  sig("Débits futurs sans présence client", s.futureDebitWithoutCustomer,
    s.futureDebitWithoutCustomer ? "Définit un flux MIT — règles réseau spécifiques s'appliquent" : "Pas de MIT prévu")

  sig("Réconciliation forte nécessaire", s.strongReconciliationNeeded,
    s.strongReconciliationNeeded ? "Renforce la nécessité d'un identifiant de corrélation robuste" : "Réconciliation standard")

  sig("Risque opérationnel élevé", s.highOperationalRisk,
    s.highOperationalRisk ? "Justifie des mécanismes de sécurisation supplémentaires (pré-auth, idempotency)" : "Risque maîtrisé")

  return steps
}

// ─── Risk builder ─────────────────────────────────────────────────────────────

function buildBusinessRisks(s: InferenceSignals, model: PaymentModel): RiskItem[] {
  const risks: RiskItem[] = []

  if (model === 'one-off' || model === 'recurring') {
    risks.push({ label: "Fraude à la carte (CNP)", level: "Eleve", description: "Transactions sans présence physique — exposition au phishing et compromission de données." })
    risks.push({ label: "Chargeback client", level: "Eleve", description: "Contestation post-transaction — coût direct et impact sur le taux marchand." })
  }
  if (model === 'recurring') {
    risks.push({ label: "Churn involontaire", level: "Eleve", description: "Perte d'abonné suite à un échec de paiement évitable (carte expirée, dunning mal configuré)." })
  }
  if (model === 'mit-post-service') {
    risks.push({ label: "Service délivré sans paiement", level: "Critique", description: "Si le MIT échoue après consommation, le service est perdu sans contrepartie." })
  }
  if (model === 'pre-auth-capture' || model === 'multi-authorization') {
    risks.push({ label: "Fonds bloqués chez le client", level: "Moyen", description: "La pré-auth immobilise des fonds sans débit réel, impactant la trésorerie disponible du client." })
  }
  if (model === 'sepa-sdd') {
    risks.push({ label: "Contestation mandat (8 semaines CORE)", level: "Eleve", description: "Le client peut contester un prélèvement sans justification pendant 8 semaines." })
  }
  if (model === 'debt-recovery') {
    risks.push({ label: "Créance irrécouvrable", level: "Critique", description: "Si la prescription est atteinte ou le débiteur insolvable, la créance doit être provisionnée." })
    risks.push({ label: "Non-conformité RGPD", level: "Critique", description: "Le traitement des données dans le recouvrement est soumis à des règles strictes." })
  }
  if (s.highOperationalRisk === true) {
    risks.push({ label: "Rupture de flux opérationnel", level: "Eleve", description: "Un arrêt du flux de paiement impacte directement la continuité du service." })
  }

  return risks
}

function buildOperationalRisks(s: InferenceSignals, model: PaymentModel): RiskItem[] {
  const risks: RiskItem[] = []

  risks.push({ label: "Timeout ou indisponibilité PSP", level: "Moyen", description: "Toujours implémenter une idempotency key et une logique de vérification de statut avant retry." })

  if (model === 'pre-auth-capture' || model === 'multi-authorization') {
    risks.push({ label: "Expiration de la pré-autorisation", level: "Eleve", description: "Délai réseau (7-30j) à surveiller. Alerte automatique J-2 recommandée." })
  }
  if (model === 'sepa-sdd') {
    risks.push({ label: "Rejet du fichier PAIN.008", level: "Moyen", description: "Un fichier XML malformé bloque tout le batch. Valider le format avant soumission." })
  }
  if (model === 'recurring' || model === 'mit-post-service') {
    risks.push({ label: "Token expiré ou révoqué", level: "Moyen", description: "Mettre en place Account Updater et un process de rafraîchissement des tokens." })
    risks.push({ label: "Non-conformité règles MIT réseau", level: "Eleve", description: "Les règles Visa/MC encadrent strictement les MIT (fréquence, montant, référence CIT)." })
  }
  if (model === 'refund') {
    risks.push({ label: "Double remboursement", level: "Critique", description: "Sans idempotency key, un retry peut rembourser deux fois." })
  }
  if (s.strongReconciliationNeeded === true) {
    risks.push({ label: "Désynchronisation état système / PSP", level: "Eleve", description: "L'état interne et l'état PSP peuvent diverger. Mettre en place des webhooks + reconciliation batch." })
  }

  return risks
}

function buildReconciliationRisks(s: InferenceSignals, model: PaymentModel): RiskItem[] {
  const risks: RiskItem[] = []

  if (model === 'pre-auth-capture' || model === 'multi-authorization') {
    risks.push({ label: "Écart pré-auth vs capture", level: "Moyen", description: "Réconcilier systématiquement le montant autorisé et le montant capturé pour chaque transaction." })
  }
  if (model === 'sepa-sdd') {
    risks.push({ label: "R-transactions non traitées", level: "Eleve", description: "Chaque R-transaction doit être qualifiée (motif), relancée ou basculée en recouvrement." })
  }
  if (model === 'recurring' || model === 'sepa-sdd') {
    risks.push({ label: "Décalage MRR comptable vs encaissements réels", level: "Moyen", description: "Distinguer le MRR facturé du cash effectivement encaissé dans les reportings." })
  }
  if (model === 'debt-recovery') {
    risks.push({ label: "Provision insuffisante sur créances douteuses", level: "Eleve", description: "Provisionner selon l'ancienneté des créances et les probabilités de recouvrement." })
  }
  if (model === 'refund') {
    risks.push({ label: "Remboursement sans lien comptable", level: "Moyen", description: "Chaque remboursement doit avoir un motif documenté et être lié à la transaction originale." })
  }
  if (s.strongReconciliationNeeded === true) {
    risks.push({ label: "Absence d'identifiant de corrélation", level: "Critique", description: "Sans correlation_id robuste, la réconciliation multi-flux est impossible à grande échelle." })
  }

  return risks
}

// ─── Text generators ──────────────────────────────────────────────────────────

function generateSimpleSummary(model: PaymentModel, s: InferenceSignals): string {
  const summaries: Record<PaymentModel, string> = {
    'one-off': "Votre cas correspond à un paiement simple, unique et immédiat. Le client est présent, le montant est connu, le débit se fait en une fois. C'est le modèle le plus simple à implémenter et le mieux couvert par les PSP du marché.",
    'recurring': "Votre cas correspond à un abonnement avec prélèvements récurrents initiés par le marchand. Le client donne son accord une fois (CIT), puis les débits suivants se font automatiquement (MIT) sans nécessiter sa présence.",
    'mit-post-service': "Votre cas correspond à un débit initié après consommation du service, lorsque le montant final n'est connu qu'à la fin. Le client a consenti au départ, mais n'est plus là au moment du débit réel — c'est un MIT post-service.",
    'pre-auth-capture': "Votre cas correspond à une pré-autorisation suivie d'une capture. Le montant est réservé en amont pour sécuriser les fonds, puis prélevé au montant réel après consommation. Modèle courant pour l'hôtellerie, le parking et les locations.",
    'multi-authorization': "Votre cas nécessite plusieurs ajustements du montant autorisé en cours de session. C'est le modèle d'incremental authorization, plus complexe à implémenter mais nécessaire quand le montant final est incertain et variable pendant la prestation.",
    'sepa-sdd': "Votre cas correspond à un prélèvement SEPA. Le client signe un mandat qui autorise des prélèvements futurs depuis son compte bancaire. C'est le modèle standard pour les paiements B2C et B2B récurrents en zone euro.",
    'debt-recovery': "Votre cas implique un risque de dette en cas d'échec de paiement. Il faut prévoir un flux de recouvrement structuré : dunning automatique, plans de paiement, et escalade vers le recouvrement amiable si nécessaire.",
    'refund': "Votre cas est centré sur la gestion des remboursements. Le flux est l'inverse du paiement initial, avec des contraintes spécifiques sur la traçabilité, l'idempotence et les délais réseau.",
    'hybrid': "Votre cas est ambigu et implique potentiellement plusieurs modèles de paiement. Des clarifications métier sont nécessaires avant de trancher sur l'architecture définitive.",
  }
  return summaries[model]
}

function generateBusinessReading(model: PaymentModel, s: InferenceSignals): string {
  const readings: Record<PaymentModel, string> = {
    'one-off': "Côté métier, ce modèle maximise la simplicité et la rapidité de l'expérience client. Le risque principal est la fraude CNP et les chargebacks. La priorité opérationnelle est d'optimiser le taux de conversion et d'autorisation, et d'avoir un process de gestion des refus clair côté service client.",
    'recurring': "Côté métier, ce modèle est le cœur des revenus récurrents (SaaS, streaming, media). Le levier principal de croissance est la réduction du churn involontaire — souvent sous-estimé. Un point de churn involontaire économisé peut représenter plusieurs points de LTV. Le dunning est une fonction métier critique, pas seulement technique.",
    'mit-post-service': "Côté métier, ce modèle optimise l'expérience en débitant après service, mais crée un risque de créance si le MIT échoue. La règle d'or : ne jamais démarrer un service sans un moyen de paiement sécurisé et vérifié. Le montant final doit être communiqué clairement au client avant débit.",
    'pre-auth-capture': "Côté métier, la pré-autorisation protège le marchand en sécurisant les fonds avant service, tout en préservant l'expérience client (pas de débit immédiat). Le risque métier principal est la gestion des pré-auths expirées et la communication claire des conditions au client.",
    'multi-authorization': "Côté métier, ce modèle est justifié quand le montant varie significativement pendant la prestation (carburant, consommations au bar, extras hôtel). Il nécessite une relation contractuelle claire avec l'acquéreur sur le support de l'incremental auth.",
    'sepa-sdd': "Côté métier, SEPA SDD est le moyen de paiement le moins coûteux en zone euro pour les paiements récurrents. Il est très adapté au B2B (SEPA B2B, irrévocable). En B2C (SEPA CORE), les 8 semaines de contestation sont un risque à intégrer dans le modèle économique.",
    'debt-recovery': "Côté métier, le recouvrement est une fonction à part entière, pas juste un fallback. Structurer le processus (amiable, plan de paiement, judiciaire) et mesurer le taux de récupération sont des leviers directs sur la marge nette.",
    'refund': "Côté métier, la qualité du processus de remboursement est directement liée au NPS et à la rétention client. Un remboursement rapide et sans friction transforme une expérience négative en facteur de fidélisation. Le risque principal est la fraude au remboursement.",
    'hybrid': "Côté métier, un flux hybride est souvent le résultat d'une évolution produit ou d'une acquisition. Avant d'implémenter, clarifier les périmètres de chaque flux, identifier les cas limites, et documenter la règle de priorité quand deux modèles s'appliquent simultanément.",
  }
  return readings[model]
}

function generateStrategicReading(model: PaymentModel, s: InferenceSignals): string {
  const readings: Record<PaymentModel, string> = {
    'one-off': "Stratégiquement, ce modèle est une commodité — l'avantage concurrentiel se joue sur la conversion (taux d'auth, 3DS fluide) et le coût (négociation interchange). À fort volume, envisager une relation directe avec un acquéreur pour réduire les frais.",
    'recurring': "Stratégiquement, l'abonnement transforme la relation client en revenu prédictible. L'architecture de paiement doit être pensée comme un levier de rétention, pas juste de facturation. Investir dans le dunning avancé et l'Account Updater a un ROI mesurable directement sur le MRR.",
    'mit-post-service': "Stratégiquement, ce modèle reflète une confiance accordée au client (service avant paiement). Il faut l'associer à un scoring de risque client et une politique claire sur les impayés pour ne pas en faire un vecteur de pertes.",
    'pre-auth-capture': "Stratégiquement, la pré-auth est un contrat implicite avec le client. Communiquer clairement sur les délais de libération différencie les opérateurs sur l'expérience client. C'est aussi un enjeu de trésorerie pour les clients (fonds bloqués).",
    'multi-authorization': "Stratégiquement, ce modèle nécessite un investissement technique significatif (support acquéreur, gestion des séquences). Il n'est justifié que si la variabilité du montant est structurelle et non évitable par d'autres moyens (forfait, pré-auth large).",
    'sepa-sdd': "Stratégiquement, SEPA SDD est un actif de fidélisation fort — le débit bancaire crée moins de friction et de contestation que la carte. En B2B, le modèle SEPA B2B (irrévocable) est encore sous-utilisé et représente un avantage compétitif sur les créances.",
    'debt-recovery': "Stratégiquement, la qualité du recouvrement reflète la santé financière de l'entreprise. Un taux de récupération élevé et des délais courts améliorent directement le free cash flow. Investir dans l'automatisation du dunning et dans la qualification des créances crée un avantage opérationnel durable.",
    'refund': "Stratégiquement, les remboursements sont un coût mais aussi un signal d'amélioration produit. Analyser les motifs de remboursement permet d'identifier les défauts systémiques. Un process de remboursement rapide et transparent est un levier de différenciation sur les marchés matures.",
    'hybrid': "Stratégiquement, un flux hybride non documenté est une dette technique et opérationnelle. Investir dans sa documentation et sa refactorisation est prioritaire avant de le faire passer à l'échelle.",
  }
  return readings[model]
}

function generateExpertLens(model: PaymentModel, s: InferenceSignals): string {
  const lenses: Record<PaymentModel, string> = {
    'one-off': "Un expert regarderait en priorité : le taux d'autorisation réseau (objectif > 95%), le taux de 3DS frictionless vs challenge, la distribution des codes de refus, et le ratio chargeback sur revenu (seuil Visa/MC à 1%). Il vérifierait aussi la cohérence entre capture_method (automatique vs manuelle) et le flux métier.",
    'recurring': "Un expert regarderait : la fenêtre de retry MIT (conformité règles réseau), le taux de succès par jour du mois (les prélèvements en fin de mois ont des taux de refus plus élevés), la cohérence entre le CIT de référence et chaque MIT, et la traçabilité du dunning dans les logs.",
    'mit-post-service': "Un expert vérifierait que chaque MIT référence le CIT initial (exigence réseau), que le montant du MIT respecte le plafond communiqué au client, et qu'un mécanisme de fallback vers le recouvrement est en place dès le premier échec. Il demanderait aussi : quelle est la règle si le token est expiré entre le début et la fin du service ?",
    'pre-auth-capture': "Un expert regarderait : le support de l'incremental authorization chez l'acquéreur, le delta entre montant pré-auth et capture (détection d'anomalies), la supervision des pré-auths proches de l'expiry, et le process de release en cas d'annulation. Il questionnerait aussi la politique sur les sessions orphelines.",
    'multi-authorization': "Un expert demanderait d'abord : l'acquéreur supporte-t-il l'incremental auth pour ce BIN / ce réseau ? Il vérifierait la numérotation des séquences, la traçabilité des auth IDs successifs, et s'assurerait que la capture finale ne dépasse jamais le montant total autorisé cumulé.",
    'sepa-sdd': "Un expert regarderait l'ICS (Identifiant Créancier SEPA), la séquence des mandats (FRST/RCUR), le processus de gestion des R-transactions par code motif, et la conformité des délais de prénotification. Il vérifierait aussi la conservation des mandats signés (obligation légale) et les procédures en cas de contestation.",
    'debt-recovery': "Un expert vérifierait la base légale du traitement des données (RGPD), les délais de prescription par type de créance, le process de traçabilité des contacts (indispensable en cas de litige), et la règle de provisionnement comptable. Il demanderait aussi : qui décide du passage en contentieux, et selon quels critères ?",
    'refund': "Un expert vérifierait l'implémentation de l'idempotency key sur chaque appel refund, le process de validation à deux niveaux au-delà d'un seuil, les règles de détection de fraude au remboursement, et la cohérence entre le remboursement PSP et l'écriture comptable. Il questionnerait aussi la procédure pour les transactions > 180 jours.",
    'hybrid': "Un expert demanderait d'abord : quel est le flux prioritaire en cas de conflit ? Il rechercherait un correlation_id unique liant tous les flux, documenterait les états possibles de chaque sous-flux, et exigerait des tests de régression sur les cas limites avant mise en production.",
  }
  return lenses[model]
}

function getAlternatives(scores: ModelScore[], winner: PaymentModel): InferenceResult['alternatives'] {
  return scores
    .filter((s) => s.model !== winner && s.score > 10)
    .slice(0, 3)
    .map((s) => ({
      model: s.model,
      label: MODEL_LABELS[s.model],
      reason: s.matchedSignals[0] ?? "Certains signaux sont compatibles",
      score: Math.min(100, Math.max(0, s.score)),
    }))
}

function getClarifyingQuestions(s: InferenceSignals, winner: PaymentModel): string[] {
  const questions: string[] = []
  const nullCount = Object.values(s).filter((v) => v === null).length

  if (winner === 'hybrid' || nullCount >= 5) {
    questions.push("Le montant final est-il toujours connu avant de débiter le client ?")
    questions.push("Le client sera-t-il présent (connecté, en session) au moment du débit réel ?")
    questions.push("S'agit-il d'un paiement unique ou d'une série de paiements liés ?")
  }
  if (s.paymentMethodType === null) {
    questions.push("Le moyen de paiement est-il une carte bancaire ou un compte bancaire (virement/prélèvement) ?")
  }
  if (s.isSubscription === null && s.futureDebitWithoutCustomer === null) {
    questions.push("Y aura-t-il d'autres prélèvements futurs sur ce même client pour ce service ?")
  }
  if (winner === 'mit-post-service' || winner === 'pre-auth-capture') {
    questions.push("Le moyen de paiement du client sera-t-il toujours valide à la fin du service (token, pré-auth) ?")
    questions.push("Que se passe-t-il si le débit final échoue ? Le service est-il déjà consommé ?")
  }
  if (winner === 'recurring') {
    questions.push("Comment le consentement initial (CIT) est-il recueilli et conservé ?")
    questions.push("Quelle est la règle de retry en cas d'échec ? (fréquence, nombre max de tentatives)")
  }

  return questions
}

function getAmbiguousSignals(s: InferenceSignals, scores: ModelScore[]): string[] {
  const top3 = scores.slice(0, 3)
  const spread = top3[0].score - top3[2]?.score
  const ambiguous: string[] = []

  if (spread < 15) {
    ambiguous.push(`Trois modèles sont proches : ${top3.map((s) => MODEL_LABELS[s.model]).join(', ')}`)
  }
  if (s.serviceConsumedBeforePayment === true && s.customerPresentAtFinalDebit === null) {
    ambiguous.push("Présence du client au débit final non précisée — détermine le choix entre pré-auth et MIT post-service")
  }
  if (s.isSubscription === true && s.paymentMethodType === null) {
    ambiguous.push("Type de moyen de paiement non précisé — détermine le choix entre MIT carte et SEPA SDD")
  }
  if (s.amountVariable === true && s.serviceConsumedBeforePayment === null) {
    ambiguous.push("Contexte de consommation non précisé — détermine si la pré-auth est nécessaire")
  }

  return ambiguous
}

// ─── Main inference function ──────────────────────────────────────────────────

export function inferPaymentModel(signals: InferenceSignals): InferenceResult {
  const scores = scoreModels(signals)
  const topScore = scores[0]
  const winner = topScore.score < 15 ? 'hybrid' : topScore.model

  const confidence = Math.min(
    98,
    Math.max(
      30,
      winner === 'hybrid' ? 40 : Math.round(
        (topScore.score / Math.max(1, topScore.score + scores[1]?.score * 0.5)) * 100
      )
    )
  )

  const decisionTree = buildDecisionTree(signals, winner)
  const businessRisks = buildBusinessRisks(signals, winner)
  const operationalRisks = buildOperationalRisks(signals, winner)
  const reconciliationRisks = buildReconciliationRisks(signals, winner)

  return {
    model: winner,
    modelLabel: MODEL_LABELS[winner],
    confidence,

    simpleSummary: generateSimpleSummary(winner, signals),
    businessReading: generateBusinessReading(winner, signals),
    strategicReading: generateStrategicReading(winner, signals),
    expertLens: generateExpertLens(winner, signals),

    alternatives: getAlternatives(scores, winner),

    businessRisks,
    operationalRisks,
    reconciliationRisks,

    criticalDataPoints: MODEL_CRITICAL_DATA[winner],
    statusesToDistinguish: MODEL_STATUSES[winner],
    failureScenarios: MODEL_FAILURES[winner],
    kpis: MODEL_KPIS[winner],

    decisionTree,

    ambiguousSignals: getAmbiguousSignals(signals, scores),
    clarifyingQuestions: getClarifyingQuestions(signals, winner),
  }
}

// ─── Signal parser (from form answers string -> InferenceSignals) ─────────────

export function parseSignals(answers: Partial<Record<keyof InferenceSignals, string>>): InferenceSignals {
  const parseBool = (v: string | undefined): boolean | null => {
    if (v === 'true' || v === 'yes' || v === 'oui') return true
    if (v === 'false' || v === 'no' || v === 'non') return false
    return null
  }

  return {
    amountKnownUpfront: parseBool(answers.amountKnownUpfront as string),
    amountVariable: parseBool(answers.amountVariable as string),
    customerPresentAtFinalDebit: parseBool(answers.customerPresentAtFinalDebit as string),
    serviceConsumedBeforePayment: parseBool(answers.serviceConsumedBeforePayment as string),
    paymentDeferred: parseBool(answers.paymentDeferred as string),
    paymentMethodReusable: parseBool(answers.paymentMethodReusable as string),
    paymentMethodType: (answers.paymentMethodType as 'card' | 'bank') ?? null,
    initialConsent: parseBool(answers.initialConsent as string),
    mandateRequired: parseBool(answers.mandateRequired as string),
    failureCreatesDebt: parseBool(answers.failureCreatesDebt as string),
    isSubscription: parseBool(answers.isSubscription as string),
    isRefund: parseBool(answers.isRefund as string),
    futureDebitWithoutCustomer: parseBool(answers.futureDebitWithoutCustomer as string),
    strongReconciliationNeeded: parseBool(answers.strongReconciliationNeeded as string),
    highOperationalRisk: parseBool(answers.highOperationalRisk as string),
  }
}
