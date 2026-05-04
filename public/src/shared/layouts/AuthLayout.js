/**
 * Auth Layout
 * Layout pour pages auth (login, register)
 */

class AuthLayout {
  render() {
    const layout = document.createElement('div');
    layout.className = 'auth-layout';
    layout.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1>🍁 Citoyen Avisé</h1>
            <p>Démocratie participative canadienne</p>
          </div>
          <div id="auth-content"></div>
        </div>
      </div>
    `;

    return layout;
  }

  init() {
    const container = document.querySelector('#app');
    container.innerHTML = '';
    container.appendChild(this.render());
  }

  setContent(html) {
    const contentDiv = document.querySelector('#auth-content');
    if (contentDiv) {
      contentDiv.innerHTML = html;
    }
  }
}

module.exports = new AuthLayout();
