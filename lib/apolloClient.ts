import { HttpLink } from "@apollo/client";

import {
  NextSSRInMemoryCache,
  NextSSRApolloClient,
} from "@apollo/experimental-nextjs-app-support/ssr";

import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";

const uriBase =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL!}`
    : "http://localhost:3000";

export const { getClient } = registerApolloClient(() => {
  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link: new HttpLink({
      uri: `${uriBase}/api/graphql`,
    }),
  });
});
