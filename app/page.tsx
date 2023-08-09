"use client";

import Link from "next/link";
import { AccountMenu } from "./AccountMenu";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { FileSelectionList } from "./app/FileSelectionList";
import { useRouter } from "next/navigation";

export default function Page() {
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const router = useRouter();

  return (
    <>
      <div className="bg-amber-300 flex h-14">
        <div className="container max-w-4xl mx-auto px-16 flex">
          <Link href="/" className="font-bold text-lg flex items-center pr-4">
            Assignment Editor
          </Link>
          <div className="flex space-x-2 px-4 self-center border-l border-amber-500 mr-auto">
            <Link
              href="/app"
              className="px-4 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 active:bg-amber-800"
            >
              New
            </Link>
            <button
              className="px-4 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 active:bg-amber-800"
              onClick={() => setLoadModalOpen(true)}
            >
              Open
            </button>
          </div>
          <AccountMenu />
        </div>
      </div>
      <div className="bg-amber-100">
        <div className="container max-w-4xl mx-auto px-16">
          <div className="py-32">
            <h1 className="font-bold text-4xl text-amber-950 mb-2">
              Beautiful assignments.{" "}
              <span className="text-amber-800">Effortlessly.</span>
            </h1>
            <p className="text-xl text-black">
              Don&apos;t waste hours of your week battling with Microsoft Word
              or Google Docs. Instead, create beautiful assignments and quizzes
              in no time with an editor designed specifically for teachers.
            </p>
            <div className="mt-8">
              <Link
                href="/app"
                className="inline-block bg-amber-600 text-white text-2xl px-8 py-4 rounded-lg hover:bg-amber-700 active:bg-amber-800"
              >
                Launch app
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={loadModalOpen}
        onClose={() => {
          setLoadModalOpen(false);
          setSelectedFileId(null);
        }}
        className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <Dialog.Panel className="flex-col bg-white rounded shadow-2xl w-full max-w-md">
          <div className="p-4">
            <Dialog.Title className="font-bold text-2xl">
              Open File
            </Dialog.Title>
            <Dialog.Description></Dialog.Description>
          </div>

          <div className="max-h-[50vh] overflow-y-auto flex-auto">
            <FileSelectionList
              selectedId={selectedFileId}
              onChange={(id) => {
                setSelectedFileId(id);
              }}
            />
          </div>

          <div className="flex justify-end p-4">
            <div className="space-x-2">
              <button
                className="mr-auto bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 active:bg-gray-300"
                onClick={() => {
                  setLoadModalOpen(false);
                  setSelectedFileId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="mr-auto bg-amber-600 px-4 py-2 rounded text-white enabled:hover:bg-amber-700 enabled:active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  router.push(`/app/assignment/${selectedFileId}`);
                }}
                disabled={selectedFileId === null}
              >
                Open
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}
