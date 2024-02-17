'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex(
      'jdpi_notify_credit_validations',
      ['end_to_end_id'],
      {
        name: 'jdpi_notify_credit_validations_end_to_end_id_key',
      },
    );

    await queryInterface.addIndex(
      'jdpi_notify_credit_validations',
      ['devolution_end_to_end_id'],
      {
        name: 'jdpi_notify_credit_validations_devolution_end_to_end_id_key',
      },
    );
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex(
      'jdpi_notify_credit_validations',
      'jdpi_notify_credit_validations_end_to_end_id_key',
    );

    await queryInterface.removeIndex(
      'jdpi_notify_credit_validations',
      'jdpi_notify_credit_validations_devolution_end_to_end_id_key',
    );
  },
};
