import './Home.css'

export function Home() {
  return (
    <div className="page">
      <div className="shell">
        <section className="hero" style={{ paddingTop: '1rem' }}>
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot"></span>
              Plateforme de participation citoyenne
            </div>

            <h1 className="hero-title">
              Comprendre, participer et <span>influencer</span> les décisions publiques
            </h1>

            <p className="hero-subtitle">
              <strong>Citoyen Avisé</strong> transforme ta compréhension des enjeux civiques en actions concrètes.
              Accès à l'information transparente, débats constructifs, et influence réelle.
            </p>

            <div className="hero-ctas">
              <a href="/register" className="btn btn-primary">Commencer maintenant</a>
              <a href="#comment" className="btn btn-ghost">En savoir plus</a>
            </div>

            <div className="hero-meta">
              <div className="hero-meta-item">
                <span className="hero-meta-dot"></span>
                50K+ citoyens actifs
              </div>
              <div className="hero-meta-item">
                <span className="hero-meta-dot"></span>
                Données vérifiées
              </div>
              <div className="hero-meta-item">
                <span className="hero-meta-dot"></span>
                Impact réel
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-card">
              <div className="hero-card-header">
                <div className="hero-mascotte">
                  <div className="hero-mascotte-avatar">
                    <div className="hero-mascotte-eyes">
                      <span className="hero-mascotte-eye"></span>
                      <span className="hero-mascotte-eye"></span>
                    </div>
                  </div>
                  <div className="hero-mascotte-info">
                    <div className="hero-mascotte-name">Avisée</div>
                    <div className="hero-mascotte-role">Assistant IA</div>
                  </div>
                </div>
                <div className="hero-card-badge">Actif</div>
              </div>

              <div className="hero-card-body">
                <div className="hero-card-question">Quel enjeu te préoccupe le plus ?</div>
                <div className="hero-card-options">
                  <button className="hero-card-option">
                    <span className="hero-card-option-dot"></span>
                    Climat et environnement
                  </button>
                  <button className="hero-card-option">
                    <span className="hero-card-option-dot"></span>
                    Éducation et formation
                  </button>
                  <button className="hero-card-option">
                    <span className="hero-card-option-dot"></span>
                    Santé et bien-être
                  </button>
                </div>
              </div>

              <div className="hero-card-footer">
                <div className="hero-card-progress">
                  <div className="hero-card-progress-label">Engagement: 62%</div>
                  <div className="hero-card-progress-bar">
                    <div className="hero-card-progress-fill"></div>
                  </div>
                </div>
                <div className="hero-card-mini">
                  <span className="hero-card-mini-pill"></span>
                  En direct
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="comment">
          <div className="section-header">
            <div className="section-eyebrow">Comment ça marche</div>
            <h2 className="section-title">3 étapes simples vers l'action</h2>
            <p className="section-subtitle">Transformez votre compréhension en impact réel.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon"><span>1</span></div>
              <h3 className="step-title">Comprendre</h3>
              <p className="step-text">Accédez à des informations vérifiées sur les enjeux civiques qui vous intéressent.</p>
              <div className="step-tag">
                <span className="step-tag-dot"></span>
                Articles de fond
              </div>
            </div>

            <div className="step-card">
              <div className="step-icon"><span>2</span></div>
              <h3 className="step-title">Participer</h3>
              <p className="step-text">Engagez-vous dans des débats constructifs avec d'autres citoyens et experts.</p>
              <div className="step-tag">
                <span className="step-tag-dot"></span>
                Débats en temps réel
              </div>
            </div>

            <div className="step-card">
              <div className="step-icon"><span>3</span></div>
              <h3 className="step-title">Influencer</h3>
              <p className="step-text">Votre voix compte. Participez aux votes et décisions qui façonnent votre communauté.</p>
              <div className="step-tag">
                <span className="step-tag-dot"></span>
                Impact mesurable
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="map-section">
            <div>
              <div className="section-header">
                <div className="section-eyebrow">Carte citoyenne</div>
                <h2 className="section-title">Engagement par région</h2>
                <p className="section-subtitle">Découvrez où le changement se fait et comment vous pouvez vous impliquer dans votre région.</p>
              </div>
            </div>

            <div className="map-card">
              <div className="map-header">
                <div className="map-header-title">Canada - Mai 2026</div>
                <div className="map-header-pill">
                  <span className="map-header-pill-dot"></span>
                  3 régions actives
                </div>
              </div>

              <div className="map-frame">
                <div className="map-visual">
                  <button className="map-region map-region--west">
                    <div className="map-region-flag"></div>
                  </button>
                  <button className="map-region map-region--center">
                    <div className="map-region-flag"></div>
                  </button>
                  <button className="map-region map-region--east">
                    <div className="map-region-flag"></div>
                  </button>
                </div>
              </div>

              <div className="map-footer">
                <span><strong>Ouest:</strong> 12,340 citoyens</span>
                <span className="map-legend">
                  <span className="map-legend-dot"></span>
                  Engagement actif
                </span>
              </div>
            </div>
          </div>
        </section>

        <section style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '2rem' }}>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>Prêt à faire la différence ?</h2>
          <p className="section-subtitle" style={{ marginBottom: '1.5rem', maxWidth: '100%' }}>
            Rejoignez des milliers de citoyens qui transforment leur engagement en action.
          </p>
          <a href="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
            Créer mon compte
          </a>
        </section>
      </div>
    </div>
  )
}
