"use client";

import Link from "next/link";
import AssignmentEditor, {
  AssignmentEditorRef,
  Content,
} from "../../AssignmentEditor";
import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery } from "@apollo/client";
import { graphql as gql } from "../../../../graphql/__generated__";
import { AccountMenu } from "../../../AccountMenu";
import { useRouter } from "next/navigation";

const AssignmentQuery = gql(`
  query Assignment($id: String!) {
    document(id: $id) {
      id
      title
      createdAt
      updatedAt
      content
    }
  }
`);

const UpdateAssignmentMutation = gql(`
  mutation UpdateAssignment($id: String!, $title: String!, $content: String!) {
    updateDocument(id: $id, title: $title, content: $content) {
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

interface AssignmentPageProps {
  params: {
    id: string;
  };
}

export default function AssignmentPage({
  params: { id },
}: AssignmentPageProps) {
  const ref = useRef<AssignmentEditorRef>(null);

  const { data, loading } = useQuery(AssignmentQuery, {
    variables: { id },
  });

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<Content>({ items: [] });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: meData } = useQuery(MeQuery);

  const [updateAssignment, { loading: loadingUpdateAssignment }] = useMutation(
    UpdateAssignmentMutation,
    {
      onCompleted: (data) => {
        setHasUnsavedChanges(false);
      },
    }
  );

  useEffect(() => {
    if (data?.document?.title) {
      setTitle(data.document.title);
      setHasUnsavedChanges(false);
    }
  }, [data?.document?.title]);

  useEffect(() => {
    if (data?.document?.content) {
      setContent(data.document.content);
      setHasUnsavedChanges(false);
    }
  }, [data?.document?.content]);

  // When there are unsaved changes, warn the user before they leave the page.
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // When there are unsaved changes for more than 5 seconds, save the document.
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timeout = setTimeout(() => {
        updateAssignment({
          variables: {
            id,
            title,
            content: JSON.stringify(content),
          },
        });
      }, 5000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [hasUnsavedChanges, title, content, updateAssignment, id]);

  if (loading || !data) {
    return <div className="p-4 italic">Loading...</div>;
  }

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
            onChange={(event) => {
              setTitle(event.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Untitled Assignment"
          />
          <button
            className="px-4 py-1 bg-amber-600 text-white rounded enabled:hover:bg-amber-700 enabled:active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              updateAssignment({
                variables: {
                  id,
                  title,
                  content: JSON.stringify(content),
                },
              });
            }}
            disabled={
              loadingUpdateAssignment || !meData?.me || !hasUnsavedChanges
            }
          >
            {loadingUpdateAssignment ? "Saving..." : "Save"}
          </button>
          {meData?.me && (
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
      <AssignmentEditor
        ref={ref}
        content={content}
        setContent={(...args) => {
          setHasUnsavedChanges(true);
          return setContent(...args);
        }}
      />
    </div>
  );
}
