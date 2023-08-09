import { IDFilter, StringFilter, builder } from "../builder";
import { prisma } from "../../lib/prisma";
import { UserFilter } from "./User";

builder.prismaObject("Document", {
  fields: (t) => ({
    id: t.exposeID("id"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    title: t.exposeString("title"),
    content: t.field({
      type: "JSON",
      resolve: (parent) => parent.content,
    }),
    user: t.relation("User", {
      resolve: async (query, parent) =>
        (await prisma.user.findUnique({
          where: { id: parent.userId },
        }))!,
    }),
  }),
});

builder.queryFields((t) => ({
  documents: t.prismaField({
    type: ["Document"],
    authScopes: {
      admin: true,
    },
    args: {
      where: t.arg({ type: DocumentFilter, required: false }),
      orderBy: t.arg({ type: DocumentOrderBy, required: false }),
    },
    resolve: (query, parent, args, ctx, info) =>
      prisma.document.findMany({
        ...query,
        where: args.where ?? undefined,
        orderBy: args.orderBy ?? undefined,
      }),
  }),
  document: t.prismaField({
    type: "Document",
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, parent, args, ctx, info) => {
      const doc = await prisma.document.findUnique({
        ...query,
        where: {
          id: args.id,
          userId: ctx.user?.role === "ADMIN" ? undefined : ctx.user?.id,
        },
      });

      if (!doc) {
        throw new Error("Document not found");
      }

      if (ctx.user?.role !== "ADMIN" && doc.userId !== ctx.user?.id) {
        throw new Error("Unauthorized");
      }

      return doc;
    },
  }),
}));

builder.mutationField("createDocument", (t) =>
  t.prismaField({
    type: "Document",
    args: {
      title: t.arg.string({ required: true }),
      content: t.arg.string({ required: true }),
    },
    resolve: (query, _parent, args, ctx, _info) => {
      if (!ctx.user) throw new Error("Unauthorized");

      return prisma.document.create({
        data: {
          title: args.title,
          content: JSON.parse(args.content),
          userId: ctx.user.id,
        },
        ...query,
      });
    },
  })
);

builder.mutationField("updateDocument", (t) =>
  t.prismaField({
    type: "Document",
    args: {
      id: t.arg.string({ required: true }),
      title: t.arg.string({ required: true }),
      content: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, ctx, _info) => {
      if (!ctx.user) throw new Error("Unauthorized");

      const doc = await prisma.document.findUnique({
        where: { id: args.id },
      });

      if (!doc) {
        throw new Error("Document not found");
      }

      if (ctx.user?.role !== "ADMIN" && doc.userId !== ctx.user?.id) {
        throw new Error("Unauthorized");
      }

      return prisma.document.update({
        where: { id: args.id },
        data: {
          title: args.title,
          content: JSON.parse(args.content),
        },
        ...query,
      });
    },
  })
);

export const DocumentFilter = builder.prismaWhere("Document", {
  fields: {
    id: IDFilter,
    title: StringFilter,
    User: UserFilter,
  },
});

export const DocumentOrderBy = builder.prismaOrderBy("Document", {
  fields: {
    title: true,
    createdAt: true,
    updatedAt: true,
  },
});
