import { useTranslation } from 'react-i18next';
import './Home.css'

export function Home() {
  const { t } = useTranslation();

  return (
    <div className="page">
      <div className="shell">
        <section className="hero" style={{ paddingTop: '1rem' }}>
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot"></span>
              {t('home.eyebrow')}
            </div>

            <h1 className="hero-title">
              {t('home.title')}
            </h1>

            <p className="hero-subtitle" dangerouslySetInnerHTML={{ __html: t('home.subtitle') }} />

            <div className="hero-ctas">
              <a href="/register" className="btn btn-primary">{t('home.cta.start')}</a>
              <a href="#comment" className="btn btn-ghost">{t('home.cta.learnMore')}</a>
            </div>

            <div className="hero-meta">
              <div className="hero-meta-item">
                <span className="hero-meta-dot"></span>
                {t('home.meta.citizens')}
              </div>
              <div className="hero-meta-item">
                <span className="hero-meta-dot"></span>
                {t('home.meta.verified')}
              </div>
              <div className="hero-meta-item">
                <span className="hero-meta-dot"></span>
                {t('home.meta.impact')}
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
                    <div className="hero-mascotte-name">{t('home.mascotte.name')}</div>
                    <div className="hero-mascotte-role">{t('home.mascotte.role')}</div>
                  </div>
                </div>
                <div className="hero-card-badge">{t('home.mascotte.status')}</div>
              </div>

              <div className="hero-card-body">
                <div className="hero-card-question">{t('home.mascotte.question')}</div>
                <div className="hero-card-options">
                  <button className="hero-card-option">
                    <span className="hero-card-option-dot"></span>
                    {t('home.options.climate')}
                  </button>
                  <button className="hero-card-option">
                    <span className="hero-card-option-dot"></span>
                    {t('home.options.education')}
                  </button>
                  <button className="hero-card-option">
                    <span className="hero-card-option-dot"></span>
                    {t('home.options.health')}
                  </button>
                </div>
              </div>

              <div className="hero-card-footer">
                <div className="hero-card-progress">
                  <div className="hero-card-progress-label">{t('home.mascotte.engagement')}</div>
                  <div className="hero-card-progress-bar">
                    <div className="hero-card-progress-fill"></div>
                  </div>
                </div>
                <div className="hero-card-mini">
                  <span className="hero-card-mini-pill"></span>
                  {t('home.mascotte.live')}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="comment">
          <div className="section-header">
            <div className="section-eyebrow">{t('home.howItWorks.eyebrow')}</div>
            <h2 className="section-title">{t('home.howItWorks.title')}</h2>
            <p className="section-subtitle">{t('home.howItWorks.subtitle')}</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon"><span>1</span></div>
              <h3 className="step-title">{t('home.howItWorks.step1.title')}</h3>
              <p className="step-text">{t('home.howItWorks.step1.text')}</p>
              <div className="step-tag">
                <span className="step-tag-dot"></span>
                {t('home.howItWorks.step1.tag')}
              </div>
            </div>

            <div className="step-card">
              <div className="step-icon"><span>2</span></div>
              <h3 className="step-title">{t('home.howItWorks.step2.title')}</h3>
              <p className="step-text">{t('home.howItWorks.step2.text')}</p>
              <div className="step-tag">
                <span className="step-tag-dot"></span>
                {t('home.howItWorks.step2.tag')}
              </div>
            </div>

            <div className="step-card">
              <div className="step-icon"><span>3</span></div>
              <h3 className="step-title">{t('home.howItWorks.step3.title')}</h3>
              <p className="step-text">{t('home.howItWorks.step3.text')}</p>
              <div className="step-tag">
                <span className="step-tag-dot"></span>
                {t('home.howItWorks.step3.tag')}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="map-section">
            <div>
              <div className="section-header">
                <div className="section-eyebrow">{t('home.map.eyebrow')}</div>
                <h2 className="section-title">{t('home.map.title')}</h2>
                <p className="section-subtitle">{t('home.map.subtitle')}</p>
              </div>
            </div>

            <div className="map-card">
              <div className="map-header">
                <div className="map-header-title">{t('home.map.header')}</div>
                <div className="map-header-pill">
                  <span className="map-header-pill-dot"></span>
                  {t('home.map.activeRegions')}
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
                <span>{t('home.map.west')}</span>
                <span className="map-legend">
                  <span className="map-legend-dot"></span>
                  {t('home.map.engagement')}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '2rem' }}>
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>{t('home.cta2.title')}</h2>
          <p className="section-subtitle" style={{ marginBottom: '1.5rem', maxWidth: '100%' }}>
            {t('home.cta2.subtitle')}
          </p>
          <a href="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
            {t('home.cta.createAccount')}
          </a>
        </section>
      </div>
    </div>
  )
}
