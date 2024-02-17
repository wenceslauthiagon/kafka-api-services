'use strict';
const moment = require('moment/moment');
const TIMEZONE_OFFSET = -3;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const currentDate = moment().utcOffset(TIMEZONE_OFFSET);
    const fiveYearsAgo = currentDate
      .clone()
      .subtract(5, 'years')
      .utcOffset(TIMEZONE_OFFSET);

    const startYear = fiveYearsAgo.year();
    const startMonth = fiveYearsAgo.month();
    const endYear = currentDate.year();
    const endMonth = currentDate.month();

    const operationIndexes = await queryInterface.showIndex('Operations');

    for (let year = startYear; year <= endYear; year++) {
      const actualMonth = year === startYear ? startMonth : 0;
      const lastMonth = year === endYear ? endMonth : 11;

      for (let month = actualMonth; month <= lastMonth; month++) {
        const initialDate = moment({ year, month }).startOf('month').toDate();
        const lastDate = moment({ year, month }).endOf('month').toDate();

        const indexName = `Operations_created_at_index_${year}_${month + 1}`;

        const indexExists = operationIndexes.some(
          (index) => index.name === indexName,
        );

        if (indexExists) continue;

        await queryInterface.addIndex('Operations', ['created_at'], {
          where: {
            created_at: {
              [Sequelize.Op.between]: [initialDate, lastDate],
            },
          },
          name: indexName,
        });
      }
    }
  },

  async down(queryInterface) {
    const indexBaseName = 'Operations_created_at_index';

    const allOperationIndexes = await queryInterface.showIndex('Operations');
    const indexes = allOperationIndexes.filter((item) =>
      item.name.includes(indexBaseName),
    );

    for (const index of indexes) {
      await queryInterface.removeIndex('Operations', index.name);
    }
  },
};
