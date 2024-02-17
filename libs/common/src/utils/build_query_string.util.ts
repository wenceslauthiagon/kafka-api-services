/**
 * Build query string with parameters.
 *
 * @param path The path to transform into query string.
 * @param params Object with parameters and its values.
 * @returns The query string.
 */
export const buildQueryString = (path: string, params = {}) => {
  params = encodeQueryData(params);

  if (params !== '') {
    path = `${path}?${params}`;
  }

  return path;
};

/**
 * Encode data.
 *
 * @param data object.
 * @returns string.
 */
function encodeQueryData(data = {}) {
  const ret = [];

  for (const d in data) {
    //mount object when array
    if (Array.isArray(data[d])) {
      data[d].map((el) =>
        ret.push(encodeURIComponent(d) + '[]=' + encodeURIComponent(el)),
      );
      //mount object when is not  array
    } else {
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    }
  }

  return ret.join('&');
}
