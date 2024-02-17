// create an $api function that only wraps $fetch from nuxt 3 with a base url

export const $api = (path: string) => {
  return $fetch(`https://api.example.com/${path}`);
};
