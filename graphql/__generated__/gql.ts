/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  query Me {\n    me {\n      id\n      name\n      email\n    }\n  }\n": types.MeDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password)\n  }\n": types.LoginDocument,
    "\n  mutation Register($name: String!, $email: String!, $password: String!) {\n    register(name: $name, email: $email, password: $password)\n  }\n": types.RegisterDocument,
    "\n  query MyDocuments {\n    me {\n      documents(orderBy: { updatedAt: Desc }) {\n        id\n        title\n        createdAt\n        updatedAt\n        content\n        user {\n          name\n        }\n      }\n    }\n  }\n": types.MyDocumentsDocument,
    "\n  query Assignment($id: String!) {\n    document(id: $id) {\n      id\n      title\n      createdAt\n      updatedAt\n      content\n    }\n  }\n": types.AssignmentDocument,
    "\n  mutation UpdateAssignment($id: String!, $title: String!, $content: String!) {\n    updateDocument(id: $id, title: $title, content: $content) {\n      id\n    }\n  }\n": types.UpdateAssignmentDocument,
    "\n  mutation CreateAssignment($title: String!, $content: String!) {\n    createDocument(title: $title, content: $content) {\n      id\n    }\n  }\n": types.CreateAssignmentDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      name\n      email\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      name\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password)\n  }\n"): (typeof documents)["\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Register($name: String!, $email: String!, $password: String!) {\n    register(name: $name, email: $email, password: $password)\n  }\n"): (typeof documents)["\n  mutation Register($name: String!, $email: String!, $password: String!) {\n    register(name: $name, email: $email, password: $password)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyDocuments {\n    me {\n      documents(orderBy: { updatedAt: Desc }) {\n        id\n        title\n        createdAt\n        updatedAt\n        content\n        user {\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query MyDocuments {\n    me {\n      documents(orderBy: { updatedAt: Desc }) {\n        id\n        title\n        createdAt\n        updatedAt\n        content\n        user {\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Assignment($id: String!) {\n    document(id: $id) {\n      id\n      title\n      createdAt\n      updatedAt\n      content\n    }\n  }\n"): (typeof documents)["\n  query Assignment($id: String!) {\n    document(id: $id) {\n      id\n      title\n      createdAt\n      updatedAt\n      content\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAssignment($id: String!, $title: String!, $content: String!) {\n    updateDocument(id: $id, title: $title, content: $content) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAssignment($id: String!, $title: String!, $content: String!) {\n    updateDocument(id: $id, title: $title, content: $content) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateAssignment($title: String!, $content: String!) {\n    createDocument(title: $title, content: $content) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAssignment($title: String!, $content: String!) {\n    createDocument(title: $title, content: $content) {\n      id\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;