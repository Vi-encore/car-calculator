import { useState } from "react";
import { useGetHistoryQuery } from "../../../store/api/calculationsApi";

const LIMIT = 10;

export function useHistory() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError } = useGetHistoryQuery({
    page,
    limit: LIMIT,
  });

  function goToPage(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    calculations: data?.data ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    page,
    isLoading,
    isFetching,
    isError,
    goToPage,
  };
}
