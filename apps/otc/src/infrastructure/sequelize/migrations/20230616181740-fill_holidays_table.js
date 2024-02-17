const moment = require('moment/moment');
const { v4: uuidV4 } = require('uuid');
const TIMEZONE_OFFSET = -3;

const holidays = [
  {
    start_date: moment('2023-01-01')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-01-01')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Confraternização Universal',
    level: 'nacional',
  },
  {
    start_date: moment('2023-02-02')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-02-02 12:59', 'YYYY-MM-DD HH:mm')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Quarta-feira de Cinzas',
    level: 'nacional',
  },
  {
    start_date: moment('2023-04-07')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-04-07')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Sexta-Feira da Paixão',
    level: 'nacional',
  },
  {
    start_date: moment('2023-04-21')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-04-21')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Dia de Tiradentes',
    level: 'nacional',
  },
  {
    start_date: moment('2023-05-01')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-05-01')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Dia do Trabalhador',
    level: 'nacional',
  },
  {
    start_date: moment('2023-06-08')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-06-08')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Corpus Christi',
    level: 'nacional',
  },
  {
    start_date: moment('2023-09-07')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-09-07')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Independência do Brasil',
    level: 'nacional',
  },
  {
    start_date: moment('2023-09-12')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-09-12')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Dia de Nossa Senhora Aparecida',
    level: 'nacional',
  },
  {
    start_date: moment('2023-11-02')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-11-02')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Dia de Finados',
    level: 'nacional',
  },
  {
    start_date: moment('2023-11-15')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-11-15')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Proclamação da República do Brasil',
    level: 'nacional',
  },
  {
    start_date: moment('2023-12-25')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-12-25')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Natal',
    level: 'nacional',
  },
  {
    start_date: moment('2023-01-02')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-01-02')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'New Years Day',
    level: 'eua',
  },
  {
    start_date: moment('2023-01-16')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-01-16')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Martin Luther King Jr',
    level: 'eua',
  },
  {
    start_date: moment('2023-02-20')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-02-20')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Presidents Day',
    level: 'eua',
  },
  {
    start_date: moment('2023-04-14')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-04-14')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Good Friday',
    level: 'eua',
  },
  {
    start_date: moment('2023-05-29')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-05-29')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Memorial Day',
    level: 'eua',
  },
  {
    start_date: moment('2023-07-04')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-07-04')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Independence Day',
    level: 'eua',
  },
  {
    start_date: moment('2023-09-04')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-09-04')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Labor Day',
    level: 'eua',
  },
  {
    start_date: moment('2023-11-23')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-11-23')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Thanksgiving Day',
    level: 'eua',
  },
  {
    start_date: moment('2023-12-25')
      .startOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    end_date: moment('2023-12-25')
      .endOf('day')
      .utcOffset(TIMEZONE_OFFSET)
      .toISOString(),
    name: 'Christmas Day',
    level: 'eua',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const holiday_names = await queryInterface.sequelize.query(
        'SELECT name FROM "holidays" WHERE name IN (:name)',
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { name: holidays.map(({ name }) => name) },
        },
      );

      if (holiday_names.length) return;

      await queryInterface.bulkInsert(
        'holidays',
        holidays.map((item) => ({
          ...item,
          id: uuidV4(),
          type: 'feriado',
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
        'holidays',
        { name: { [Op.in]: holidays.map(({ name }) => name) } },
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
