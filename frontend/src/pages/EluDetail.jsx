/**
 * Page EluDetail — Refonte Phase G.2 Lot 15
 *
 * Architecture :
 *   - EluHeader (Écran 1, sticky)
 *   - EluResume (Écran 2)
 *   - Navigation par onglets : Promesses | Actions | Votes | Transparence
 *                              | Financement | Contact | Commentaires | Sources
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useEluData } from '../hooks/useEluData';
import { api } from '../api/client';

import { EluHeader } from '../components/elu/EluHeader';
import { EluResume } from '../components/elu/EluResume';
import { EluPromesses } from '../components/elu/EluPromesses';
import { EluActions } from '../components/elu/EluActions';
import { EluVotes } from '../components/elu/EluVotes';
import { EluTransparence } from '../components/elu/EluTransparence';
import { EluFinancement } from '../components/elu/EluFinancement';
import { EluContact } from '../components/elu/EluContact';
import { EluCommentaires } from '../components/elu/EluCommentaires';
import { EluSources } from '../components/elu/EluSources';

const TABS = [
  { id: 'promesses', label: 'Promesses' },
  { id: 'actions', label: 'Actions' },
  { id: 'votes', label: 'Votes' },
  { id: 'transparence', label: 'Transparence' },
  { id: 'financement', label: 'Financement' },
  { id: 'contact', label: 'Contact' },
  { id: 'commentaires', label: 'Commentaires' },
  { id: 'sources', label: 'Sources' },
];

export function EluDetail() {
  const { lang, id } = useParams();
  const { data, loading, errors, loaders, actions } = useEluData(id);
  const [activeTab, setActiveTab] = useState('promesses');
  const isAuthenticated = api.isAuthenticated();

  // Chargement paresseux du contenu de l'onglet actif
  useEffect(() => {
    if (!id) return;
    const loader = loaders[activeTab];
    if (loader && data[activeTab] === null) {
      loader();
    }
    // Onglet "sources" agrège — précharger tous les blocs
    if (activeTab === 'sources') {
      if (!data.promises) loaders.promises();
      if (!data.actions) loaders.actions();
      if (!data.votes) loaders.votes();
      if (!data.controverses) loaders.controverses();
      if (!data.financement) loaders.financement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  if (loading.elu) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 text-center text-gray-400">
        Chargement…
      </div>
    );
  }

  if (!data.elu) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="text-center py-12 text-gray-600">
          Élu non trouvé.
          <div className="mt-4">
            <Link to={`/${lang}/elus`} className="text-blue-600 hover:underline">
              ← Retour aux élus
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const elu = data.elu;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Lien retour */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Link to={`/${lang}/elus`} className="text-sm text-blue-600 hover:underline">
          ← Retour aux élus
        </Link>
      </div>

      {/* Écran 1 — Header */}
      <EluHeader
        elu={elu}
        followStatus={data.followStatus}
        onFollow={() => actions.follow({})}
        onUnfollow={() => actions.unfollow()}
        onContact={() => setActiveTab('contact')}
        onShowPromesses={() => setActiveTab('promesses')}
      />

      {/* Écran 2 — Résumé KPIs */}
      <EluResume summary={data.summary} />

      {/* Navigation onglets */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-4 overflow-x-auto">
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu onglet actif */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'promesses' && (
          <EluPromesses
            promises={data.promises}
            loading={loading.promises}
            error={errors.promises}
          />
        )}

        {activeTab === 'actions' && (
          <EluActions
            actions={data.actions}
            loading={loading.actions}
            error={errors.actions}
          />
        )}

        {activeTab === 'votes' && (
          <EluVotes
            votes={data.votes}
            loading={loading.votes}
            error={errors.votes}
            onFilter={(params) => loaders.votes(params)}
          />
        )}

        {activeTab === 'transparence' && (
          <EluTransparence
            controverses={data.controverses}
            loading={loading.controverses}
            error={errors.controverses}
          />
        )}

        {activeTab === 'financement' && (
          <EluFinancement
            financement={data.financement}
            loading={loading.financement}
            error={errors.financement}
          />
        )}

        {activeTab === 'contact' && (
          <EluContact
            elu={elu}
            isAuthenticated={isAuthenticated}
            onSend={(payload) => actions.contact(payload)}
          />
        )}

        {activeTab === 'commentaires' && (
          <EluCommentaires
            comments={data.comments}
            loading={loading.comments}
            error={errors.comments}
            isAuthenticated={isAuthenticated}
            onPost={(payload) => actions.postComment(payload)}
          />
        )}

        {activeTab === 'sources' && (
          <EluSources
            elu={elu}
            promises={data.promises}
            actions={data.actions}
            votes={data.votes}
            controverses={data.controverses}
            financement={data.financement}
          />
        )}
      </div>
    </div>
  );
}

export default EluDetail;
