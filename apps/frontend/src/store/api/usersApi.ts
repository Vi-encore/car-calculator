import type { User, UpdateProfileDto, UpdatePasswordDto } from "@car-calculator/types";
import { apiSlice } from "./apiSlice";
import { logout, setCredentials } from "../slices/authSlice";

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<User, UpdateProfileDto>({
      query: (body) => ({
        url: "/users/me",
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data }));
        } catch (e) {
          console.error(e);
        }
      },
      invalidatesTags: ["User"],
    }),
    updatePassword: builder.mutation<void, UpdatePasswordDto>({
      query: (body) => ({
        url: "/users/me/password",
        method: "PATCH",
        body,
      }),
    }),
    deleteUser: builder.mutation<void, void>({
      query: () => ({
        url: "/users/me",
        method: "DELETE",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logout());
          dispatch(apiSlice.util.resetApiState());
        } catch (e) {
          console.error(e);
        }
      },
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useDeleteUserMutation,
} = usersApi;
