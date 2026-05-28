import './BoutonSoyezAvise.css';

/**
 * BoutonSoyezAvise — Signature linguistique « AVISÉ » (Vision-Incarnée couche 6).
 *
 * Système 4 variations contextuelles :
 *   - 'conclusion' : « Soyez avisé. »
 *     → fin de page éditoriale (signature naturelle)
 *   - 'interrogation' : « Êtes-vous avisé ? »
 *     → tête de quiz, défi, révélation
 *   - 'urgence' : « Vous devez être avisé. »
 *     → avant appel à l'action critique
 *   - 'remerciement' : « Merci d'être avisé. »
 *     → après action accomplie (signature, profil complété)
 *
 * Props :
 *   variation — 'conclusion' (défaut) | 'interrogation' | 'urgence' | 'remerciement'
 */

const FORMULES = {
  conclusion: 'Soyez avisé.',
  interrogation: 'Êtes-vous avisé ?',
  urgence: 'Vous devez être avisé.',
  remerciement: 'Merci d’être avisé.',
};

export default function BoutonSoyezAvise({ variation = 'conclusion' }) {
  const texte = FORMULES[variation] || FORMULES.conclusion;
  return (
    <p className={`bouton-soyez-avise bouton-soyez-avise-${variation}`}>
      {texte}
    </p>
  );
}
