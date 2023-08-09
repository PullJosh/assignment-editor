"use client";

import Link from "next/link";
import AssignmentEditor, {
  AssignmentEditorRef,
  Content,
  Item,
} from "./AssignmentEditor";
import { useRef, useState } from "react";

import { useMutation, useQuery } from "@apollo/client";
import { graphql as gql } from "../../graphql/__generated__";
import { useRouter } from "next/navigation";
import { AccountMenu } from "../AccountMenu";

import { v4 as uuidv4 } from "uuid";

const CreateAssignmentMutation = gql(`
  mutation CreateAssignment($title: String!, $content: String!) {
    createDocument(title: $title, content: $content) {
      id
    }
  }
`);

const MeQuery = gql(`
  query Me {
    me {
      id
      name
      email
    }
  }
`);

const defaultContent: () => Content = () => {
  let tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const friendlyDateFormat = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  });

  const result: Content = {
    items: [
      {
        type: "documentHeader",
        id: uuidv4(),
        title: "Homework 1.1",
        subtitle: `Due ${friendlyDateFormat.format(tomorrow)} before class`,
        blanks: [{ label: "Name:", style: "line" }],
        layout: "left",
      },
      {
        type: "question",
        id: uuidv4(),
        content: "What is 1 + 1?",
        answer: {
          type: "freeResponse",
          answer: "2",
        },
        starred: false,
        workHeight: "100",
      },
    ],
  };

  return result;
};

export default function NewAssignmentPage() {
  const ref = useRef<AssignmentEditorRef>(null);

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<Content>(defaultContent);

  const router = useRouter();
  const [createAssignment, { loading }] = useMutation(
    CreateAssignmentMutation,
    {
      onCompleted: (data) => {
        router.push(`/app/assignment/${data.createDocument.id}`);
      },
    }
  );

  const { data } = useQuery(MeQuery);

  return (
    <div className="w-screen h-screen overflow-hidden grid grid-rows-[auto,1fr]">
      <div className="col-span-full bg-amber-300 flex h-14">
        <div className="px-4 flex">
          <Link href="/" className="font-bold text-lg flex items-center">
            Assignment Editor
          </Link>
        </div>
        <div className="flex space-x-2 px-4 self-center border-l border-amber-500 mr-auto">
          <input
            type="text"
            className="px-2 py-1 rounded border border-gray-400"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled Assignment"
          />
          <button
            className="px-4 py-1 bg-amber-600 text-white rounded enabled:hover:bg-amber-700 enabled:active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              // Before saving, try to set an automatic title if it's blank
              const autoTitle = content.items.find(
                (item): item is Item & { type: "documentHeader" } =>
                  item.type === "documentHeader"
              )?.title;

              createAssignment({
                variables: {
                  title: (title || autoTitle) ?? "",
                  content: JSON.stringify(content),
                },
              });
            }}
            disabled={loading || !data?.me}
          >
            {loading ? "Saving..." : "Save"}
          </button>
          {data?.me && (
            <button
              className="px-4 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 active:bg-amber-800"
              onClick={() => ref.current?.load()}
            >
              Open
            </button>
          )}
          <button
            className="px-4 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 active:bg-amber-800"
            onClick={() => ref.current?.print()}
          >
            Print
          </button>
        </div>
        <div className="px-2 flex items-center">
          <AccountMenu />
        </div>
      </div>
      <AssignmentEditor ref={ref} content={content} setContent={setContent} />
    </div>
  );
}
