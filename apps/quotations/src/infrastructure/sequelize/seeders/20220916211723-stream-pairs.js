'use strict';

const pairs = [
  {
    id: 'fa7a628b-40ee-4010-bfa3-f3d26d951710',
    base_currency_id: 2,
    quote_currency_id: 3,
    gateway_name: 'FTX',
  },
  {
    id: '0307cb1d-a5b6-4dd3-bf86-fef77fa664c5',
    base_currency_id: 2,
    quote_currency_id: 1,
    gateway_name: 'MERCADO_BITCOIN',
  },
  {
    id: 'e0f07481-b858-47c3-a6e1-79d50264518a',
    base_currency_id: 2,
    quote_currency_id: 7,
    gateway_name: 'FTX',
  },
  {
    id: '995784ae-77d7-4357-aa42-92f856fbf233',
    base_currency_id: 2,
    quote_currency_id: 3,
    gateway_name: 'B2C2',
  },
  {
    id: 'e3abd872-f433-439c-bc43-610838af3b9e',
    base_currency_id: 3,
    quote_currency_id: 1,
    gateway_name: 'APILAYER',
  },
  {
    id: '5332be2f-d74f-4187-a6ff-d74ce9e4c26a',
    base_currency_id: 5,
    quote_currency_id: 3,
    gateway_name: 'B2C2',
  },
  {
    id: '779f91c2-5586-46d2-a9b1-58bf42f6f302',
    base_currency_id: 6,
    quote_currency_id: 3,
    gateway_name: 'B2C2',
  },
  {
    id: 'dd905968-1ec4-4919-a050-7e1614b08c15',
    base_currency_id: 5,
    quote_currency_id: 1,
    gateway_name: 'B2C2|APILAYER',
    composed_by_ids:
      '5332be2f-d74f-4187-a6ff-d74ce9e4c26a,e3abd872-f433-439c-bc43-610838af3b9e',
  },
  {
    id: '81f6a090-b8bf-4cd6-a079-eceb6455c7e2',
    base_currency_id: 6,
    quote_currency_id: 1,
    gateway_name: 'B2C2|APILAYER',
    composed_by_ids:
      '779f91c2-5586-46d2-a9b1-58bf42f6f302,e3abd872-f433-439c-bc43-610838af3b9e',
  },
  {
    id: '54f9f6e4-5e62-43ff-b1b5-27f631a6147e',
    base_currency_id: 2,
    quote_currency_id: 1,
    gateway_name: 'B2C2|APILAYER',
    composed_by_ids:
      '995784ae-77d7-4357-aa42-92f856fbf233,e3abd872-f433-439c-bc43-610838af3b9e',
  },
  {
    id: 'ed1cf750-1d29-429e-9b50-45953e7bf218',
    base_currency_id: 2,
    quote_currency_id: 1,
    gateway_name: 'FTX|APILAYER',
    composed_by_ids:
      'fa7a628b-40ee-4010-bfa3-f3d26d951710,e3abd872-f433-439c-bc43-610838af3b9e',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const stream_ids = await queryInterface.sequelize.query(
        `SELECT id FROM "stream_pairs" WHERE id IN (:id)`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { id: pairs.map(({ id }) => id) },
        },
      );

      if (stream_ids.length) return;

      await queryInterface.bulkInsert(
        'stream_pairs',
        pairs.map((item) => ({
          ...item,
          composed_by_ids: item.composed_by_ids || null,
          priority: 0,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const Op = Sequelize.Op;

    try {
      await queryInterface.bulkDelete(
        'stream_pairs',
        { id: { [Op.in]: pairs.map(({ id }) => id) } },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
