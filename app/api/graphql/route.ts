import { createYoga } from "graphql-yoga";
import { schema } from "../../../graphql/schema";

import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma";
import { PrismaClient } from "@prisma/client";

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
  context: async ({ request, params }) => {
    let user = null;

    const authorization = request.headers.get("authorization"); // jwt
    if (authorization) {
      const token = authorization.replace("Bearer ", "");
      const { userId } = jwt.verify(token, process.env.APP_SECRET!) as {
        userId: string;
      };

      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    return { request, user };
  },
  graphiql: async () => ({
    headers: JSON.stringify(
      {
        Authorization: `Bearer ${jwt.sign(
          {
            userId: await prisma.user
              .findUnique({ where: { email: "JoshPullen27@gmail.com" } })
              .then((user) => user!.id),
          },
          process.env.APP_SECRET!
        )}`,
      },
      null,
      2
    ),
  }),
});

export { handleRequest as GET, handleRequest as POST };
