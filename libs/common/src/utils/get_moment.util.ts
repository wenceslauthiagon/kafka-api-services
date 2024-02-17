import * as moment from 'moment';

/**
 * Brasilia time in relation to Greenwich Mean Time (GMT)
 */
const TIME_ZONE = -3;
const TIME_ZONE_STR = '-03';

/**
 * Gets moment with the correct time zone (UTC-3).
 * @param inp Moment input.
 * @param format Moment format.
 * @returns Moment.
 */
export const getMoment = (
  inp?: moment.MomentInput,
  format?: moment.MomentFormatSpecification,
): moment.Moment => {
  if (inp && typeof inp === 'string') {
    // If string doesn't end with letter 'Z' or '3:00', it means the inp should use this TIME_ZONE,
    // if it ends with 'Z' or '3:00', should apply TIME_ZONE offset.
    // Ex.: inp = '2024-01-05T19:01:14.000' => Moment<2024-01-05T19:01:14-03:00>;
    //      inp = '2024-01-05T19:01:14.000Z' => Moment<2024-01-05T16:01:14-03:00>;
    //      inp = '2024-01-05T16:01:14-03:00' => Moment<2024-01-05T16:01:14-03:00>;
    const keepLocalTime =
      !inp.endsWith('Z') && !inp.endsWith(`${TIME_ZONE_STR}:00`);
    return moment(inp, format).utcOffset(TIME_ZONE, keepLocalTime);
  }

  return inp
    ? moment(inp, format).utcOffset(TIME_ZONE)
    : moment().utcOffset(TIME_ZONE);
};
