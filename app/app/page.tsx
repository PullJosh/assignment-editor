"use client";

import Link from "next/link";
import AssignmentEditor, { AssignmentEditorRef } from "./AssignmentEditor";
import { useRef } from "react";

export default function AssignmentPage() {
  const ref = useRef<AssignmentEditorRef>(null);

  return (
    <div className="w-screen h-screen overflow-hidden grid grid-rows-[auto,1fr]">
      <div className="col-span-full bg-amber-300 flex justify-between h-14">
        <div className="px-4 flex">
          <Link href="/" className="font-bold text-lg flex items-center">
            Assignment Editor
          </Link>
        </div>
        <div className="flex space-x-2 px-4 self-center">
          <button
            className="px-4 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 active:bg-amber-800"
            onClick={() => ref.current?.save()}
          >
            Save
          </button>
          <button
            className="px-4 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 active:bg-amber-800"
            onClick={() => ref.current?.load()}
          >
            Load
          </button>
          <button
            className="px-4 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 active:bg-amber-800"
            onClick={() => ref.current?.print()}
          >
            Print
          </button>
        </div>
      </div>
      <AssignmentEditor ref={ref} />
    </div>
  );
}
