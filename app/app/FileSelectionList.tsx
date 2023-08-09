import { graphql as gql } from "../../graphql/__generated__";
import { useQuery } from "@apollo/client";
import classNames from "classnames";

const MyDocumentsQuery = gql(`
  query MyDocuments {
    me {
      documents(orderBy: { updatedAt: Desc }) {
        id
        title
        createdAt
        updatedAt
        content
        user {
          name
        }
      }
    }
  }
`);

interface FileSelectionListProps {
  // onSelectFile: (content: string) => void;
  selectedId: string | null;
  onChange: (fileId: string | null) => void;
}

export function FileSelectionList({
  selectedId,
  onChange,
}: FileSelectionListProps) {
  const { data, loading } = useQuery(MyDocumentsQuery);

  const me = data?.me;

  if (loading || !me) {
    return <div className="border-y px-4 py-4 italic">Loading...</div>;
  }

  return (
    <div>
      <ul className="-space-y-px">
        {me.documents.length === 0 && (
          <div className="border-y px-4 py-2 italic text-gray-600">
            You do not have any assignments.
          </div>
        )}
        {me.documents.map((document) => (
          <li key={document.id} className="flex flex-col">
            <button
              className={classNames(
                "flex flex-col items-stretch px-4 py-1 border-y",
                {
                  "bg-white hover:bg-gray-100 active:bg-gray-200":
                    selectedId !== document.id,
                  "bg-amber-200 text-amber-950 border-amber-300 z-10":
                    selectedId === document.id,
                }
              )}
              onClick={() => {
                if (selectedId === document.id) {
                  onChange(null);
                } else {
                  onChange(document.id);
                }
                // onSelectFile(document.content);
              }}
            >
              <div className="flex justify-between">
                <span className="font-semibold">
                  {document.title || "Untitled Assignment"}
                </span>
                <span
                  className={classNames("text-sm", {
                    "text-gray-600": selectedId !== document.id,
                    "text-amber-800": selectedId === document.id,
                  })}
                >
                  {document.user.name} &bull;{" "}
                  {formatBriefDate(new Date(document.updatedAt))}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const briefDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const briefDateWithYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatBriefDate(date: Date) {
  if (date.getFullYear() === new Date().getFullYear()) {
    return briefDate.format(date);
  }

  return briefDateWithYear.format(date);
}
