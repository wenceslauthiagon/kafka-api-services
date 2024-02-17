export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  const body = {
    api_id: config.api_id,
    api_key: config.api_key,
  };
  const result = await $fetch("auth/signin", {
    method: "POST",
    baseURL: config.public.baseURL,
    body,
  }).catch((e) => {
    console.log(e);
  });
  if (result) {
    return { ...result.data };
  }
  return {
    access_token: "",
  };
});
