import packageJson from "../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Alayon Store",
  version: packageJson.version,
  copyright: `© ${currentYear}, Alayon Store.`,
  meta: {
    title: "Alayon Store - Modern Marketplace",
    description:
      "Alayon Store is a modern, multi tenant marketplace platform.",
  },
};
