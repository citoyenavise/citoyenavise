import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { listerTerritoires, chargerTerritoire } from '../lib/territoireLoader';
import CarteTerritoires from '../components/CarteTerritoires';
import './TerritoirePage.css';

/**
 * TerritoirePage — fiches territoire civiques (données publiques sourcées).
 *   /territoire        → index des fiches
 *   /territoire/:slug  → fiche détaillée (rendu Markdown)
 */
export default function TerritoirePage() {
  const { slug } = useParams();

  if (!slug) {
    const liste = listerTerritoires();
    return (
      <main className="territoire-page">
        <h1>Territoires</h1>
        <p className="territoire-intro">
          Fiches civiques par territoire — données publiques officielles,
          sourcées et datées.
        </p>
        <CarteTerritoires />
        <ul className="territoire-liste">
          {liste.map((t) => (
            <li key={t.slug}>
              <Link to={`/territoire/${t.slug}`}>{t.titre}</Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  const contenu = chargerTerritoire(slug);
  if (!contenu) return <Navigate to="/territoire" replace />;

  return (
    <main className="territoire-page territoire-fiche">
      <p className="territoire-fil">
        <Link to="/territoire">← Territoires</Link>
      </p>
      <div className="territoire-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{contenu}</ReactMarkdown>
      </div>
    </main>
  );
}
