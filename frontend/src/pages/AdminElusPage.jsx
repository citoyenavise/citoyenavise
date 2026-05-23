/**
 * AdminElusPage — interface admin CRUD élus
 * Phase G.2 - Lot 16
 *
 * Sections :
 *   1. Liste + recherche + pagination + sélection
 *   2. Édition d'un élu (formulaire identité)
 *   3. Sous-onglets : Promesses / Actions / Votes / Controverses /
 *      Donateurs / Liens d'intérêts / Mandats / Commentaires (modération)
 *   4. Bloc Sync (openparliament + CSV upload)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';

const TITRES = [
  'Député', 'Sénateur', 'Premier ministre', 'Ministre', 'Vice-PM',
  'Président Chambre', 'Président Sénat', 'Gouverneur général',
  'Juge', 'Maire', 'Conseiller', 'Autre',
];
const NIVEAUX = ['fédéral', 'provincial', 'municipal'];
const STATUTS = ['actif', 'sortant', 'ancien', 'candidat', 'decede'];

export function AdminElusPage() {
  const navigate = useNavigate();
  const { lang } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [elus, setElus] = useState([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('actif');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate(`/${lang}/login`);
    }
  }, [user, isAuthenticated, navigate, lang]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        const data = await api.elus.list(params);
        const list = Array.isArray(data) ? data : data?.data || [];
        let filtered = list;
        if (niveauFilter) filtered = filtered.filter((e) => e.niveau === niveauFilter);
        if (statutFilter) filtered = filtered.filter((e) => e.statut === statutFilter);
        setElus(filtered);
        setTotal(filtered.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, niveauFilter, statutFilter]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Administration des élus</h1>
          <button
            onClick={() => navigate(`/${lang}/admin`)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Tableau de bord
          </button>
        </div>

        <SyncSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          {/* Colonne gauche : liste + filtres */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <button
                onClick={() => setSelectedId('new')}
                className="w-full mb-3 px-3 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
              >
                + Nouvelle fiche élu
              </button>

              <form
                onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
                className="mb-3"
              >
                <input
                  type="text"
                  placeholder="Rechercher un élu…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </form>

              <div className="flex gap-2 mb-3 text-xs">
                <select
                  value={niveauFilter}
                  onChange={(e) => setNiveauFilter(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="">Tous niveaux</option>
                  {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
                </select>
                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="">Tous statuts</option>
                  {STATUTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="text-xs text-gray-500 mb-2">
                {loading ? 'Chargement…' : `${total} élu(s)`}
              </div>

              <div className="max-h-[600px] overflow-y-auto space-y-1">
                {elus.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-blue-50 ${
                      selectedId === e.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{e.nom}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {e.titre} • {e.parti_politique || '—'} • {e.region}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite : édition */}
          <div className="lg:col-span-2">
            {selectedId === null && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                Sélectionne un élu dans la liste ou clique sur « Nouvelle fiche ».
              </div>
            )}
            {selectedId === 'new' && (
              <EluEditor
                key="new"
                eluId={null}
                onSaved={(elu) => { setSelectedId(elu.id); }}
                onDeleted={() => { setSelectedId(null); }}
              />
            )}
            {selectedId !== null && selectedId !== 'new' && (
              <EluEditor
                key={selectedId}
                eluId={selectedId}
                onSaved={() => {}}
                onDeleted={() => { setSelectedId(null); }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sync section
// ═══════════════════════════════════════════════════════════════════

function SyncSection() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runSync = async (source) => {
    if (!confirm(`Lancer la synchronisation depuis ${source} ?`)) return;
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const r = await api.adminElus.sync(source, { dry_run: false });
      setResult(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Synchronisation sources officielles
      </h2>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => runSync('openparliament')}
          disabled={running}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? '⏳ Sync en cours…' : 'Sync openparliament.ca'}
        </button>
        <button
          onClick={() => runSync('ourcommons')}
          disabled={running}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Sync ourcommons.ca
        </button>
      </div>
      {result && (
        <pre className="mt-3 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
          {JSON.stringify(result.result || result, null, 2)}
        </pre>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Éditeur d'élu (création ou modification)
// ═══════════════════════════════════════════════════════════════════

const SUB_TABS = [
  { id: 'identite', label: 'Identité' },
  { id: 'promesses', label: 'Promesses' },
  { id: 'actions', label: 'Actions' },
  { id: 'votes', label: 'Votes' },
  { id: 'controverses', label: 'Controverses' },
  { id: 'donateurs', label: 'Donateurs' },
  { id: 'liens', label: 'Liens d\'intérêts' },
  { id: 'mandats', label: 'Mandats' },
  { id: 'moderation', label: 'Modération' },
];

function EluEditor({ eluId, onSaved, onDeleted }) {
  const [elu, setElu] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('identite');
  const [loading, setLoading] = useState(!!eluId);

  useEffect(() => {
    if (!eluId) {
      setElu({
        nom: '', titre: 'Député', niveau: 'fédéral', region: '',
        statut: 'actif', parti_politique: '', poste: '',
        email: '', telephone: '', site_web: '', photo_url: '',
        source_url: '', legislature: '45',
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    api.elus.get(eluId).then((data) => {
      setElu(data);
    }).finally(() => setLoading(false));
  }, [eluId]);

  if (loading) return <div className="text-center py-8 text-gray-400">Chargement…</div>;
  if (!elu) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          {eluId ? `Éditer : ${elu.nom}` : 'Nouvelle fiche élu'}
        </h2>
        {eluId && (
          <button
            onClick={async () => {
              if (!confirm(`Supprimer définitivement ${elu.nom} ?`)) return;
              await api.adminElus.deleteElu(eluId);
              onDeleted();
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Supprimer
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1 px-4">
          {SUB_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              disabled={!eluId && t.id !== 'identite'}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
                activeSubTab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4">
        {activeSubTab === 'identite' && (
          <IdentiteForm elu={elu} eluId={eluId} onSaved={(e) => { setElu(e); onSaved(e); }} />
        )}
        {activeSubTab === 'promesses' && eluId && <SubCrud eluId={eluId} kind="promises" />}
        {activeSubTab === 'actions' && eluId && <SubCrud eluId={eluId} kind="actions" />}
        {activeSubTab === 'votes' && eluId && <SubCrud eluId={eluId} kind="votes" />}
        {activeSubTab === 'controverses' && eluId && <SubCrud eluId={eluId} kind="controverses" />}
        {activeSubTab === 'donateurs' && eluId && <SubCrud eluId={eluId} kind="donateurs" />}
        {activeSubTab === 'liens' && eluId && <SubCrud eluId={eluId} kind="liens" />}
        {activeSubTab === 'mandats' && eluId && <SubCrud eluId={eluId} kind="mandats" />}
        {activeSubTab === 'moderation' && eluId && <ModerationComments eluId={eluId} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Formulaire Identité
// ═══════════════════════════════════════════════════════════════════

function IdentiteForm({ elu, eluId, onSaved }) {
  const [form, setForm] = useState(elu);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      // Convertir snake → camel pour le backend
      const payload = {
        nom: form.nom,
        titre: form.titre,
        niveau: form.niveau,
        region: form.region,
        statut: form.statut,
        partiPolitique: form.parti_politique || form.partiPolitique,
        poste: form.poste,
        email: form.email,
        telephone: form.telephone,
        siteWeb: form.site_web || form.siteWeb,
        photoUrl: form.photo_url || form.photoUrl,
        sourceUrl: form.source_url || form.sourceUrl,
        legislature: form.legislature,
      };
      const saved = eluId
        ? await api.adminElus.updateElu(eluId, payload)
        : await api.adminElus.createElu(payload);
      onSaved(saved);
      setFeedback({ type: 'success', text: 'Enregistré.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <Field label="Nom *" value={form.nom} onChange={handle('nom')} />
      <Select label="Titre *" value={form.titre} onChange={handle('titre')} options={TITRES} />
      <Select label="Niveau *" value={form.niveau} onChange={handle('niveau')} options={NIVEAUX} />
      <Select label="Statut" value={form.statut} onChange={handle('statut')} options={STATUTS} />
      <Field label="Région *" value={form.region} onChange={handle('region')} />
      <Field label="Parti politique" value={form.parti_politique || form.partiPolitique || ''} onChange={handle('parti_politique')} />
      <Field label="Poste" value={form.poste || ''} onChange={handle('poste')} />
      <Field label="Législature" value={form.legislature || ''} onChange={handle('legislature')} />
      <Field label="Email" value={form.email || ''} onChange={handle('email')} />
      <Field label="Téléphone" value={form.telephone || ''} onChange={handle('telephone')} />
      <Field label="Site web" value={form.site_web || form.siteWeb || ''} onChange={handle('site_web')} />
      <Field label="Photo URL" value={form.photo_url || form.photoUrl || ''} onChange={handle('photo_url')} />
      <Field label="Source URL" value={form.source_url || form.sourceUrl || ''} onChange={handle('source_url')} className="md:col-span-2" />

      <div className="md:col-span-2 flex justify-end gap-2 mt-2">
        {feedback && (
          <span className={`text-sm self-center ${feedback.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {feedback.text}
          </span>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-gray-600 mb-1">{label}</span>
      <input
        type="text"
        value={value || ''}
        onChange={onChange}
        className="w-full px-2 py-1.5 border border-gray-300 rounded"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-600 mb-1">{label}</span>
      <select
        value={value || ''}
        onChange={onChange}
        className="w-full px-2 py-1.5 border border-gray-300 rounded"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Sous-CRUD générique : promesses, actions, votes, etc.
// ═══════════════════════════════════════════════════════════════════

const KIND_CONFIG = {
  promises: {
    title: 'Promesses',
    listFn: (id) => api.elus.getPromises(id),
    createFn: (id, p) => api.adminElus.createPromise(id, p),
    deleteFn: (id, did) => api.adminElus.deletePromise(id, did),
    fields: ['titre', 'description', 'status', 'date_promesse', 'source', 'source_url'],
    statusOptions: ['engagee', 'en_cours', 'completee', 'abandonnee'],
  },
  actions: {
    title: 'Actions',
    listFn: (id) => api.elus.getActions(id),
    createFn: (id, p) => api.adminElus.createAction(id, p),
    deleteFn: (id, aid) => api.adminElus.deleteAction(id, aid),
    fields: ['type', 'titre', 'description', 'date', 'source_url'],
    typeOptions: ['loi', 'projet_loi', 'motion', 'vote', 'decision', 'declaration', 'intervention', 'communique', 'autre'],
  },
  votes: {
    title: 'Votes',
    listFn: (id) => api.elus.getVotes(id),
    createFn: (id, p) => api.adminElus.createVote(id, p),
    deleteFn: (id, vid) => api.adminElus.deleteVote(id, vid),
    fields: ['loi_titre', 'loi_reference', 'position', 'date', 'enjeu', 'source_url'],
    positionOptions: ['pour', 'contre', 'abstention', 'absent', 'paire'],
  },
  controverses: {
    title: 'Controverses',
    listFn: (id) => api.elus.getControverses(id),
    createFn: (id, p) => api.adminElus.createControverse(id, p),
    deleteFn: (id, cid) => api.adminElus.deleteControverse(id, cid),
    fields: ['type', 'titre', 'description', 'date_debut', 'statut', 'gravite', 'is_published', 'source_url'],
    typeOptions: ['scandale', 'enquete', 'sanction', 'correction', 'allegation', 'condamnation', 'rappel_ethique', 'autre'],
    statutOptions: ['en_cours', 'cloturee', 'rejetee', 'confirmee', 'non_lieu'],
  },
  donateurs: {
    title: 'Donateurs',
    listFn: (id) => api.elus.getFinancement(id),
    listKey: 'donateurs',
    createFn: (id, p) => api.adminElus.createDonateur(id, p),
    deleteFn: (id, did) => api.adminElus.deleteDonateur(id, did),
    fields: ['nom', 'type_donateur', 'montant', 'date', 'campagne', 'source_url'],
    typeOptions: ['particulier', 'entreprise', 'syndicat', 'organisme', 'parti', 'comite', 'anonyme', 'autre'],
  },
  liens: {
    title: 'Liens d\'intérêts',
    listFn: (id) => api.elus.getFinancement(id),
    listKey: 'liens_interets',
    createFn: (id, p) => api.adminElus.createLien(id, p),
    deleteFn: (id, lid) => api.adminElus.deleteLien(id, lid),
    fields: ['type', 'entite', 'role', 'secteur', 'description', 'date_debut', 'actuel', 'source_url'],
    typeOptions: ['directorat', 'actionnariat', 'emploi', 'consultation', 'lobby', 'beneficiaire', 'famille', 'association', 'autre'],
  },
  mandats: {
    title: 'Mandats',
    listFn: (id) => api.elus.getMandats(id),
    createFn: (id, p) => api.adminElus.createMandat(id, p),
    deleteFn: (id, mid) => api.adminElus.deleteMandat(id, mid),
    fields: ['titre', 'poste', 'niveau', 'parti_politique', 'date_debut', 'date_fin', 'cause_fin', 'est_actuel'],
  },
};

function SubCrud({ eluId, kind }) {
  const config = KIND_CONFIG[kind];
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const reload = async () => {
    try {
      const res = await config.listFn(eluId);
      const raw = config.listKey
        ? (res?.[config.listKey]?.data || [])
        : (res?.data || []);
      setItems(raw);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  useEffect(() => { reload(); /* eslint-disable-line */ }, [eluId, kind]);

  const submit = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      // Convertir snake_case → camelCase pour backend
      const payload = {};
      Object.entries(newItem).forEach(([k, v]) => {
        const cc = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        payload[cc] = v;
      });
      await config.createFn(eluId, payload);
      setNewItem({});
      setShowForm(false);
      setFeedback({ type: 'success', text: 'Ajouté.' });
      reload();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (itemId) => {
    if (!confirm('Supprimer cet élément ?')) return;
    await config.deleteFn(eluId, itemId);
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{config.title} ({items.length})</h3>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <div className="border border-blue-200 bg-blue-50 rounded p-3 mb-3 space-y-2">
          {config.fields.map((f) => {
            const opts =
              f === 'status' ? config.statusOptions :
              f === 'type' ? config.typeOptions :
              f === 'position' ? config.positionOptions :
              f === 'statut' ? config.statutOptions :
              f === 'type_donateur' ? config.typeOptions :
              null;

            const isBool = f === 'is_published' || f === 'est_actuel' || f === 'actuel';

            return (
              <label key={f} className="block">
                <span className="block text-xs text-gray-600 mb-0.5">{f}</span>
                {opts ? (
                  <select
                    value={newItem[f] || ''}
                    onChange={(e) => setNewItem((n) => ({ ...n, [f]: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="">—</option>
                    {opts.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : isBool ? (
                  <input
                    type="checkbox"
                    checked={!!newItem[f]}
                    onChange={(e) => setNewItem((n) => ({ ...n, [f]: e.target.checked }))}
                  />
                ) : (
                  <input
                    type={f.includes('date') ? 'date' : f === 'montant' ? 'number' : 'text'}
                    value={newItem[f] || ''}
                    onChange={(e) => {
                      const v = f === 'montant' ? parseFloat(e.target.value) : e.target.value;
                      setNewItem((n) => ({ ...n, [f]: v }));
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                )}
              </label>
            );
          })}
          <div className="flex justify-end gap-2">
            <button
              onClick={submit}
              disabled={saving}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div className={`text-sm rounded p-2 mb-3 ${feedback.type === 'success' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
          {feedback.text}
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Aucun élément.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded p-2 text-sm flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {item.titre || item.nom || item.loi_titre || item.entite || `#${item.id}`}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {item.type || item.position || item.status || ''}
                  {item.date && ` • ${item.date}`}
                  {item.date_debut && ` • ${item.date_debut}`}
                </div>
              </div>
              <button
                onClick={() => remove(item.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Supprimer
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Modération des commentaires
// ═══════════════════════════════════════════════════════════════════

function ModerationComments({ eluId }) {
  const [comments, setComments] = useState([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    api.elus.getComments(eluId, { limit: 100 }).then((res) => {
      setComments(res?.data || []);
    });
  }, [eluId, reload]);

  const moderate = async (cid, statut) => {
    await api.adminElus.moderateComment(eluId, cid, { statut });
    setReload((r) => r + 1);
  };

  const repondre = async (cid) => {
    const reponse = prompt('Réponse officielle :');
    if (!reponse) return;
    await api.adminElus.repondreComment(eluId, cid, reponse);
    setReload((r) => r + 1);
  };

  return (
    <div>
      <h3 className="font-semibold mb-3">Modération des commentaires</h3>
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Aucun commentaire.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs bg-gray-200">{c.type}</span>
                <span className="text-xs text-gray-600">{c.author?.username || 'anonyme'}</span>
                <span className="text-xs text-gray-500 ml-auto">{c.created_at}</span>
              </div>
              <p className="text-gray-900 whitespace-pre-line">{c.contenu}</p>
              {c.reponse && (
                <div className="mt-2 bg-blue-50 border-l-4 border-blue-400 pl-2 py-1 text-sm">
                  <strong>Réponse :</strong> {c.reponse}
                </div>
              )}
              <div className="mt-2 flex gap-2 text-xs">
                <button onClick={() => moderate(c.id, 'publie')} className="text-green-700 hover:underline">Publier</button>
                <button onClick={() => moderate(c.id, 'rejete')} className="text-red-700 hover:underline">Rejeter</button>
                <button onClick={() => moderate(c.id, 'masque')} className="text-gray-700 hover:underline">Masquer</button>
                <button onClick={() => repondre(c.id)} className="text-blue-700 hover:underline ml-auto">Répondre</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminElusPage;
