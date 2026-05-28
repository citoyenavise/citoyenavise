import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Tampon, { parseStatuts } from './Tampon';
import TableContenus from './TableContenus';
import PagesConnexes from './PagesConnexes';
import BoutonSoyezAvise from './BoutonSoyezAvise';
import {
  extraireSections,
  transformerWikilinks,
  retirerEnTete,
  slugifier,
  resoudreWikilink,
} from '../../lib/markdown';
import './PageEditoriale.css';

/**
 * PageEditoriale — Gabarit de page éditoriale (Vision-Incarnée + Architecture-Contenu).
 *
 * Structure rendue :
 *   1. Header : titre H1 + tampons (parsés du manifest) + tampon "À jour"
 *   2. Sidebar : TableContenus (sections H2 détectées)
 *   3. Main : contenu markdown rendu (react-markdown + remark-gfm tables)
 *   4. PagesConnexes : wikilinks résolus
 *   5. BoutonSoyezAvise : signature "Soyez avisé." en bas
 *
 * Props :
 *   page — { titre, contenu (markdown brut), statuts (array), aJour, wikilinks }
 *   manifest — _manifest.json chargé (pour résolution wikilinks et pages connexes)
 *   variationSignature — variation du BoutonSoyezAvise (défaut 'conclusion')
 */

function genererLien(manifest) {
  return function Lien({ href, children, ...rest }) {
    if (typeof href === 'string' && href.startsWith('wikilink:')) {
      const slug = href.replace('wikilink:', '');
      const cible = resoudreWikilink(slug, manifest);
      if (cible) {
        return (
          <Link to={cible.route} className="wikilink wikilink-resolu">
            {children}
          </Link>
        );
      }
      return (
        <span
          className="wikilink wikilink-non-resolu"
          title={`Lien interne non résolu : ${slug}`}
        >
          {children}
        </span>
      );
    }
    if (typeof href === 'string' && /^https?:|^mailto:/.test(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
}

function genererTitre(niveau) {
  const Tag = `h${niveau}`;
  return function TitreAncre({ children }) {
    const texte = Array.isArray(children)
      ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
      : String(children || '');
    const id = slugifier(texte);
    return <Tag id={id}>{children}</Tag>;
  };
}

export default function PageEditoriale({
  page,
  manifest,
  variationSignature = 'conclusion',
}) {
  const { titre, contenu, statuts, aJour, wikilinks } = page;

  const contenuPrepare = useMemo(
    () => transformerWikilinks(retirerEnTete(contenu || '')),
    [contenu]
  );

  const sections = useMemo(
    () => extraireSections(contenuPrepare),
    [contenuPrepare]
  );

  const tampons = parseStatuts(statuts);
  const Lien = useMemo(() => genererLien(manifest), [manifest]);
  const H2 = useMemo(() => genererTitre(2), []);
  const H3 = useMemo(() => genererTitre(3), []);

  return (
    <article className="page-editoriale">
      <header className="page-editoriale-header">
        <h1 className="page-editoriale-titre">{titre}</h1>
        <div className="page-editoriale-meta">
          {tampons.map((type) => (
            <Tampon key={type} type={type} />
          ))}
          {aJour && <Tampon type="a-jour" date={aJour} />}
        </div>
      </header>

      <div className="page-editoriale-corps">
        <aside className="page-editoriale-aside">
          <TableContenus sections={sections} />
        </aside>

        <div className="page-editoriale-contenu">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: Lien,
              h2: H2,
              h3: H3,
            }}
          >
            {contenuPrepare}
          </ReactMarkdown>
        </div>
      </div>

      <PagesConnexes wikilinks={wikilinks} manifest={manifest} />
      <BoutonSoyezAvise variation={variationSignature} />
    </article>
  );
}
