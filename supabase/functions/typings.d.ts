// Lightweight shims for the Deno runtime and ESM imports used in Supabase functions
declare namespace Deno {
  const env: {
    get(key: string): string | undefined
  }
  function serve(handler: (req: Request) => Promise<Response> | Response): void
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): unknown
}

declare module 'https://esm.sh/ethers@6' {
  export * from 'ethers'
}

// Minimal extensions for Response
declare class Response {
  constructor(body?: unknown, init?: unknown)
}

export {}
