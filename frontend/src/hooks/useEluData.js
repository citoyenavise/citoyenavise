/**
 * Hook useEluData
 * Phase G.2 - Lot 15
 *
 * Centralise les appels API pour la fiche élu et expose un état unifié.
 * Chargement paresseux par bloc : seul l'onglet actif déclenche son fetch.
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

const INITIAL_STATE = {
  elu: null,
  summary: null,
  promises: null,
  actions: null,
  votes: null,
  controverses: null,
  financement: null,
  mandats: null,
  comments: null,
  followStatus: null,
};

export function useEluData(id) {
  const [data, setData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState({ elu: true });
  const [errors, setErrors] = useState({});

  // Charge le bloc Identité + Summary dès le montage (Écrans 1 et 2)
  useEffect(() => {
    if (!id) return;

    let alive = true;
    setLoading((l) => ({ ...l, elu: true, summary: true }));

    Promise.allSettled([
      api.elus.get(id),
      api.elus.summary(id),
      api.elus.followStatus(id),
    ]).then((results) => {
      if (!alive) return;

      const [eluRes, summaryRes, followRes] = results;

      setData((d) => ({
        ...d,
        elu: eluRes.status === 'fulfilled' ? eluRes.value : null,
        summary: summaryRes.status === 'fulfilled' ? summaryRes.value : null,
        followStatus: followRes.status === 'fulfilled' ? followRes.value : null,
      }));

      setErrors((e) => ({
        ...e,
        elu: eluRes.status === 'rejected' ? eluRes.reason?.message : null,
        summary: summaryRes.status === 'rejected' ? summaryRes.reason?.message : null,
      }));

      setLoading((l) => ({ ...l, elu: false, summary: false }));
    });

    return () => { alive = false; };
  }, [id]);

  // Chargeurs paresseux (1 fetch par onglet)
  const loaders = {
    promises: useCallback(async () => {
      setLoading((l) => ({ ...l, promises: true }));
      try {
        const res = await api.elus.getPromises(id);
        setData((d) => ({ ...d, promises: res }));
      } catch (err) {
        setErrors((e) => ({ ...e, promises: err.message }));
      } finally {
        setLoading((l) => ({ ...l, promises: false }));
      }
    }, [id]),

    actions: useCallback(async () => {
      setLoading((l) => ({ ...l, actions: true }));
      try {
        const res = await api.elus.getActions(id);
        setData((d) => ({ ...d, actions: res }));
      } catch (err) {
        setErrors((e) => ({ ...e, actions: err.message }));
      } finally {
        setLoading((l) => ({ ...l, actions: false }));
      }
    }, [id]),

    votes: useCallback(async (params = {}) => {
      setLoading((l) => ({ ...l, votes: true }));
      try {
        const res = await api.elus.getVotes(id, params);
        setData((d) => ({ ...d, votes: res }));
      } catch (err) {
        setErrors((e) => ({ ...e, votes: err.message }));
      } finally {
        setLoading((l) => ({ ...l, votes: false }));
      }
    }, [id]),

    controverses: useCallback(async () => {
      setLoading((l) => ({ ...l, controverses: true }));
      try {
        const res = await api.elus.getControverses(id);
        setData((d) => ({ ...d, controverses: res }));
      } catch (err) {
        setErrors((e) => ({ ...e, controverses: err.message }));
      } finally {
        setLoading((l) => ({ ...l, controverses: false }));
      }
    }, [id]),

    financement: useCallback(async () => {
      setLoading((l) => ({ ...l, financement: true }));
      try {
        const res = await api.elus.getFinancement(id);
        setData((d) => ({ ...d, financement: res }));
      } catch (err) {
        setErrors((e) => ({ ...e, financement: err.message }));
      } finally {
        setLoading((l) => ({ ...l, financement: false }));
      }
    }, [id]),

    mandats: useCallback(async () => {
      setLoading((l) => ({ ...l, mandats: true }));
      try {
        const res = await api.elus.getMandats(id);
        setData((d) => ({ ...d, mandats: res }));
      } catch (err) {
        setErrors((e) => ({ ...e, mandats: err.message }));
      } finally {
        setLoading((l) => ({ ...l, mandats: false }));
      }
    }, [id]),

    comments: useCallback(async () => {
      setLoading((l) => ({ ...l, comments: true }));
      try {
        const res = await api.elus.getComments(id);
        setData((d) => ({ ...d, comments: res }));
      } catch (err) {
        setErrors((e) => ({ ...e, comments: err.message }));
      } finally {
        setLoading((l) => ({ ...l, comments: false }));
      }
    }, [id]),
  };

  // Actions utilisateur
  const actions = {
    follow: useCallback(async (prefs) => {
      const res = await api.elus.follow(id, prefs);
      setData((d) => ({ ...d, followStatus: { ...d.followStatus, followed: true, prefs: res.data } }));
      return res;
    }, [id]),

    unfollow: useCallback(async () => {
      await api.elus.unfollow(id);
      setData((d) => ({ ...d, followStatus: { ...d.followStatus, followed: false, prefs: null } }));
    }, [id]),

    postComment: useCallback(async (payload) => {
      const res = await api.elus.postComment(id, payload);
      // Le commentaire est en attente de modération, on ne le rajoute pas à la liste publique
      return res;
    }, [id]),

    contact: useCallback(async (payload) => {
      return api.elus.contact(id, payload);
    }, [id]),
  };

  return { data, loading, errors, loaders, actions };
}

export default useEluData;
