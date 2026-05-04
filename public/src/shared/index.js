/**
 * Shared - Code partagé (composants, layouts)
 */

module.exports = {
  components: {
    Header: require('./components/Header'),
    Modal: require('./components/Modal'),
    Toast: require('./components/Toast'),
    Card: require('./components/Card'),
  },
  layouts: {
    AppLayout: require('./layouts/AppLayout'),
    AuthLayout: require('./layouts/AuthLayout'),
  },
};
