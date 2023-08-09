"use client";

import { useSuspenseQuery } from "@apollo/experimental-nextjs-app-support/ssr";
import { useApolloClient, useMutation } from "@apollo/client";
import { graphql as gql } from "../graphql/__generated__";

import { useCallback } from "react";

const MeQuery = gql(`
  query Me {
    me {
      id
      name
      email
    }
  }
`);

const LoginMutation = gql(`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`);

const RegisterMutation = gql(`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password)
  }
`);

export function AccountMenu() {
  const { data } = useSuspenseQuery(MeQuery);

  const me = data?.me;

  const client = useApolloClient();

  const [login] = useMutation(LoginMutation, {
    // Do not refetch until AFTER localstorage has been updated
    // refetchQueries: [{ query: MeQuery }],
    onCompleted: (data) => {
      const token: string = data.login;
      localStorage.setItem("token", token);
      client.refetchQueries({ include: [MeQuery] });
    },
  });

  const [register] = useMutation(RegisterMutation, {
    // Do not refetch until AFTER localstorage has been updated
    // refetchQueries: [{ query: MeQuery }],
    onCompleted: (data) => {
      const token: string = data.register;
      localStorage.setItem("token", token);
      client.refetchQueries({ include: [MeQuery] });
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    client.refetchQueries({ include: [MeQuery] });
  }, [client]);

  if (!me) {
    return (
      <div className="flex items-center space-x-2">
        <button
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 active:bg-amber-800"
          onClick={() => {
            const email = prompt("Email?");
            if (!email) return;

            const password = prompt("Password?");
            if (!password) return;

            login({
              variables: { email, password },
              onError: (error) => {
                alert(error.message);
              },
            });
          }}
        >
          Log in
        </button>
        <button
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 active:bg-amber-800"
          onClick={() => {
            const name = prompt("Name?");
            if (!name) return;

            const email = prompt("Email?");
            if (!email) return;

            const password = prompt("Password?");
            if (!password) return;

            register({
              variables: { name, email, password },
              onError: (error) => {
                alert(error.message);
              },
            });
          }}
        >
          Register
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right leading-none">
        <div className="text-amber-800 font-bold">{me.name}</div>
        <div className="text-amber-600 text-sm">{me.email}</div>
      </div>
      <button
        className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 active:bg-amber-800"
        onClick={() => {
          logout();
        }}
      >
        Log out
      </button>
    </div>
  );
}
