import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const HomePage = () => {
  const { t } = useTranslation();
  const [recentPetitions, setRecentPetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        const response = await api.get('/petitions?limit=3&status=published');
        if (response.data.success) {
          setRecentPetitions(response.data.data || []);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des pétitions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPetitions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/petitions"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              {t('home.hero.cta_petitions')}
            </Link>
            <Link
              to="/carte"
              className="px-8 py-3 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition"
            >
              {t('home.hero.cta_map')}
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
          {t('home.actions.title')}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Élus */}
          <Link
            to="/elus"
            className="p-6 bg-white border border-slate-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition"
          >
            <div className="text-3xl mb-4">👨‍⚖️</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {t('home.actions.elus_title')}
            </h3>
            <p className="text-slate-600">
              {t('home.actions.elus_desc')}
            </p>
          </Link>

          {/* Card 2: Pétitions */}
          <Link
            to="/petitions"
            className="p-6 bg-white border border-slate-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition"
          >
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {t('home.actions.petitions_title')}
            </h3>
            <p className="text-slate-600">
              {t('home.actions.petitions_desc')}
            </p>
          </Link>

          {/* Card 3: Carte */}
          <Link
            to="/carte"
            className="p-6 bg-white border border-slate-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition"
          >
            <div className="text-3xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {t('home.actions.map_title')}
            </h3>
            <p className="text-slate-600">
              {t('home.actions.map_desc')}
            </p>
          </Link>
        </div>
      </section>

      {/* Recent Petitions */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">
          {t('home.recent_petitions.title')}
        </h2>
        {loading ? (
          <div className="text-center text-slate-600">
            {t('common.loading')}
          </div>
        ) : recentPetitions.length > 0 ? (
          <div className="space-y-4">
            {recentPetitions.map((petition) => (
              <Link
                key={petition.id}
                to={`/petitions/${petition.id}`}
                className="block p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md hover:border-blue-300 transition"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {petition.titre}
                </h3>
                <p className="text-slate-600 text-sm line-clamp-2">
                  {petition.description}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-slate-500">
                    {petition.signaturesCount || 0} {t('petitions.totalSignatures', { count: petition.signaturesCount || 0 })}
                  </span>
                  <span className="text-blue-600 font-semibold">
                    {t('common.view')} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-600">
            {t('home.recent_petitions.none')}
          </div>
        )}
      </section>

      {/* Values Section */}
      <section className="px-6 py-12 bg-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            {t('home.values.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Value 1: Transparence */}
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('home.values.transparency_title')}
              </h3>
              <p className="text-slate-600">
                {t('home.values.transparency_desc')}
              </p>
            </div>

            {/* Value 2: Participation */}
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('home.values.participation_title')}
              </h3>
              <p className="text-slate-600">
                {t('home.values.participation_desc')}
              </p>
            </div>

            {/* Value 3: Empowerment */}
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('home.values.empowerment_title')}
              </h3>
              <p className="text-slate-600">
                {t('home.values.empowerment_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Info */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {t('home.pilot.title')}
          </h3>
          <p className="text-blue-800">
            {t('home.pilot.description')}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
