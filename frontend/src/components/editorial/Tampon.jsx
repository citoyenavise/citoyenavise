import './Tampon.css';

/**
 * Tampon signature — Vision-Incarnée couche 6.
 *
 * Vocabulaire unique de qualification de toute donnée affichée sur le site.
 *
 * Props :
 *   type — 'verifie' | 'public' | 'officiel' | 'en-attente' | 'a-jour'
 *   date — optionnel (pour le tampon 'a-jour')
 *
 * Usage : <Tampon type="verifie" /> <Tampon type="a-jour" date="2026-05-27" />
 */

const INTITULES = {
  verifie: 'VÉRIFIÉ',
  public: 'PUBLIC',
  officiel: 'OFFICIEL',
  'en-attente': 'EN ATTENTE',
  'a-jour': 'À JOUR',
};

const DESCRIPTIONS = {
  verifie: 'Donnée croisée par 2 sources officielles ou plus',
  public: 'Source gouvernementale ouverte',
  officiel: 'Documenté par institution mentionnée',
  'en-attente': 'Donnée demandée, non encore publiée',
  'a-jour': 'Fraîcheur de la donnée',
};

export default function Tampon({ type, date }) {
  if (!INTITULES[type]) return null;

  const intitule = INTITULES[type];
  const description = DESCRIPTIONS[type];

  if (type === 'a-jour') {
    return (
      <span
        className="tampon tampon-a-jour"
        title={description}
      >
        {intitule}{date ? ` ${date}` : ''}
      </span>
    );
  }

  return (
    <span
      className={`tampon tampon-${type}`}
      title={description}
    >
      {intitule}
    </span>
  );
}

/**
 * Helper : parse une chaîne de statut PHOENIX ("[VÉRIFIÉ] [PUBLIC]") en
 * tableau de types techniques exploitables par <Tampon />.
 */
export function parseStatuts(statutsArray) {
  const mapping = {
    'VÉRIFIÉ': 'verifie',
    'VERIFIE': 'verifie',
    'PUBLIC': 'public',
    'OFFICIEL': 'officiel',
    'EN ATTENTE': 'en-attente',
    'À JOUR': 'a-jour',
    'A JOUR': 'a-jour',
  };
  return (statutsArray || [])
    .map((s) => mapping[s.trim().toUpperCase()])
    .filter(Boolean);
}
