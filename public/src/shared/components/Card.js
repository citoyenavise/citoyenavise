/**
 * Card Component
 */

class Card {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.footer = options.footer || '';
    this.className = options.className || '';
  }

  render() {
    return `
      <div class="card ${this.className}">
        ${this.title ? `<div class="card-header"><h3>${this.title}</h3></div>` : ''}
        <div class="card-body">
          ${this.content}
        </div>
        ${this.footer ? `<div class="card-footer">${this.footer}</div>` : ''}
      </div>
    `;
  }

  static render(options) {
    return new Card(options).render();
  }
}

module.exports = Card;
