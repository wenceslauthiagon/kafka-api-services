/**
 * Build query string filter with parameters.
 *
 * @param payload Object with parameters and its values.
 * @returns The query string.
 */
export const buildQueryStringFilter = (path: string, payload = {}) => {
  payload = encodeQueryData(payload);

  if (payload !== '') {
    path = `${path}?${payload}`;
  }

  return path;
};

function encodeQueryData(data = {}) {
  const ret = [];

  for (const d in data) ret.push(`filter[${d}]=${encodeURIComponent(data[d])}`);
  return ret.join('&');
}
