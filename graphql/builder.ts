import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import PrismaUtils from "@pothos/plugin-prisma-utils";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import type PrismaTypes from "@pothos/plugin-prisma/generated";

import { DateTimeResolver, JSONResolver } from "graphql-scalars";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface GraphQLContext {
  request: Request;
  user: User | null;
}

export interface GraphQLAuthScopes {
  loggedOut: boolean;
  loggedIn: boolean;
  admin: boolean;
}

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  AuthScopes: GraphQLAuthScopes;
  PrismaTypes: PrismaTypes;
  Scalars: {
    JSON: {
      Input: unknown;
      Output: unknown;
    };
    DateTime: {
      Input: Date;
      Output: Date;
    };
  };
}>({
  plugins: [ScopeAuthPlugin, PrismaPlugin, PrismaUtils],
  authScopes: async (ctx) => ({
    loggedIn: !!ctx.user,
    loggedOut: !ctx.user,
    admin: !!ctx.user && ctx.user.role === "ADMIN",
  }),
  prisma: {
    client: prisma,
  },
});

builder.addScalarType("JSON", JSONResolver, {});
builder.addScalarType("DateTime", DateTimeResolver, {});

builder.queryType({
  fields: (t) => ({}),
});

builder.mutationType({
  fields: (t) => ({
    login: t.field({
      type: "String",
      authScopes: {
        loggedOut: true,
      },
      args: {
        email: t.arg.string({ required: true }),
        password: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx) => {
        const user = await prisma.user.findUnique({
          where: { email: args.email },
        });

        if (!user) {
          throw new Error(`No user with email ${args.email} found`);
        }

        const valid = await bcrypt.compare(args.password, user.password);

        if (!valid) {
          throw new Error("Invalid password");
        }

        return jwt.sign({ userId: user.id }, process.env.APP_SECRET!);
      },
    }),
    register: t.field({
      type: "String",
      authScopes: {
        loggedOut: true,
      },
      args: {
        name: t.arg.string({ required: true }),
        email: t.arg.string({ required: true }),
        password: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx) => {
        const hashedPassword = await bcrypt.hash(args.password, 10);
        const user = await prisma.user.create({
          data: {
            name: args.name,
            email: args.email,
            password: hashedPassword,
          },
        });

        return jwt.sign({ userId: user.id }, process.env.APP_SECRET!);
      },
    }),
  }),
});

export const IDFilter = builder.prismaFilter("String", {
  name: "IDFilter",
  ops: ["equals", "not"],
});

export const StringFilter = builder.prismaFilter("String", {
  name: "StringFilter",
  ops: ["contains", "equals", "startsWith", "not"],
});
