// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import './style.js';
export { Support as _cy } from './support';
// Guarde as funções originais
const originalDescribe = global.describe;

// Crie novas funções que convertem a descrição para maiúsculas
global.describe = (description, ...args) =>
  originalDescribe(description.toUpperCase(), ...args);

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.config('defaultCommandTimeout', 300000000);
if (
  Cypress.env('auth') == undefined ||
  Cypress.env('access_token') === undefined
) {
  Cypress.env('auth', null);
  Cypress.env('access_token', null);
}
