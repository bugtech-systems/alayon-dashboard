// hooks/useN8nQuery.ts

import { useQuery } from "@tanstack/react-query"

const BASE_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE ||
  "http://192.168.1.100:5678"

type QueryOptions = {
  endpoint?: string
  method?: "GET" | "POST"
  params?: Record<string, any>
  body?: Record<string, any>
  headers?: Record<string, string>

  // backward compatibility
  widget?: any
  filters?: Record<string, any>

  enabled?: boolean
  refetchInterval?: number
}

function buildURL(endpoint: string, params?: Record<string, any>) {
  const url = new URL(endpoint, BASE_URL)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }
  console.log(url.toString(), 'URL STR')
  return url.toString()
}

async function fetcher({
  endpoint,
  method = "GET",
  params,
  body,
  headers,
}: QueryOptions) {
  if (!endpoint) throw new Error("Missing endpoint")

  const url =
    method === "GET"
      ? buildURL(endpoint, params)
      : new URL(endpoint, BASE_URL).toString()

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: method === "POST" ? JSON.stringify(body || params) : undefined,
  })

  if (!res.ok) {
    throw new Error(`n8n error: ${res.status}`)
  }

  const json = await res.json()
  return json?.data ?? json
}

export function useN8nQuery<T = any>(options: QueryOptions) {
  const {
    endpoint,
    method,
    params,
    body,
    headers,
    widget,
    filters,
    enabled,
    refetchInterval,
  } = options

  // 🔁 backward compatibility layer
  let finalEndpoint = endpoint
  let finalParams = params as any 

  if (widget) {
    finalEndpoint = widget.webhook.url as any

    finalParams = {} 

    Object.entries(widget.webhook.queryMap || {}).forEach(
      ([filterKey, queryKey]: any) => {
        const value = filters?.[filterKey]
        if (value != null) {
          finalParams[queryKey] = value
        }
      }
    )
  }

  return useQuery<T>({
    queryKey: [finalEndpoint, finalParams],

    queryFn: () =>
      fetcher({
        endpoint: finalEndpoint,
        method,
        params: finalParams,
        body,
        headers,
      }),

    enabled: enabled !== false && !!finalEndpoint,

    refetchInterval,

    staleTime: 60 * 1000
  })
}