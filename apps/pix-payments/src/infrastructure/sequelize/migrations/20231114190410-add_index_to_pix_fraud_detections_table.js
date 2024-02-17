'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('pix_fraud_detections', ['external_id'], {
      name: 'pix_fraud_detections_external_id_key',
      unique: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex(
      'pix_fraud_detections',
      'pix_fraud_detections_external_id_key',
    );
  },
};
