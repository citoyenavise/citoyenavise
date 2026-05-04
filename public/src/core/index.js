/**
 * Core - Services centralisés
 */

module.exports = {
  api: require('./api/client'),
  router: require('./router'),
  store: require('./store'),
  helpers: require('./utils/helpers'),
  formatters: require('./utils/formatters'),
  validators: require('./utils/validators'),
  constants: require('./utils/constants'),
};
