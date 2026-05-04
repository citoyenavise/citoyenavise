/**
 * Modal Component
 */

class Modal {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.actions = options.actions || [];
    this.onClose = options.onClose || null;
  }

  render() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>${this.title}</h2>
          <button class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          ${this.content}
        </div>
        <div class="modal-footer">
          ${this.actions.map(action =>
            `<button class="btn btn-${action.type}" data-action="${action.id}">${action.label}</button>`
          ).join('')}
        </div>
      </div>
    `;

    return modal;
  }

  show() {
    const element = this.render();
    document.body.appendChild(element);

    // Events
    element.querySelector('.btn-close').addEventListener('click', () => this.close());
    element.querySelector('.modal-overlay').addEventListener('click', () => this.close());

    this.actions.forEach(action => {
      element.querySelector(`[data-action="${action.id}"]`)?.addEventListener('click', action.callback);
    });

    this.element = element;
  }

  close() {
    if (this.element) {
      this.element.remove();
      if (this.onClose) this.onClose();
    }
  }
}

module.exports = Modal;
