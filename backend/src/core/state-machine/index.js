// Machine à États - Phase 1
// Gestion centralisée des transitions d'état

const StateMachine = require('./StateMachine');
const State = require('./State');
const Transition = require('./Transition');
const Guard = require('./Guard');
const SideEffect = require('./SideEffect');

module.exports = {
  StateMachine,
  State,
  Transition,
  Guard,
  SideEffect,
};
