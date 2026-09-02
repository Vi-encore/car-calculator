import type {
  LoginDto,
  LoginResponse,
  RegisterDto,
  User,
} from "@car-calculator/types";
import { apiSlice } from "./apiSlice";
import { logout, setCredentials } from "../slices/authSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginDto>({
      query: (credentials: LoginDto) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (e) {
          console.error(e);
        }
      },
      invalidatesTags: ["User"],
    }),
    register: builder.mutation<LoginResponse, RegisterDto>({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch (e) {
          console.error(e);
        }
      },
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (e) {
          console.error(e);
        } finally {
          dispatch(logout());
          dispatch(apiSlice.util.resetApiState());
        }
      },
      invalidatesTags: ["User", "Calculation"],
    }),
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      providesTags: ["User"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data }));
        } catch (e) {
          console.error(e);
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;
