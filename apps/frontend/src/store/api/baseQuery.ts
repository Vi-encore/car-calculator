import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { RootState } from "../store";
import { logout, setCredentials } from "../slices/authSlice";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken;
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const isRefreshRequest =
      typeof args === "object" && args.url === "/auth/refresh";
    if (!isRefreshRequest) {
      const refreshResult = await rawBaseQuery(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions,
      );
      if (refreshResult.data) {
        const data = refreshResult.data as { accessToken: string };
        api.dispatch(setCredentials({ accessToken: data.accessToken }));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    }
  }
  return result;
};
