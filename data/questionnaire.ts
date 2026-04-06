import type { Question } from '@/types'

export const UNIVERSAL_QUESTIONS: Question[] = [
  {
    id: 'isRefund',
    text: "Le cas concerne-t-il un remboursement d'une transaction existante ?",
    type: 'yesno',
    options: [
      { label: 'Non', value: 'false' },
      { label: 'Oui', value: 'true' },
    ],
  },
  {
    id: 'isSubscription',
    text: 'Le cas concerne-t-il un abonnement ou des paiements récurrents ?',
    type: 'yesno',
    options: [
      { label: 'Non', value: 'false' },
      { label: 'Oui, abonnement ou récurrence', value: 'true' },
    ],
  },
  {
    id: 'paymentMethodType',
    text: 'Quel est le moyen de paiement utilisé ?',
    type: 'radio',
    options: [
      { label: 'Carte bancaire (Visa, Mastercard, CB...)', value: 'card' },
      { label: 'Compte bancaire (virement, prélèvement)', value: 'bank' },
    ],
  },
  {
    id: 'amountKnownUpfront',
    text: 'Le montant exact est-il connu avant de démarrer la transaction ?',
    type: 'yesno',
    options: [
      { label: 'Non, le montant sera déterminé plus tard', value: 'false' },
      { label: 'Oui, le montant est fixé à l\'avance', value: 'true' },
    ],
  },
  {
    id: 'amountVariable',
    text: 'Le montant peut-il varier ou être ajusté au cours du processus ?',
    type: 'yesno',
    options: [
      { label: 'Non, le montant est fixe', value: 'false' },
      { label: 'Oui, le montant évolue (selon la consommation, la durée...)', value: 'true' },
    ],
  },
  {
    id: 'customerPresentAtFinalDebit',
    text: 'Le client sera-t-il présent (connecté ou en session) au moment du débit final ?',
    type: 'yesno',
    options: [
      { label: 'Non, le débit se fera sans sa présence', value: 'false' },
      { label: 'Oui, le client est là au moment du paiement', value: 'true' },
    ],
  },
  {
    id: 'serviceConsumedBeforePayment',
    text: 'Le service est-il consommé avant que le paiement final soit effectué ?',
    type: 'yesno',
    options: [
      { label: 'Non, le paiement précède ou accompagne le service', value: 'false' },
      { label: 'Oui, le service est rendu avant le débit final', value: 'true' },
    ],
  },
  {
    id: 'paymentDeferred',
    text: 'Le débit final est-il différé dans le temps par rapport à l\'initiation ?',
    type: 'yesno',
    options: [
      { label: 'Non, le débit est immédiat', value: 'false' },
      { label: 'Oui, le débit se fait plus tard', value: 'true' },
    ],
  },
  {
    id: 'paymentMethodReusable',
    text: 'Le moyen de paiement doit-il pouvoir être débité à nouveau dans le futur ?',
    type: 'yesno',
    options: [
      { label: 'Non, usage unique', value: 'false' },
      { label: 'Oui, il sera réutilisé pour des débits futurs', value: 'true' },
    ],
  },
  {
    id: 'futureDebitWithoutCustomer',
    text: 'Des débits futurs se feront-ils sans que le client soit présent ou connecté ?',
    type: 'yesno',
    options: [
      { label: 'Non', value: 'false' },
      { label: 'Oui, des débits automatiques sont prévus (MIT)', value: 'true' },
    ],
  },
  {
    id: 'initialConsent',
    text: 'Un consentement explicite du client est-il recueilli au départ ?',
    type: 'yesno',
    options: [
      { label: 'Non ou non documenté', value: 'false' },
      { label: 'Oui, consentement explicite et tracé', value: 'true' },
    ],
  },
  {
    id: 'mandateRequired',
    text: 'Un mandat signé est-il nécessaire pour autoriser les prélèvements ?',
    type: 'yesno',
    options: [
      { label: 'Non', value: 'false' },
      { label: 'Oui, un mandat formel est requis', value: 'true' },
    ],
  },
  {
    id: 'failureCreatesDebt',
    text: 'Un échec de paiement crée-t-il une dette ou un impayé à recouvrer ?',
    type: 'yesno',
    options: [
      { label: 'Non, l\'accès est simplement bloqué', value: 'false' },
      { label: 'Oui, une créance persiste si le paiement échoue', value: 'true' },
    ],
  },
  {
    id: 'strongReconciliationNeeded',
    text: 'Une réconciliation comptable forte est-elle requise (flux financiers complexes) ?',
    type: 'yesno',
    options: [
      { label: 'Non, réconciliation standard', value: 'false' },
      { label: 'Oui, réconciliation rigoureuse indispensable', value: 'true' },
    ],
  },
  {
    id: 'highOperationalRisk',
    text: 'Un arrêt du flux de paiement aurait-il un impact opérationnel élevé ?',
    type: 'yesno',
    options: [
      { label: 'Non, impact limité', value: 'false' },
      { label: 'Oui, impact critique sur l\'activité', value: 'true' },
    ],
  },
]
