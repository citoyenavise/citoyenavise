/**
 * Popular System Module — Version officielle
 * Gestion des contenus populaires avec invalidation cache événementielle
 */

const routes = require('./routes');
const { PopularService } = require('./service');
const EventBus = require('../../core/eventBus');

module.exports = {
  name: 'popular',
  routes: (app) => {
    app.use('/popular', routes);
  },
  init: () => {
    EventBus.on('like.added', PopularService.invalidateAll);
    EventBus.on('post.created', PopularService.invalidateAll);
  },
};
