// TODO: rename file routes.constants ot just routes (it is in a const folder)

export const routes = {
  login: "/login",
  register: "/register",
  calculator: "/calculator",
  history: "/history",
  historyDetail: (id: string) => `/history/${id}`,
  profile: "/profile",
  default: "/",
} as const;
