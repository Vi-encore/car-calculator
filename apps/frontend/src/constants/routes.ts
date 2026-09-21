
export const routes = {
  login: "/login",
  register: "/register",
  calculator: "/calculator",
  history: "/history",
  historyDetail: (id: string) => `/history/${id}`,
  historyDetailPattern: "/history/:id",
  profile: "/profile",
  default: "/",
} as const;
