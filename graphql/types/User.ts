import { IDFilter, builder } from "../builder";
import { prisma } from "../../lib/prisma";
import { DocumentFilter, DocumentOrderBy } from "./Document";

builder.prismaObject("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email", { nullable: true }),
    name: t.exposeString("name", { nullable: true }),
    role: t.expose("role", { type: Role }),
    documents: t.relation("documents", {
      args: {
        where: t.arg({ type: DocumentFilter, required: false }),
        orderBy: t.arg({ type: DocumentOrderBy, required: false }),
      },
      resolve: (query, parent, args) =>
        prisma.document.findMany({
          ...query,
          where: { ...args.where, userId: parent.id },
          orderBy: args.orderBy ?? undefined,
        }),
    }),
  }),
});

builder.queryFields((t) => ({
  me: t.prismaField({
    type: "User",
    nullable: true,
    resolve: async (_root, _parent, _args, ctx) => {
      return ctx.user;
    },
  }),
  users: t.prismaField({
    type: ["User"],
    authScopes: {
      admin: true,
    },
    resolve: (query, _parent, _args, _ctx, _info) =>
      prisma.user.findMany({ ...query }),
  }),
}));

const Role = builder.enumType("Role", {
  values: ["USER", "ADMIN"] as const,
});

export const UserFilter = builder.prismaWhere("User", {
  fields: {
    id: IDFilter,
  },
});
