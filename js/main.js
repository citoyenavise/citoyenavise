/* ================================================================
   CITOYEN AVISÉ — JavaScript principal v1.0
   ================================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ── Navigation mobile ──────────────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const menuMobile = document.querySelector('.menu-mobile');
  if (hamburger && menuMobile) {
    menuMobile.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.addEventListener('click', () => {
      const isOuvert = menuMobile.classList.toggle('ouvert');
      hamburger.classList.toggle('ouvert');
      menuMobile.setAttribute('aria-hidden', isOuvert ? 'false' : 'true');
      hamburger.setAttribute('aria-expanded', isOuvert ? 'true' : 'false');
    });
  }

  /* ── Lien actif dans la nav ─────────────────────────────── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-liens a, .menu-mobile a').forEach(lien => {
    const href = lien.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      lien.classList.add('actif');
    }
  });

  /* ── Retour en haut ─────────────────────────────────────── */
  const btnHaut = document.querySelector('.retour-haut');
  if (btnHaut) {
    window.addEventListener('scroll', () => {
      btnHaut.classList.toggle('visible', window.scrollY > 400);
    });
    btnHaut.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Animations au défilement ───────────────────────────── */
  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach(entree => {
      if (entree.isIntersecting) {
        entree.target.classList.add('visible');
        observateur.unobserve(entree.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-in').forEach(el => observateur.observe(el));

  /* ── FAQ accordéon ──────────────────────────────────────── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const reponse = btn.nextElementSibling;
      const estOuvert = btn.classList.contains('ouvert');
      document.querySelectorAll('.faq-question').forEach(b => {
        b.classList.remove('ouvert');
        if (b.nextElementSibling) b.nextElementSibling.classList.remove('visible');
      });
      if (!estOuvert) {
        btn.classList.add('ouvert');
        reponse.classList.add('visible');
      }
    });
  });

  /* ── Liens externes — nouvel onglet sécurisé ────────────── */
  document.querySelectorAll('a[href^="http"]').forEach(lien => {
    if (!lien.hostname || lien.hostname !== window.location.hostname) {
      lien.setAttribute('target', '_blank');
      lien.setAttribute('rel', 'noopener noreferrer');
    }
  });

  /* ── Formulaire infolettre (placeholder) ────────────────── */
  const formInfo = document.querySelector('.form-infolettre');
  if (formInfo) {
    formInfo.addEventListener('submit', function (e) {
      e.preventDefault();
      const courriel = formInfo.querySelector('input[type="email"]').value;
      if (courriel) {
        formInfo.innerHTML = '<p style="color:#fff;font-size:1.05rem;font-weight:600;">✅ Merci ! Vous serez parmi les premiers informés au lancement.</p>';
      }
    });
  }

  /* ── Dropdown navigation ────────────────────────────────── */
  document.querySelectorAll('.nav-dropdown-toggle').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const parent = btn.closest('.nav-dropdown');
      const isOpen = parent.classList.contains('ouvert');
      document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('ouvert'));
      if (!isOpen) parent.classList.add('ouvert');
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('ouvert'));
    }
  });

  /* ── Glossaire — recherche en direct ────────────────────── */
  const champRecherche = document.querySelector('#recherche-glossaire');
  if (champRecherche) {
    const normaliser = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    document.querySelectorAll('.glossaire-terme').forEach(t => t.style.display = 'block');
    champRecherche.addEventListener('input', function () {
      const q = normaliser(this.value.trim());
      let total = 0;
      document.querySelectorAll('.glossaire-section').forEach(section => {
        let visible = 0;
        section.querySelectorAll('.glossaire-terme').forEach(terme => {
          const match = !q || normaliser(terme.textContent).includes(q);
          terme.style.display = match ? 'block' : 'none';
          if (match) visible++;
        });
        section.style.display = visible > 0 ? 'block' : 'none';
        total += visible;
      });
      const msg = document.querySelector('#aucun-resultat');
      if (msg) msg.style.display = total === 0 ? 'block' : 'none';
    });
  }

  /* ── Calendrier — onglets année ─────────────────────────── */
  const calTabs = document.querySelectorAll('.cal-tab');
  if (calTabs.length) {
    calTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        calTabs.forEach(t => t.classList.remove('actif'));
        document.querySelectorAll('.cal-annee').forEach(a => a.classList.remove('visible'));
        this.classList.add('actif');
        const cible = document.querySelector('#' + this.dataset.cible);
        if (cible) cible.classList.add('visible');
      });
    });
    calTabs[0].click();
  }

  /* ── Filtres actualités ──────────────────────────────────── */
  document.querySelectorAll('.filtre-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('actif'));
      this.classList.add('actif');
      const filtre = this.dataset.filtre;
      document.querySelectorAll('.carte-article').forEach(carte => {
        carte.style.display = (filtre === 'tous' || carte.dataset.cat === filtre) ? '' : 'none';
      });
    });
  });

  /* ── Profil citoyen — pill nav + lien réseau ────────────── */
  try {
    const s = JSON.parse(localStorage.getItem('ca_citoyen_v1') || 'null');
    if (s && s.pseudo) {
      const initiales = s.pseudo.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '').slice(0, 2).toUpperCase() || '?';
      const isEnPage = window.location.pathname.includes('/en/');
      const profilPath = isEnPage ? '../profil.html' : 'profil.html';
      // Nav desktop : insérer avant le bouton EN
      const navLiens = document.querySelector('.nav-liens');
      if (navLiens) {
        const liProfil = document.createElement('li');
        liProfil.innerHTML = `<a href="${profilPath}" class="nav-profil-pill"><span class="nav-profil-av">${initiales}</span><span>${s.pseudo}</span></a>`;
        const enLi = Array.from(navLiens.querySelectorAll('li')).find(li => li.querySelector('.nav-lang'));
        navLiens.insertBefore(liProfil, enLi || null);
      }
      // Menu mobile
      const menuMob = document.querySelector('.menu-mobile');
      if (menuMob) {
        const aPropos = Array.from(menuMob.querySelectorAll('a')).find(a => (a.getAttribute('href') || '').includes('a-propos'));
        const aProfil = document.createElement('a');
        aProfil.href = profilPath;
        aProfil.textContent = '👤 Mon profil citoyen';
        if (aPropos) menuMob.insertBefore(aProfil, aPropos);
        else menuMob.appendChild(aProfil);
      }
      // Accueil — afficher CTA secondaire "Voir mon profil"
      const btnVoirProfil = document.getElementById('btnVoirProfil');
      if (btnVoirProfil) btnVoirProfil.style.display = '';
    }
  } catch(e) {}

  /* ── Compteur animé (stats) ─────────────────────────────── */
  function animerCompteur(el) {
    const cible = parseInt(el.dataset.cible, 10);
    const duree = 1800;
    const debut = performance.now();
    function etape(maintenant) {
      const progres = Math.min((maintenant - debut) / duree, 1);
      const valeur = Math.floor(progres * cible);
      el.textContent = valeur.toLocaleString('fr-CA') + (el.dataset.suffixe || '');
      if (progres < 1) requestAnimationFrame(etape);
    }
    requestAnimationFrame(etape);
  }
  const obsStats = new IntersectionObserver((entrees) => {
    entrees.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.stat-nombre[data-cible]').forEach(animerCompteur);
        obsStats.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stats-grille').forEach(el => obsStats.observe(el));

});
