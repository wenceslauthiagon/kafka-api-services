module.exports = {
  up: async (queryInterface) => {
    return queryInterface.addIndex('Providers', ['name'], {
      unique: true,
      name: 'Providers_name_key',
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeIndex('Providers', 'Providers_name_key');
  },
};
