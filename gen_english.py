# -*- coding: utf-8 -*-
import os

OUT = os.path.join(os.path.dirname(__file__), 'en')
os.makedirs(OUT, exist_ok=True)

GA = '''  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RDFSPWC9R2"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RDFSPWC9R2');
  </script>'''

def nav(active='', lang_url='../index.html'):
    pages = [
        ('elections.html','Elections'),
        ('government.html','Government'),
        ('rights.html','Rights'),
        ('services.html','Services'),
        ('participate.html','Participate'),
    ]
    lis = ''
    for href, label in pages:
        cls = ' class="actif"' if href == active else ''
        lis += f'      <li><a href="{href}"{cls}>{label}</a></li>\n'
    return f'''<nav class="nav">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">🍁 Citoyen <span>Avisé</span></a>
    <ul class="nav-liens">
      <li><a href="index.html">Home</a></li>
{lis}      <li class="nav-dropdown">
        <a href="#" class="nav-dropdown-toggle">Resources</a>
        <div class="nav-dropdown-menu">
          <a href="map.html">🗺️ Citizen Map</a>
          <a href="news.html">📰 News</a>
          <a href="glossary.html">📖 Glossary</a>
          <a href="calendar.html">📅 Calendar</a>
        </div>
      </li>
      <li><a href="about.html">About</a></li>
      <li><a href="{lang_url}" class="nav-lang" title="Version française">🇫🇷 FR</a></li>
      <li><a href="../index.html#infolettre" class="nav-cta">Subscribe</a></li>
    </ul>
    <button class="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
  <div class="menu-mobile">
    <a href="index.html">🏠 Home</a>
    <a href="elections.html">🗳️ Elections</a>
    <a href="government.html">🏛️ Government</a>
    <a href="rights.html">⚖️ Rights</a>
    <a href="services.html">🛎️ Services</a>
    <a href="participate.html">🤝 Participate</a>
    <a href="map.html">🗺️ Citizen Map</a>
    <a href="news.html">📰 News</a>
    <a href="about.html">ℹ️ About</a>
    <a href="{lang_url}" class="nav-lang">🇫🇷 Version française</a>
    <a href="../index.html#infolettre" class="nav-cta-mobile">Subscribe to newsletter</a>
  </div>
</nav>'''

def footer():
    return '''<footer class="footer">
  <div class="footer-inner">
    <div class="footer-col">
      <p class="footer-logo">🍁 Citoyen Avisé</p>
      <p class="footer-desc">Informing, equipping and mobilizing Canadian citizens.</p>
    </div>
    <div class="footer-col">
      <p class="footer-titre">Organization</p>
      <ul>
        <li><a href="about.html">About</a></li>
        <li><a href="../politique-confidentialite.html">Privacy Policy</a></li>
        <li><a href="map.html">Citizen Map</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <p class="footer-titre">Explore</p>
      <ul>
        <li><a href="government.html">Government</a></li>
        <li><a href="rights.html">Rights</a></li>
        <li><a href="services.html">Services</a></li>
        <li><a href="participate.html">Participate</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <p class="footer-titre">Resources</p>
      <ul>
        <li><a href="news.html">News</a></li>
        <li><a href="glossary.html">Glossary</a></li>
        <li><a href="calendar.html">Calendar</a></li>
        <li><a href="quiz.html">Civic Quiz</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bas">
    <p>© 2026 Citoyen Avisé — <a href="../politique-confidentialite.html">Privacy Policy</a> — <a href="about.html">Legal Notice</a></p>
  </div>
</footer>
<script src="../js/main.js"></script>'''

def page(fname, title, desc, canon, active, lang_url, body):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Citoyen Avisé</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://citoyenavise.org/en/{canon}">
  <link rel="alternate" hreflang="fr" href="https://citoyenavise.org/{lang_url.replace('../','')}">
  <link rel="alternate" hreflang="en" href="https://citoyenavise.org/en/{canon}">
  <link rel="stylesheet" href="../css/style.css">
{GA}
</head>
<body>
{nav(active, lang_url)}
{body}
{footer()}
</body>
</html>'''

# ── INDEX ──────────────────────────────────────────────────────
index_body = '''<header class="entete-hero">
  <div class="conteneur">
    <div class="hero-contenu">
      <div class="hero-texte">
        <div class="hero-badge">🍁 Free · Non-partisan · Independent</div>
        <h1>Canadian Civic Information,<br>Centralized and Free.</h1>
        <p class="lead">Citoyen Avisé brings together essential Canadian public information in one place — accessible to all Canadians, in French and English, without advertising or partisanship.</p>
        <div class="hero-actions">
          <a href="elections.html" class="btn btn-rouge">Explore Elections →</a>
          <a href="map.html" class="btn btn-contour">View Citizen Map</a>
        </div>
      </div>
    </div>
  </div>
</header>

<section class="section">
  <div class="conteneur">
    <h2 class="titre-section">Explore by Topic</h2>
    <div class="grille-3">
      <a class="carte" href="government.html">
        <div class="card fade-in">
          <div class="card-icon">🏛️</div>
          <h3>Government</h3>
          <p>Parliament, Constitution, Federal, Provincial, Municipal — understand how Canada is governed at every level.</p>
          <span class="card-lien">Explore →</span>
        </div>
      </a>
      <a class="carte" href="rights.html">
        <div class="card fade-in">
          <div class="card-icon">⚖️</div>
          <h3>Rights</h3>
          <p>Charter of Rights, Indigenous rights, immigration — know and exercise your fundamental rights.</p>
          <span class="card-lien">Explore →</span>
        </div>
      </a>
      <a class="carte" href="services.html">
        <div class="card fade-in">
          <div class="card-icon">🛎️</div>
          <h3>Public Services</h3>
          <p>Taxes, Employment Insurance, Retirement, Housing — official links to access the services you need.</p>
          <span class="card-lien">Explore →</span>
        </div>
      </a>
      <a class="carte" href="participate.html">
        <div class="card fade-in">
          <div class="card-icon">🤝</div>
          <h3>Participate</h3>
          <p>Elected officials, petitions, civic groups, citizen budget — tools to engage in democracy.</p>
          <span class="card-lien">Explore →</span>
        </div>
      </a>
      <a class="carte" href="elections.html">
        <div class="card fade-in">
          <div class="card-icon">🗳️</div>
          <h3>Elections</h3>
          <p>Understand the electoral system, register to vote, track campaigns and analyze results.</p>
          <span class="card-lien">Explore →</span>
        </div>
      </a>
      <a class="carte" href="map.html">
        <div class="card fade-in">
          <div class="card-icon">🗺️</div>
          <h3>Citizen Map</h3>
          <p>Visualize the Canadian citizen network in real time. Join the communities in your region.</p>
          <span class="card-lien">Explore →</span>
        </div>
      </a>
    </div>
  </div>
</section>

<section class="section-valeurs">
  <div class="conteneur">
    <h2 class="titre-section">Why Citoyen Avisé?</h2>
    <div class="grille-3">
      <div class="valeur-item fade-in">
        <div class="flex"><span style="font-size:1.4rem;">🎯</span><div><strong>Non-partisan</strong> — We make public information truly accessible. Official sources cited, no sponsored content, no political affiliation.</div></div>
      </div>
      <div class="valeur-item fade-in">
        <div class="flex"><span style="font-size:1.4rem;">🤝</span><div><strong>Engaging</strong> — An informed citizen is an engaged citizen. We facilitate access to democratic tools: petitions, contacting your elected officials, tracking issues.</div></div>
      </div>
      <div class="valeur-item fade-in">
        <div class="flex"><span style="font-size:1.4rem;">🆓</span><div><strong>Free forever</strong> — Access to civic information is a right. No subscription, no paywall, no advertising.</div></div>
      </div>
    </div>
  </div>
</section>

<section class="section-newsletter" id="infolettre">
  <div class="conteneur">
    <h2>Stay Informed. Stay Civically Engaged.</h2>
    <p class="lead">Receive the essential Canadian civic news directly in your inbox — no noise, no partisanship, no advertising.</p>
    <iframe name="brevo-hidden-en" style="display:none;" aria-hidden="true"></iframe>
    <form class="form-infolettre" id="formInfolettreEN"
      method="POST"
      action="https://3c94400c.sibforms.com/serve/MUIFAANPi6itp2hjoSCoGC7u03RPQy56kVMPjU5xUlkHpzDrgdgjr-EXzPAH-AjGW-caB1cMGm09CJp-Azet8yDJ3AKdPMDAa_ADafusegBUUFob8qD8tyI1jDcXp3AICvWtWLsbm-xa1LW7ZYZC2McHJ6agusvADM2E7Li4PKSwYfCU6OqgTsyvPp7rR_JieFrVx5hYZtGN_rTYkw=="
      target="brevo-hidden-en">
      <input type="email" name="EMAIL" id="emailEN" placeholder="Your email address" required autocomplete="email">
      <input type="text" name="email_address_check" value="" style="display:none;" aria-hidden="true">
      <input type="hidden" name="locale" value="en">
      <button type="submit" class="btn btn-blanc" id="btnEN">Subscribe for free →</button>
    </form>
    <p class="note-confidentialite" id="msgEN">🔒 No spam. Unsubscribe in one click. Your data is never sold.</p>
  </div>
</section>
<script>
document.getElementById('formInfolettreEN').addEventListener('submit', function() {
  var btn = document.getElementById('btnEN');
  var msg = document.getElementById('msgEN');
  btn.textContent = '✓ Subscription confirmed!';
  btn.disabled = true;
  document.getElementById('emailEN').value = '';
  msg.textContent = '🎉 Thank you! Check your inbox to confirm your subscription.';
});
</script>'''

pages_data = [
  {
    'fname': 'index.html',
    'title': 'Canadian Civic Information, Free and Independent',
    'desc': 'Citoyen Avisé — Canadian civic information platform. Elections, government, rights and public services — centralized, accessible and free.',
    'canon': 'index.html',
    'active': '',
    'lang_url': '../index.html',
    'body': index_body,
  },
  {
    'fname': 'government.html',
    'title': 'Canadian Government — How Canada Works',
    'desc': 'Understand the structure of Canadian government: Parliament, Constitution, federal, provincial, municipal and judicial institutions.',
    'canon': 'government.html',
    'active': 'government.html',
    'lang_url': '../gouvernement.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › Government</p>
    <h1>🏛️ Canadian Government</h1>
    <p class="lead">Understand how Canada is governed at every level — from federal institutions to your local city hall.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <h2 class="titre-section">Explore in Detail</h2>
      <div class="grille-3">
        <div class="card fade-in"><div class="card-icon">🏛️</div><h3>Parliament</h3><p>The House of Commons, the Senate, the legislative process — how federal laws are made.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">📜</div><h3>Constitution</h3><p>The Constitution Act, the Charter of Rights and Freedoms, the division of powers between federal and provincial governments.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🏙️</div><h3>Provincial Government</h3><p>Provincial legislatures, premiers, areas of jurisdiction — your province's role in your daily life.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🏘️</div><h3>Municipal Government</h3><p>City councils, mayors, municipal services — local democracy closest to citizens.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">⚖️</div><h3>Judicial System</h3><p>The Supreme Court, courts of justice, how the judiciary works and how to access justice.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🪶</div><h3>Indigenous Governance</h3><p>Indigenous self-governance systems, land rights and nation-to-nation relationships.</p><span class="card-lien">Coming soon</span></div>
      </div>
    </div>
  </section>
</main>''',
  },
  {
    'fname': 'rights.html',
    'title': 'Your Rights as a Canadian Citizen',
    'desc': 'Know and exercise your fundamental rights in Canada: Charter, Indigenous rights, immigration, digital rights.',
    'canon': 'rights.html',
    'active': 'rights.html',
    'lang_url': '../droits.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › Rights</p>
    <h1>⚖️ Your Rights</h1>
    <p class="lead">Know, understand and exercise the rights guaranteed to you by the Canadian Constitution and the Charter of Rights and Freedoms.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <h2 class="titre-section">Explore in Detail</h2>
      <div class="grille-3">
        <div class="card fade-in"><div class="card-icon">📋</div><h3>Charter of Rights</h3><p>Fundamental freedoms, democratic rights, mobility rights, legal rights — a complete guide to the Canadian Charter.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🪶</div><h3>Indigenous Rights</h3><p>Recognized rights of First Nations, Métis and Inuit peoples, Section 35 of the Constitution, land rights and self-determination.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">✈️</div><h3>Immigration & Citizenship</h3><p>Permanent residence, citizenship, refugee status — paths to becoming a Canadian citizen and your associated rights.</p><span class="card-lien">Coming soon</span></div>
      </div>
    </div>
  </section>
</main>''',
  },
  {
    'fname': 'services.html',
    'title': 'Canadian Public Services — Access Your Benefits',
    'desc': 'Taxes, Employment Insurance, Retirement, Housing, Health, Education — official links and guides to access Canadian public services.',
    'canon': 'services.html',
    'active': 'services.html',
    'lang_url': '../services.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › Public Services</p>
    <h1>🛎️ Public Services</h1>
    <p class="lead">Access all federal and provincial public services: taxes, employment insurance, pensions, housing, health and education.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <h2 class="titre-section">Explore in Detail</h2>
      <div class="grille-3">
        <div class="card fade-in"><div class="card-icon">💰</div><h3>Taxes</h3><p>File your tax return, understand tax credits, RRSP, TFSA — everything you need to know about Canadian taxation.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">💼</div><h3>Employment Insurance</h3><p>Eligibility, how to apply, benefit amounts — a complete guide to EI in Canada.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">👴</div><h3>Retirement</h3><p>CPP, OAS, GIS — understand your public pension benefits and how to maximize them.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🏠</div><h3>Housing</h3><p>Tenant rights, housing assistance, first-time buyer programs — your housing rights explained.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🎓</div><h3>Education</h3><p>Student loans, grants, school system — federal and provincial support for education.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🏥</div><h3>Health</h3><p>Medicare, pharmacare, mental health resources — understanding the Canadian health system.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🌿</div><h3>Environment</h3><p>Carbon pricing, environmental programs, climate action rebates — environmental measures and your rights.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🛡️</div><h3>Public Safety</h3><p>Police, emergency services, legal aid — your safety rights and emergency resources.</p><span class="card-lien">Coming soon</span></div>
      </div>
    </div>
  </section>
</main>''',
  },
  {
    'fname': 'participate.html',
    'title': 'Participate in Democracy — Civic Tools for Canadians',
    'desc': 'Tools for civic participation in Canada: contact your elected officials, sign petitions, join groups, understand the citizen budget.',
    'canon': 'participate.html',
    'active': 'participate.html',
    'lang_url': '../participer.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › Participate</p>
    <h1>🤝 Participate</h1>
    <p class="lead">Democracy requires active citizens. Here are the tools to make your voice heard and get involved at every level.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <h2 class="titre-section">Explore in Detail</h2>
      <div class="grille-3">
        <div class="card fade-in"><div class="card-icon">🏛️</div><h3>Elected Officials</h3><p>Find your MP, MNA, city councillor — contact them and follow their work in Parliament.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">✍️</div><h3>Petitions</h3><p>Sign or create a petition, understand how petitions work in the House of Commons and provincial legislatures.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🤝</div><h3>Civic Groups</h3><p>Find organizations in your community, citizen coalitions and civic engagement networks near you.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">📊</div><h3>Citizen Budget</h3><p>Understand government spending, analyze public budgets and participate in citizen consultations.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">🧠</div><h3>Civic Quiz</h3><p>Test your knowledge of Canadian democracy with our interactive quiz.</p><a href="quiz.html" class="card-lien">Start the quiz →</a></div>
        <div class="card fade-in"><div class="card-icon">📚</div><h3>Resources</h3><p>Guides, official documents, links to government agencies — a curated list of reliable civic resources.</p><span class="card-lien">Coming soon</span></div>
      </div>
    </div>
  </section>
</main>''',
  },
  {
    'fname': 'elections.html',
    'title': 'Canadian Elections — Your Complete Voting Guide',
    'desc': 'Everything about Canadian elections: register to vote, understand the electoral system, follow the campaign, analyze results.',
    'canon': 'elections.html',
    'active': 'elections.html',
    'lang_url': '../elections.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › Elections</p>
    <h1>🗳️ Elections</h1>
    <p class="lead">Understand the Canadian electoral system, register to vote and exercise your democratic right at federal, provincial and municipal levels.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <div class="grille-3">
        <div class="card fade-in"><div class="card-icon">📋</div><h3>Register to Vote</h3><p>Check your electoral registration status, register online and find your polling station.</p><a href="https://ereg.elections.ca/CWelcome.aspx" target="_blank" rel="noopener" class="card-lien">Elections Canada →</a></div>
        <div class="card fade-in"><div class="card-icon">🗺️</div><h3>Find Your Riding</h3><p>Identify your federal riding, your MP and the candidates in your area.</p><a href="https://www.elections.ca/Scripts/vis/FindED" target="_blank" rel="noopener" class="card-lien">Find my riding →</a></div>
        <div class="card fade-in"><div class="card-icon">🏛️</div><h3>How It Works</h3><p>The first-past-the-post system, proportional representation, redistribution — understand Canada's electoral system.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">📅</div><h3>Electoral Calendar</h3><p>Upcoming federal, provincial and municipal elections — stay informed about electoral deadlines.</p><a href="../calendrier.html" class="card-lien">View calendar →</a></div>
        <div class="card fade-in"><div class="card-icon">💰</div><h3>Campaign Financing</h3><p>Contribution limits, spending reports, transparency in party and candidate financing.</p><span class="card-lien">Coming soon</span></div>
        <div class="card fade-in"><div class="card-icon">📊</div><h3>Results & History</h3><p>Federal election results since Confederation, historical trends and electoral maps.</p><a href="https://www.elections.ca/content.aspx?section=res&dir=rep/off&document=index&lang=e" target="_blank" rel="noopener" class="card-lien">Official results →</a></div>
      </div>
    </div>
  </section>
</main>''',
  },
  {
    'fname': 'about.html',
    'title': 'About Citoyen Avisé — Our Mission',
    'desc': 'Citoyen Avisé is an independent Canadian civic initiative to make public information accessible to all Canadians, free and non-partisan.',
    'canon': 'about.html',
    'active': '',
    'lang_url': '../a-propos.html',
    'body': '''<main class="contenu-page" style="max-width:800px; margin:0 auto; padding:40px 20px 80px;">
  <p class="fil-ariane"><a href="index.html">Home</a> › About</p>
  <h1>ℹ️ About Citoyen Avisé</h1>
  <section style="margin-bottom:36px;">
    <h2>Our Mission</h2>
    <p>Citoyen Avisé is an independent, non-partisan civic initiative with a single goal: make Canadian public information genuinely accessible to all Canadians, free of charge.</p>
    <p>We believe that civic education is the foundation of a healthy democracy. Too often, information about our rights, public services and democratic institutions is scattered across dozens of government sites, written in complex language and difficult to find. We're changing that.</p>
  </section>
  <section style="margin-bottom:36px;">
    <h2>Our Principles</h2>
    <div class="grille-3" style="margin-top:16px;">
      <div class="card fade-in"><div class="card-icon">🎯</div><h3>Non-partisan</h3><p>No political affiliation, no sponsored content, no hidden agenda. Just facts and official sources.</p></div>
      <div class="card fade-in"><div class="card-icon">🆓</div><h3>Free forever</h3><p>Access to civic information is a right, not a privilege. The platform will always be free.</p></div>
      <div class="card fade-in"><div class="card-icon">🤝</div><h3>Bilingual</h3><p>Available in French and English to serve all Canadians, wherever they are.</p></div>
    </div>
  </section>
  <section style="background:rgba(193,39,45,.08); border:1px solid rgba(193,39,45,.2); border-radius:10px; padding:24px; margin-top:40px;">
    <h2 style="margin-top:0;">Contact</h2>
    <p><strong>Citoyen Avisé</strong><br><a href="mailto:infocitoyenavise@gmail.com">infocitoyenavise@gmail.com</a></p>
  </section>
</main>''',
  },
  {
    'fname': 'map.html',
    'title': 'Citizen Map — Canadian Civic Network',
    'desc': 'Visualize the Canadian citizen network in real time. Join local communities and participate in democracy in your region.',
    'canon': 'map.html',
    'active': '',
    'lang_url': '../carte.html',
    'body': '''<main class="contenu-page" style="max-width:700px; margin:0 auto; padding:60px 20px; text-align:center;">
  <p class="fil-ariane" style="text-align:left;"><a href="index.html">Home</a> › Citizen Map</p>
  <div style="font-size:3rem; margin-bottom:16px;">🗺️</div>
  <h1>Citizen Map</h1>
  <p class="lead">The Citizen Map is available in French. Click below to access it and join the real-time Canadian citizen network.</p>
  <a href="../carte.html" class="btn btn-rouge" style="margin-top:24px; display:inline-block;">View the Citizen Map →</a>
  <p style="margin-top:20px; color:rgba(255,255,255,.4); font-size:.85rem;">The map interface is bilingual — your profile and registration work in English.</p>
</main>''',
  },
  {
    'fname': 'news.html',
    'title': 'Canadian Civic News — Non-partisan Analysis',
    'desc': 'Essential Canadian civic and political news, explained without partisanship: budgets, elections, rights, public services.',
    'canon': 'news.html',
    'active': '',
    'lang_url': '../actualites.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › News</p>
    <h1>📰 Civic News</h1>
    <p class="lead">The essential of Canadian democratic life, explained without partisanship — to understand what is happening, not just what makes noise.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <div class="article-vedette fade-in">
        <span class="tag-blanc">🇨🇦 Federal · April 2026</span>
        <h2>Federal Budget 2026: What It Actually Means for You</h2>
        <p>The Finance Minister tabled the 2026 federal budget. Here, without political jargon, are the measures that directly affect Canadian households: housing, cost of living, healthcare and personal income tax.</p>
        <div class="meta">📖 Read: 5 min · ✅ Sources: Department of Finance Canada</div>
      </div>
      <div class="grille-3" style="margin-top:32px;">
        <div class="carte-article fade-in">
          <div class="carte-article-bandeau" style="background:var(--rouge);"></div>
          <div class="carte-article-corps">
            <span class="carte-article-tag" style="background:#fdeaea;color:var(--rouge);">🇨🇦 Federal</span>
            <h3>Budget 2026: Housing, Health and Cost of Living</h3>
            <p>The federal budget 2026 focuses on 3 priorities: affordable housing, health transfers and targeted tax relief for middle-income households.</p>
            <div class="carte-article-pied"><span class="date">📅 April 2026</span></div>
          </div>
        </div>
        <div class="carte-article fade-in">
          <div class="carte-article-bandeau" style="background:#9C27B0;"></div>
          <div class="carte-article-corps">
            <span class="carte-article-tag" style="background:#f3e5f5;color:#6A1B9A;">🗳️ Elections</span>
            <h3>How Electoral Redistribution Works</h3>
            <p>Every ten years, the Electoral Boundaries Commission redraws Canada's electoral map to reflect demographic changes. What does this mean for your vote?</p>
            <div class="carte-article-pied"><span class="date">📅 March 2026</span></div>
          </div>
        </div>
        <div class="carte-article fade-in">
          <div class="carte-article-bandeau" style="background:#1565C0;"></div>
          <div class="carte-article-corps">
            <span class="carte-article-tag" style="background:#e3f0ff;color:#1565C0;">⚖️ Rights</span>
            <h3>Bill C-27 and Your Digital Rights</h3>
            <p>Canada's proposed Digital Charter Implementation Act would give Canadians new rights over their personal data. Here's what you need to know.</p>
            <div class="carte-article-pied"><span class="date">📅 February 2026</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>''',
  },
  {
    'fname': 'glossary.html',
    'title': 'Civic Glossary — Key Canadian Political Terms',
    'desc': 'Definitions of key terms in Canadian politics and civic life: Parliament, Federation, Charter, Riding, and more.',
    'canon': 'glossary.html',
    'active': '',
    'lang_url': '../glossaire.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › Glossary</p>
    <h1>📖 Civic Glossary</h1>
    <p class="lead">Key terms in Canadian civic and political life, explained clearly.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <p style="text-align:center; color:rgba(255,255,255,.5);">Full English glossary coming soon. <a href="../glossaire.html">View French version →</a></p>
    </div>
  </section>
</main>''',
  },
  {
    'fname': 'calendar.html',
    'title': 'Civic Calendar — Key Canadian Democratic Dates',
    'desc': 'Important dates in Canadian civic and democratic life: elections, parliamentary sessions, fiscal deadlines.',
    'canon': 'calendar.html',
    'active': '',
    'lang_url': '../calendrier.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › Calendar</p>
    <h1>📅 Civic Calendar</h1>
    <p class="lead">Key dates in Canadian democratic life — elections, parliamentary sessions, fiscal deadlines.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <p style="text-align:center; color:rgba(255,255,255,.5);">Full English calendar coming soon. <a href="../calendrier.html">View French version →</a></p>
    </div>
  </section>
</main>''',
  },
  {
    'fname': 'quiz.html',
    'title': 'Civic Quiz — Test Your Knowledge of Canada',
    'desc': 'Test your knowledge of Canadian democracy, government and your rights with our interactive civic quiz.',
    'canon': 'quiz.html',
    'active': '',
    'lang_url': '../quiz.html',
    'body': '''<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Home</a> › Civic Quiz</p>
    <h1>🧠 Civic Quiz</h1>
    <p class="lead">Test your knowledge of Canadian democracy, rights and government.</p>
  </div>
</header>
<main>
  <section class="section">
    <div class="conteneur">
      <p style="text-align:center; color:rgba(255,255,255,.5);">Full English quiz coming soon. <a href="../quiz.html">View French version →</a></p>
    </div>
  </section>
</main>''',
  },
]

written = 0
for p in pages_data:
    html = page(p['fname'], p['title'], p['desc'], p['canon'], p['active'], p['lang_url'], p['body'])
    path = os.path.join(OUT, p['fname'])
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    written += 1
    print(f"OK: en/{p['fname']}")

print(f"\nTotal: {written} English pages created in en/")
