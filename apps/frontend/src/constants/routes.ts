
export const routes = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  calculator: "/calculator",
  history: "/history",
  historyDetail: (id: string) => `/history/${id}`,
  historyDetailPattern: "/history/:id",
  profile: "/profile",
  authCallback: "/auth/callback",
  default: "/",
} as const;
