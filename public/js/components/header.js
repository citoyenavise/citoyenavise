/**
 * Header/Navigation Component
 */

function createHeader() {
  const header = document.createElement('header');
  header.id = 'main-header';
  header.className = 'header';
  header.innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="/" class="nav-logo">🍁 Citoyen Avisé</a>

        <ul class="nav-menu">
          <li><a href="/" class="nav-link">Accueil</a></li>
          <li><a href="/feed" class="nav-link">Fil d'actualité</a></li>
          <li><a href="/ideas" class="nav-link">Idées</a></li>

          <li class="nav-separator"></li>

          <li id="nav-auth">
            <a href="/login" class="nav-link">Connexion</a>
          </li>

          <li id="nav-user" style="display:none;">
            <div class="nav-user-menu">
              <a href="#" id="nav-user-link" class="nav-link nav-user-link">
                <span class="avatar avatar-sm" id="nav-user-avatar">?</span>
                <span id="nav-user-name">User</span>
              </a>
              <div class="nav-dropdown">
                <a href="#" id="nav-profile-link" class="dropdown-item">Mon profil</a>
                <a href="#" id="nav-create-post-link" class="dropdown-item">Créer un post</a>
                <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
                <a href="#" id="nav-logout-link" class="dropdown-item">Déconnexion</a>
              </div>
            </div>
          </li>
        </ul>

        <button class="hamburger" id="hamburger">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;

  // Styles
  if (!document.querySelector('#header-styles')) {
    const style = document.createElement('style');
    style.id = 'header-styles';
    style.textContent = `
      .header {
        background: var(--rouge);
        color: white;
        position: sticky;
        top: 0;
        z-index: 100;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .navbar {
        max-width: 1200px;
        margin: 0 auto;
      }

      .nav-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
      }

      .nav-logo {
        font-size: 1.4rem;
        font-weight: 700;
        color: white;
        text-decoration: none;
        margin-right: 40px;
      }

      .nav-menu {
        display: flex;
        list-style: none;
        gap: 8px;
        align-items: center;
        flex: 1;
      }

      .nav-link {
        color: rgba(255,255,255,0.9);
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 0.95rem;
        transition: all 0.3s;
      }

      .nav-link:hover {
        background: rgba(255,255,255,0.15);
        color: white;
      }

      .nav-separator {
        width: 1px;
        height: 20px;
        background: rgba(255,255,255,0.2);
        margin: 0 8px;
      }

      .nav-user-menu {
        position: relative;
      }

      .nav-user-link {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .nav-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 6px;
        min-width: 180px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
        margin-top: 8px;
      }

      .nav-user-menu:hover .nav-dropdown {
        opacity: 1;
        pointer-events: auto;
      }

      .dropdown-item {
        display: block;
        padding: 12px 16px;
        color: var(--gris-texte);
        text-decoration: none;
        font-size: 0.95rem;
        transition: all 0.2s;
      }

      .dropdown-item:hover {
        background: var(--gris-pale);
        color: var(--rouge);
      }

      .hamburger {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        flex-direction: column;
        gap: 6px;
      }

      .hamburger span {
        width: 24px;
        height: 3px;
        background: white;
        transition: all 0.3s;
      }

      @media (max-width: 768px) {
        .hamburger { display: flex; }
        .nav-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          flex-direction: column;
          background: var(--rouge);
          gap: 0;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s;
        }
        .nav-menu.active {
          max-height: 500px;
        }
        .nav-link {
          padding: 12px 20px;
          border-radius: 0;
          width: 100%;
        }
        .nav-separator { display: none; }
        .nav-dropdown {
          position: static;
          opacity: 1;
          pointer-events: auto;
          box-shadow: none;
          background: rgba(255,255,255,0.1);
          margin-top: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return header;
}

/**
 * Initialiser le header et ses interactions
 */
function initHeader() {
  const header = createHeader();
  const container = document.querySelector('body');
  if (container.firstChild) {
    container.insertBefore(header, container.firstChild);
  } else {
    container.appendChild(header);
  }

  // Hamburger
  const hamburger = header.querySelector('#hamburger');
  const navMenu = header.querySelector('.nav-menu');
  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // Fermer menu au clic
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
    });
  });

  // Mettre à jour selon authentification
  updateHeaderAuth(header);

  // Écouter changements d'auth
  store.subscribe(state => {
    updateHeaderAuth(header);
  });

  return header;
}

/**
 * Mettre à jour le header selon l'état d'authentification
 */
function updateHeaderAuth(header) {
  const authSection = header.querySelector('#nav-auth');
  const userSection = header.querySelector('#nav-user');
  const user = store.getUser();
  const profile = store.getProfile();

  if (user && profile) {
    authSection.style.display = 'none';
    userSection.style.display = 'block';

    // Mettre à jour avatar et nom
    const avatar = header.querySelector('#nav-user-avatar');
    const name = header.querySelector('#nav-user-name');

    avatar.textContent = getInitials(user.username || 'U');
    avatar.style.background = getRandomColor();
    name.textContent = user.username || 'User';

    // Événements
    header.querySelector('#nav-profile-link').addEventListener('click', e => {
      e.preventDefault();
      navigate(`/profiles/${profile.id}`);
    });

    header.querySelector('#nav-create-post-link').addEventListener('click', e => {
      e.preventDefault();
      navigate('/posts/create');
    });

    header.querySelector('#nav-logout-link').addEventListener('click', e => {
      e.preventDefault();
      api.auth.logout();
      store.clear();
      navigate('/');
      showToast('Déconnecté avec succès', 'success');
    });
  } else {
    authSection.style.display = 'block';
    userSection.style.display = 'none';
  }
}
