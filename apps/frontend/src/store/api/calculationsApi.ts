import type {
  Calculation,
  CalculationWithListings,
  CreateCalculationDto,
} from "@car-calculator/types";
import { apiSlice } from "./apiSlice";

export interface HistoryResponse {
  data: Calculation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HistoryParams {
  page?: number;
  limit?: number;
}

export const calculationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    calculate: builder.mutation<Calculation, CreateCalculationDto>({
      query: (dto) => ({
        url: "/calculations",
        method: "POST",
        body: dto,
      }),
      invalidatesTags: ["Calculation"],
    }),
    getHistory: builder.query<HistoryResponse, HistoryParams>({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/calculations/history",
        params: { page, limit },
      }),
      providesTags: ["Calculation"],
    }),
    getCalculationById: builder.query<CalculationWithListings, string>({
      query: (id) => `/calculations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Calculation", id }],
    }),
  }),
});

export const {
  useCalculateMutation,
  useGetHistoryQuery,
  useGetCalculationByIdQuery,
} = calculationsApi;
