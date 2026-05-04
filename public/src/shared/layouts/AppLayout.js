/**
 * App Layout
 * Layout principal avec header et sidebar
 */

const Header = require('../components/Header');

class AppLayout {
  constructor() {
    this.header = new Header();
  }

  render() {
    const layout = document.createElement('div');
    layout.className = 'app-layout';
    layout.innerHTML = `
      <div id="header-container"></div>
      <main class="main-content">
        <div id="page-content"></div>
      </main>
      <footer class="footer">
        <p>&copy; 2026 Citoyen Avisé - Démocratie participative canadienne</p>
      </footer>
    `;

    return layout;
  }

  init() {
    const container = document.querySelector('#app');
    container.innerHTML = '';
    container.appendChild(this.render());

    // Monter le header
    this.header.mount('#header-container');
  }

  setContent(html) {
    const contentDiv = document.querySelector('#page-content');
    if (contentDiv) {
      contentDiv.innerHTML = html;
    }
  }
}

module.exports = new AppLayout();
