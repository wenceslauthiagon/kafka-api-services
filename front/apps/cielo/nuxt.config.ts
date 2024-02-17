// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  devServer: {
    port: 8080,
  },
  // set runtime config enviroment api base url to localhost:3000/api
  runtimeConfig: {
    ClientID: process.env.CLIENTID || "dba3a8db-fa54-40e0-8bab-7bfb9b6f2e2e",
    ClientSecret:
      process.env.CLIENTSECRET ||
      "D/ilRsfoqHlSUChwAMnlyKdDNd7FMsM7cU/vo02REag=",
    env: "SDB",
    api_id: process.env.API_ID || "b6bf15b4-e00f-4d03-8e2b-7ed8829c8ff6",
    api_key: process.env.API_KEY || "abcd1234",
    public: {
      baseURL: process.env.BASE_URL || "http://localhost:3007/",
      Auth3ds: process.env.AUTH3DS || false,
    },
  },
  app: {
    head: {
      titleTemplate: "%s - checkout",
      title: "cielo",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { hid: "description", name: "description", content: "" },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },
  modules: ["@nuxtjs/eslint-module", "@nuxt/ui"],
});
