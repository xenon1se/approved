import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface UseApiOptions<T, R> {
  endpoint: string;
  method?: string;
  onSuccess?: (data: R) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = unknown, R = unknown>({
  endpoint,
  method = "POST",
  onSuccess,
  onError,
}: UseApiOptions<T, R>) {
  const [data, setData] = useState<R | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const execute = async (payload?: T): Promise<R | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest(method, endpoint, payload);
      const responseData = await response.json();
      
      setData(responseData);
      if (onSuccess) {
        onSuccess(responseData);
      }
      return responseData;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      if (onError) {
        onError(errorObj);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    error,
    isLoading,
    execute,
  };
}
