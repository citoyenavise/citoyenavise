/**
 * Module Exports
 * Phase 4 — Tous les modules UI sont exportés ici
 */

module.exports = {
  // Level 1 - Standalone
  auth: require('./auth'),
  education: require('./education'),
  analytics: require('./analytics'),

  // Level 2 - Domain
  users: require('./users'),
  profiles: require('./profiles'),
  posts: require('./posts'),
  ideas: require('./ideas'),
  map: require('./map'),
  initiatives: require('./initiatives'),
  admin: require('./admin'),
  reports: require('./reports'),

  // Level 3 - Derived
  likes: require('./likes'),
  comments: require('./comments'),
  popular_system: require('./popular_system'),
  search: require('./search'),
};
