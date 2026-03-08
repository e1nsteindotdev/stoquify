import { authedQuery } from "./customFunctions";

export const availableResources = [
  { key: "*", label: "TOUT", description: "Toutes les ressources" },
  { key: "products", label: "Produits", description: "Gérer les produits" },
  {
    key: "sales",
    label: "Commandes",
    description: "Voir et gérer les commandes",
  },
  { key: "customers", label: "Clients", description: "Voir les clients" },
  { key: "employees", label: "Employés", description: "Gérer les employés" },
  {
    key: "analytics",
    label: "Analytiques",
    description: "Voir les statistiques",
  },
  {
    key: "settings",
    label: "Paramètres",
    description: "Modifier les paramètres",
  },
  {
    key: "categories",
    label: "Catégories",
    description: "Gérer les catégories",
  },
  {
    key: "collections",
    label: "Collections",
    description: "Gérer les collections",
  },
];

export const list = authedQuery({
  resource: "permissions",
  action: "read",
  args: {},
  handler: async () => {
    return availableResources;
  },
});
