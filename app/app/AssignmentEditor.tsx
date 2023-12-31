"use client";

import {
  useState,
  useRef,
  forwardRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  Dispatch,
  SetStateAction,
  Fragment,
} from "react";

import { useReactToPrint } from "react-to-print";

import classNames from "classnames";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { Dialog } from "@headlessui/react";

import "katex/dist/katex.min.css";

import {
  DragDropContext,
  Droppable,
  Draggable,
  resetServerContext,
} from "react-beautiful-dnd";
import { FileSelectionList } from "./FileSelectionList";
import { useRouter } from "next/navigation";

import { v4 as uuidv4 } from "uuid";
import type { ReactMarkdownOptions } from "react-markdown/lib/react-markdown";

resetServerContext();

type ItemQuestionAnswer =
  | { type: "freeResponse"; answer: string }
  | { type: "multipleChoice"; choices: string[]; correctChoice: number };

export type Item = { id: string } & (
  | {
      type: "documentHeader";
      title: string;
      subtitle: string;
      blanks: { label: string; style: "line" | "box" }[];
      layout: "left" | "center";
    }
  | {
      type: "question";
      content: string;
      answer: ItemQuestionAnswer;
      workHeight: string;
      starred: boolean;
    }
  | {
      type: "text";
      content: string;
      style: "default" | "box";
    }
);

const defaultItems: {
  [T in Item["type"]]: Omit<Extract<Item, { type: T }>, "id">;
} = {
  documentHeader: {
    type: "documentHeader",
    title: "Homework 1.1",
    subtitle: "Good luck and have fun!",
    blanks: [{ label: "Name:", style: "line" }],
    layout: "left",
  },
  question: {
    type: "question",
    content: "",
    answer: { type: "freeResponse", answer: "" },
    workHeight: "100",
    starred: false,
  },
  text: {
    type: "text",
    content: "",
    style: "default",
  },
};

export interface Content {
  items: Item[];
}

interface AssignmentEditorProps {
  content: Content;
  setContent: Dispatch<SetStateAction<Content>>;
}

export interface AssignmentEditorRef {
  save: () => Promise<void>;
  load: () => Promise<void>;
  print: () => void;
}

const AssignmentEditor = forwardRef<AssignmentEditorRef, AssignmentEditorProps>(
  function AssignmentEditor({ content, setContent }, ref) {
    const items = content.items;
    const setItems = (items: Item[] | ((oldItems: Item[]) => Item[])) => {
      setContent((content) => ({
        ...content,
        items: typeof items === "function" ? items(content.items) : items,
      }));
    };

    const setItem = (index: number, item: Item | ((oldItem: Item) => Item)) => {
      setItems((items) => [
        ...items.slice(0, index),
        typeof item === "function" ? item(items[index]) : item,
        ...items.slice(index + 1),
      ]);
    };

    const addItem = (type: Item["type"], index = items.length) => {
      const newItem: Item = { id: uuidv4(), ...defaultItems[type] };
      setItems([...items.slice(0, index), newItem, ...items.slice(index)]);
    };

    const deleteItem = (index: number) => {
      setItems([...items.slice(0, index), ...items.slice(index + 1)]);
    };

    const printPreview = useRef<HTMLDivElement>(null);
    const print = useReactToPrint({
      content: () => printPreview.current!,
      pageStyle: `
    @page {
      size: auto;
      margin: 0.5in 0.5in 0.5in 0.5in;
    }
    `,
    });

    const previewWrapperRef = useRef<HTMLDivElement>(null);
    const previewContentRef = useRef<HTMLDivElement>(null);

    const [previewScale, setPreviewScale] = useState(1);

    const updatePreview = useCallback(() => {
      setTimeout(() => {
        const wrapperWidth =
          previewWrapperRef.current!.getBoundingClientRect().width;
        let contentWidth =
          previewContentRef.current!.getBoundingClientRect().width;

        // The content is already being affected by the current value of previewScale,
        // so to compute its "natural" width we need to undo the scaling effect:
        contentWidth = contentWidth / previewScale;

        const newScale = wrapperWidth / contentWidth;
        if (Math.abs(newScale - previewScale) > 0.01) {
          setPreviewScale(newScale);
        }
      }, 1);
    }, [previewScale]);

    useEffect(() => {
      updatePreview();

      window.addEventListener("resize", updatePreview);
      return () => {
        window.removeEventListener("resize", updatePreview);
      };
    }, [updatePreview]);

    // Keyboard shortcuts
    useEffect(() => {
      const listener = (event: KeyboardEvent) => {
        console.log("keydown", event.key, event.ctrlKey);

        // Save
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          save();
        }

        // Load
        if (event.key === "o" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          load();
        }

        // Print
        if (event.key === "p" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          print();
        }
      };
      document.addEventListener("keydown", listener);
      return () => {
        document.removeEventListener("keydown", listener);
      };
    });

    const [loadModalOpen, setLoadModalOpen] = useState(false);

    const save = useCallback(async () => {
      const fileContent = JSON.stringify({ items }, null, 2);

      try {
        // @ts-expect-error showSaveFilePicker is not yet in the TS types
        const handle = await showSaveFilePicker({
          types: [
            {
              description: "Quiz Files",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(fileContent);
        await writable.close();
      } catch (error) {}
    }, [items]);

    const load = useCallback(async () => {
      setLoadModalOpen(true);

      // try {
      //   // @ts-expect-error showOpenFilePicker is not yet in the TS types
      //   const [fileHandle] = await showOpenFilePicker({
      //     types: [
      //       {
      //         description: "Quiz Files",
      //         accept: {
      //           "application/json": [".json"],
      //         },
      //       },
      //     ],
      //   });
      //   const file = await fileHandle.getFile();
      //   const fileContent = await file.text();
      //   const values = JSON.parse(fileContent);

      //   setItems(values.items);
      // } catch (error) {}
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        save,
        load,
        print,
      }),
      [print, load, save]
    );

    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

    const router = useRouter();

    const focusItem = useCallback((id: string) => {
      (
        document.querySelector(`#item-${id}-handle`) as HTMLDivElement | null
      )?.focus();
    }, []);

    return (
      <div className="w-full h-full overflow-hidden grid grid-cols-2 grid-rows-1">
        <div className="overflow-auto min-h-full flex flex-col relative">
          <div>
            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) return;

                const reorder = (
                  list: Item[],
                  startIndex: number,
                  endIndex: number
                ) => {
                  const result = Array.from(list);
                  const [removed] = result.splice(startIndex, 1);
                  result.splice(endIndex, 0, removed);

                  return result;
                };

                setItems(
                  reorder(items, result.source.index, result.destination.index)
                );
              }}
            >
              <Droppable droppableId="droppable" direction="vertical">
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        disableInteractiveElementBlocking={true} // Allow dragging from a button
                      >
                        {(provided, snapshot) => (
                          <div
                            className="flex"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <div
                              className={classNames(
                                "flex-grow overflow-hidden",
                                { "shadow-2xl": snapshot.isDragging }
                              )}
                            >
                              <ItemEditor
                                handleProps={provided.dragHandleProps}
                                dragging={snapshot.isDragging}
                                item={item}
                                setItem={(item) => {
                                  setItem(index, item);
                                }}
                                deleteItem={() => {
                                  deleteItem(index);
                                }}
                                questionIndex={
                                  // item.type === "freeResponse" ||
                                  // item.type === "multipleChoice"
                                  item.type === "question"
                                    ? items
                                        .filter(
                                          (i) =>
                                            // i.type === "freeResponse" ||
                                            // i.type === "multipleChoice"
                                            i.type === "question"
                                        )
                                        .indexOf(item) + 1
                                    : null
                                }
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div className="bg-white shadow p-4 space-x-2 mt-auto sticky bottom-0">
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded"
              onClick={() => {
                addItem("documentHeader");
              }}
            >
              Add header
            </button>

            <button
              className="bg-gray-600 text-white px-4 py-2 rounded"
              onClick={() => {
                addItem("text");
              }}
            >
              Add text
            </button>

            <button
              className="bg-gray-600 text-white px-4 py-2 rounded"
              onClick={() => {
                addItem("question");
              }}
            >
              Add question
            </button>
          </div>
        </div>
        <div
          ref={previewWrapperRef}
          className="overflow-x-hidden overflow-y-auto bg-white border-l border-gray-300"
        >
          <div
            ref={previewContentRef}
            style={{
              width: "8.5in",
              minHeight: "11in",
              padding: "0.5in",
              // boxSizing: "border-box",
              transform: `scale(${previewScale})`,
              marginBottom: `-100%`,
              transformOrigin: "top left",
            }}
          >
            <AssignmentPreview
              ref={printPreview}
              items={items}
              focusItem={focusItem}
            />
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
              <Dialog.Description>
                This will overwrite your current assignment.
              </Dialog.Description>
            </div>

            <div className="max-h-[50vh] overflow-y-auto flex-auto">
              <FileSelectionList
                selectedId={selectedFileId}
                onChange={(id) => {
                  setSelectedFileId(id);
                }}
              />
            </div>

            <div className="flex justify-between p-4">
              <button
                className="mr-4 bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 active:bg-gray-300"
                onClick={() => {
                  setLoadModalOpen(false);
                  setSelectedFileId(null);
                }}
              >
                Upload from computer
              </button>
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
      </div>
    );
  }
);

export default AssignmentEditor;

interface ItemEditorProps {
  item: Item;
  setItem: (item: Item | ((oldItem: Item) => Item)) => void;
  deleteItem: () => void;
  handleProps: any;
  dragging: boolean;
  questionIndex: number | null;
}

function ItemEditor({
  item,
  setItem,
  deleteItem,
  handleProps,
  dragging,
  questionIndex,
}: ItemEditorProps): React.ReactNode {
  const type = item.type;

  switch (type) {
    case "documentHeader":
      return (
        <ItemEditorContainer
          title={item.title || "Header"}
          titleBold={true}
          handleProps={handleProps}
          dragging={dragging}
          item={item}
          setItem={setItem}
          deleteItem={deleteItem}
          content={
            <div>
              <div className="pb-2 space-y-1">
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-2xl font-bold bg-transparent"
                  placeholder="Header"
                  value={item.title}
                  onChange={(event) => {
                    setItem({ ...item, title: event.target.value });
                  }}
                />
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 bg-transparent"
                  placeholder="Subheader"
                  value={item.subtitle}
                  onChange={(event) => {
                    setItem({ ...item, subtitle: event.target.value });
                  }}
                />
                <div className="space-x-2">
                  <label className="space-x-1">
                    <input
                      type="radio"
                      value="left"
                      checked={item.layout === "left"}
                      onChange={(event) =>
                        setItem({ ...item, layout: event.target.value as any })
                      }
                    />
                    <span>Left</span>
                  </label>
                  <label className="space-x-1">
                    <input
                      type="radio"
                      value="center"
                      checked={item.layout === "center"}
                      onChange={(event) =>
                        setItem({ ...item, layout: event.target.value as any })
                      }
                    />
                    <span>Center</span>
                  </label>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <div className="font-medium self-center">
                  Information blanks:
                </div>
                {item.blanks.length === 0 && (
                  <div className="text-gray-500 text-sm italic">
                    No information blanks
                  </div>
                )}
                <ol className="space-y-1">
                  {item.blanks.map((blank, index) => (
                    <li key={index} className="flex space-x-1">
                      <input
                        type="text"
                        className="border rounded px-2 py-1 flex-grow"
                        placeholder="Name:"
                        value={blank.label}
                        onChange={(event) => {
                          const newBlanks = [...item.blanks];
                          console.log(newBlanks);
                          newBlanks[index].label = event.target.value;
                          setItem({ ...item, blanks: newBlanks });
                        }}
                      />
                      <select
                        value={blank.style}
                        onChange={(event) => {
                          const newBlanks = [...item.blanks];
                          newBlanks[index].style = event.target.value as any;
                          setItem({ ...item, blanks: newBlanks });
                        }}
                        className="border rounded px-2 py-1"
                      >
                        <option value="line">Line</option>
                        <option value="box">Box</option>
                      </select>
                      <button
                        className="bg-gray-100 rounded px-2 py-1 hover:bg-gray-200 active:bg-gray-300"
                        onClick={(event) => {
                          const newBlanks = [...item.blanks];
                          newBlanks.splice(index, 1);
                          setItem({ ...item, blanks: newBlanks });
                        }}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ol>
                <button
                  className="bg-gray-100 rounded px-2 py-1 hover:bg-gray-200 active:bg-gray-300"
                  onClick={(event) => {
                    const defaults = ["Name", "Date", "Period"];
                    let defaultLabel = defaults.find(
                      (label) =>
                        !item.blanks.some((blank) =>
                          blank.label
                            .toLowerCase()
                            .includes(label.toLowerCase())
                        )
                    );
                    if (defaultLabel) {
                      defaultLabel += ":";
                    } else {
                      defaultLabel = "";
                    }

                    const defaultStyle =
                      item.blanks.length === 0
                        ? "line"
                        : item.blanks[item.blanks.length - 1].style;

                    const newBlanks = [...item.blanks];
                    newBlanks.push({
                      label: defaultLabel,
                      style: defaultStyle,
                    });
                    setItem({ ...item, blanks: newBlanks });
                  }}
                >
                  Add blank
                </button>
              </div>
            </div>
          }
        />
      );
    case "question": {
      const answer = item.answer;

      return (
        <ItemEditorContainer
          title={`Question ${questionIndex}`}
          handleProps={handleProps}
          dragging={dragging}
          item={item}
          setItem={setItem}
          deleteItem={deleteItem}
          content={
            <>
              <textarea
                className="border rounded px-2 py-1 w-full"
                placeholder="What is 1 + 1?"
                value={item.content}
                onChange={(event) => {
                  setItem({ ...item, content: event.target.value });
                }}
                onPaste={async (event) => {
                  // Handle pasting images
                  if (event.clipboardData.files.length > 0) {
                    const textarea = event.target as HTMLTextAreaElement;
                    textarea.disabled = true;

                    try {
                      for (const file of event.clipboardData.files) {
                        pasteImage(textarea, file);
                      }
                    } finally {
                      setItem({ ...item, content: textarea.value });
                      textarea.disabled = false;
                    }
                  }
                }}
              />

              <div
                className={classNames({
                  "flex space-x-1": answer.type === "freeResponse",
                  "space-y-1": answer.type === "multipleChoice",
                })}
              >
                <select
                  className="border rounded px-2 py-1"
                  value={item.answer.type}
                  onChange={(event) => {
                    const oldValue =
                      item.answer.type === "freeResponse"
                        ? item.answer.answer
                        : item.answer.choices[item.answer.correctChoice];

                    const newType: ItemQuestionAnswer["type"] = event.target
                      .value as any;

                    const answer: ItemQuestionAnswer = {
                      freeResponse: {
                        type: "freeResponse",
                        answer: oldValue,
                      } as ItemQuestionAnswer,
                      multipleChoice: {
                        type: "multipleChoice",
                        choices: [oldValue, "", "", ""],
                        correctChoice: 0,
                      } as ItemQuestionAnswer,
                    }[newType];

                    setItem({ ...item, answer });
                  }}
                >
                  <option value="freeResponse">Free Response</option>
                  <option value="multipleChoice">Multiple Choice</option>
                </select>

                {answer.type === "freeResponse" && (
                  <input
                    type="text"
                    className="border rounded px-2 py-1"
                    placeholder="Answer"
                    value={answer.answer}
                    onChange={(event) => {
                      setItem({
                        ...item,
                        answer: { ...answer, answer: event.target.value },
                      });
                    }}
                    onPaste={async (event) => {
                      // Handle pasting images
                      const input = event.target as HTMLInputElement;
                      input.disabled = true;

                      try {
                        for (const file of event.clipboardData.files) {
                          pasteImage(input, file);
                        }
                      } finally {
                        setItem({
                          ...item,
                          answer: { ...answer, answer: input.value },
                        });
                        input.disabled = false;
                      }
                    }}
                  />
                )}
                {answer.type === "multipleChoice" && (
                  <div className="space-y-1">
                    {answer.choices.map((choice, index, choices) => (
                      <ol key={index} className="flex space-x-1">
                        <label className="w-8 flex items-center justify-center cursor-pointer group">
                          <div
                            className={classNames(
                              "flex items-center justify-center w-8 h-8 rounded-full border group-focus-within:ring",
                              {
                                "bg-amber-200 text-amber-900 border-amber-300":
                                  answer.correctChoice === index,
                              }
                            )}
                          >
                            {String.fromCharCode("A".charCodeAt(0) + index)}
                          </div>
                          <input
                            className="appearance-none"
                            type="radio"
                            name="mc-answer"
                            checked={answer.correctChoice === index}
                            onChange={(event) => {
                              setItem({
                                ...item,
                                answer: { ...answer, correctChoice: index },
                              });
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          className="border px-2 py-1 rounded w-full"
                          placeholder={`Answer ${index + 1}`}
                          value={choice}
                          onChange={(event) => {
                            setItem({
                              ...item,
                              answer: {
                                ...answer,
                                choices: [
                                  ...answer.choices.slice(0, index),
                                  event.target.value,
                                  ...answer.choices.slice(index + 1),
                                ],
                              },
                            });
                          }}
                          onPaste={async (event) => {
                            // Handle pasting images
                            if (event.clipboardData.files.length > 0) {
                              const input = event.target as HTMLInputElement;
                              input.disabled = true;

                              try {
                                for (const file of event.clipboardData.files) {
                                  pasteImage(input, file);
                                }
                              } finally {
                                setItem({
                                  ...item,
                                  answer: {
                                    ...answer,
                                    choices: [
                                      ...answer.choices.slice(0, index),
                                      input.value,
                                      ...answer.choices.slice(index + 1),
                                    ],
                                  },
                                });
                                input.disabled = false;
                              }
                            }
                          }}
                        />
                      </ol>
                    ))}
                  </div>
                )}
              </div>
              <label className="block mt-2">
                <span className="font-bold">Work space: </span>
                <select
                  className="border rounded px-2 py-1"
                  value={item.workHeight}
                  onChange={(event) => {
                    setItem({ ...item, workHeight: event.target.value });
                  }}
                >
                  <option value="0">None</option>
                  <option value="50">Small</option>
                  <option value="100">Medium</option>
                  <option value="200">Large</option>
                  <option value="300">Huge</option>
                  <option value="500">Massive</option>
                </select>
              </label>
            </>
          }
        />
      );
    }
    case "text":
      return (
        <ItemEditorContainer
          title={item.content.replaceAll("\n", " ") || "Text"}
          handleProps={handleProps}
          dragging={dragging}
          item={item}
          setItem={setItem}
          deleteItem={deleteItem}
          content={
            <>
              <textarea
                className="border rounded px-2 py-1 w-full"
                placeholder="Write some text here..."
                value={item.content}
                onChange={(event) => {
                  setItem({ ...item, content: event.target.value });
                }}
                onPaste={async (event) => {
                  // Handle pasting images
                  if (event.clipboardData.files.length > 0) {
                    const textarea = event.target as HTMLTextAreaElement;
                    textarea.disabled = true;

                    try {
                      for (const file of event.clipboardData.files) {
                        pasteImage(textarea, file);
                      }
                    } finally {
                      setItem({ ...item, content: textarea.value });
                      textarea.disabled = false;
                    }
                  }
                }}
              />
              <label>
                <span className="font-bold">Style: </span>
                <select
                  className="border rounded px-2 py-1"
                  value={item.style}
                  onChange={(event) => {
                    setItem({
                      ...item,
                      style: event.target.value as Extract<
                        Item,
                        { type: "text" }
                      >["style"],
                    });
                  }}
                >
                  <option value="default">None</option>
                  <option value="box">Box</option>
                </select>
              </label>
            </>
          }
        />
      );
  }

  return assertUnreachable(type);
}

function assertUnreachable(x: never): never {
  throw new Error("Didn't expect to get here");
}

interface ItemEditorContainerProps {
  title: string | null;
  titleBold?: boolean;
  content: React.ReactNode;
  handleProps: any;
  dragging: boolean;
  item: Item;
  setItem: (item: Item) => void;
  deleteItem: () => void;
}

function ItemEditorContainer({
  title,
  titleBold = false,
  content,
  handleProps,
  dragging,
  item,
  setItem,
  deleteItem,
}: ItemEditorContainerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={classNames("bg-white transition-shadow shadow", {
        "shadow-lg": dragging,
      })}
    >
      <div
        id={`item-${item.id}-handle`}
        className="bg-gray-100 border-b h-12 flex items-center space-x-2"
        {...handleProps}
      >
        <div
          className="self-stretch px-2 flex items-center"
          onClick={() => {
            setOpen(!open);
          }}
        >
          <svg
            className="w-4 h-6 text-gray-400"
            width="100%"
            height="100%"
            viewBox="0 0 16 24"
          >
            <g fill="currentColor">
              <circle cx="4.5" cy="5" r="2" />
              <circle cx="11.5" cy="5" r="2" />
              <circle cx="4.5" cy="12" r="2" />
              <circle cx="11.5" cy="12" r="2" />
              <circle cx="4.5" cy="19" r="2" />
              <circle cx="11.5" cy="19" r="2" />
            </g>
          </svg>
        </div>

        {"starred" in item && (
          <button
            className={classNames("self-stretch", {
              "text-gray-400": !item.starred,
              "text-gray-800": item.starred,
            })}
            onClick={() => {
              setItem({ ...item, starred: !item.starred });
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                fill={item.starred ? "currentColor" : "none"}
                d="M12,2L14.245,8.91L21.511,8.91L15.633,13.18L17.878,20.09L12,15.82L6.122,20.09L8.367,13.18L2.489,8.91L9.755,8.91L12,2Z"
              />
            </svg>
          </button>
        )}

        {title && (
          <button
            className={classNames(
              "self-stretch flex-grow text-left text-gray-600 whitespace-nowrap overflow-hidden overflow-ellipsis",
              { "font-semibold text-gray-900": titleBold }
            )}
            onClick={() => {
              setOpen(!open);
            }}
          >
            {title}
          </button>
        )}

        <button
          className="self-stretch border-l px-2 flex items-center text-red-600"
          onClick={() => {
            deleteItem();
          }}
        >
          <svg className="w-4 h-6" viewBox="0 0 16 24" version="1.1">
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12,11L11,18L5,18L4,11" />
              <path d="M3,8L13,8" />
              <path d="M6,7L10,7" />
              <path d="M7,15L7,11" strokeWidth={1} />
              <path d="M9,15L9,11" strokeWidth={1} />
            </g>
          </svg>
        </button>
      </div>
      {open && <div className="p-3 border-b">{content}</div>}
    </div>
  );
}

interface AssignmentPreviewProps {
  items: Item[];
  focusItem: (id: string) => void;
}

const AssignmentPreview = forwardRef<HTMLDivElement, AssignmentPreviewProps>(
  function AssignmentPreview(
    { items, focusItem }: AssignmentPreviewProps,
    ref
  ) {
    return (
      <div className="font-times" ref={ref}>
        <div className="space-y-8">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-5 gap-x-4"
              style={{
                breakInside: ["documentHeader", "question"].includes(item.type)
                  ? "avoid"
                  : undefined,
              }}
            >
              <ItemPreview
                item={item}
                getQuestionIndex={(item) =>
                  items
                    .filter(
                      (i) =>
                        // i.type === "freeResponse" || i.type === "multipleChoice"
                        i.type === "question"
                    )
                    .indexOf(item)
                }
                focusItem={focusItem}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

interface ItemPreviewProps {
  item: Item;
  getQuestionIndex: (item: Item) => number;
  focusItem: (id: string) => void;
}

function ItemPreview({ item, getQuestionIndex, focusItem }: ItemPreviewProps) {
  const type = item.type;

  switch (type) {
    case "documentHeader":
      return (
        <>
          <div
            className={classNames({
              "col-start-1 col-span-3 pb-8": item.layout === "left",
              "col-span-full text-center": item.layout === "center",
            })}
            onDoubleClick={() => focusItem(item.id)}
          >
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: "28pt" }}
            >
              {item.title}
            </h1>
            {item.subtitle && <p>{item.subtitle}</p>}
          </div>
          <div
            className={classNames({
              "col-start-4 col-span-2 space-y-2 pb-8": item.layout === "left",
              "col-span-full mt-4": item.layout === "center",
            })}
            onDoubleClick={() => focusItem(item.id)}
          >
            <div
              className={classNames({
                "mx-auto w-64": item.layout === "center",
              })}
            >
              {item.blanks.map((blank, index) => (
                <Fragment key={index}>
                  {blank.style === "line" && (
                    <div className="flex items-baseline space-x-1">
                      {blank.label && (
                        <span className="font-bold whitespace-nowrap">
                          {blank.label}
                        </span>
                      )}
                      <div className="border-b border-black w-full">&nbsp;</div>
                    </div>
                  )}
                  {blank.style === "box" && (
                    <div>
                      {blank.label && (
                        <div>
                          <span className="font-bold">{blank.label}</span>
                        </div>
                      )}
                      <input
                        type="text"
                        className="border border-black text-2xl px-2 py-1 w-full"
                      />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </>
      );
    case "question":
      return (
        <>
          <div
            className="col-start-1 col-span-3"
            onDoubleClick={() => focusItem(item.id)}
          >
            <h6 className="font-bold">Question {getQuestionIndex(item) + 1}</h6>
            <div className="prose">
              <Markdown>{evaluateStr(item.content)}</Markdown>
            </div>
            <div style={{ height: Number(item.workHeight) }} />
          </div>

          <div
            className="col-start-4 col-span-2 space-y-2"
            onDoubleClick={() => focusItem(item.id)}
          >
            <h6 className="font-bold flex items-center justify-between">
              <span>Answer {getQuestionIndex(item) + 1}</span>
              {item.starred && (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    fill={item.starred ? "currentColor" : "none"}
                    d="M12,2L14.245,8.91L21.511,8.91L15.633,13.18L17.878,20.09L12,15.82L6.122,20.09L8.367,13.18L2.489,8.91L9.755,8.91L12,2Z"
                  />
                </svg>
              )}
            </h6>
            {item.answer.type === "freeResponse" && (
              <input
                type="text"
                className="border border-black text-2xl px-2 py-1 w-full"
              />
            )}
            {item.answer.type === "multipleChoice" && (
              <ol className="space-y-2">
                {item.answer.choices.map((choice, index) => (
                  <div key={index} className="flex items-center">
                    <div className="self-stretch flex-shrink-0">
                      <span className="w-7 h-7 mr-2 border border-black rounded-full flex items-center justify-center">
                        {String.fromCharCode("A".charCodeAt(0) + index)}
                      </span>
                    </div>
                    <span>
                      <Markdown>{evaluateStr(choice)}</Markdown>
                    </span>
                  </div>
                ))}
              </ol>
            )}
          </div>
        </>
      );
    case "text":
      switch (item.style) {
        case "box":
          return (
            <div
              className="prose prose-lg col-start-1 col-span-5 border-2 border-black p-4"
              onDoubleClick={() => focusItem(item.id)}
            >
              <Markdown>{evaluateStr(item.content)}</Markdown>
            </div>
          );
        default:
          return (
            <div
              className="prose prose-lg col-start-1 col-span-5"
              onDoubleClick={() => focusItem(item.id)}
            >
              <Markdown>{evaluateStr(item.content)}</Markdown>
            </div>
          );
      }
  }

  assertUnreachable(type);
}

function evaluateStr(expression: string, context = {}) {
  if (typeof context === "string") {
    try {
      context = JSON.parse(context);
    } catch (err) {
      context = {};
    }
  }

  return expression
    .split(/#{(.*?)}/)
    .map((s, index) => (index % 2 === 0 ? s : String(evaluateExpr(s, context))))
    .join("");
}

function evaluateExpr(expression: string, context = {}) {
  const defaultContext = {
    polynomial(terms: number[], { simplify = true, varName = "x" } = {}) {
      return (
        terms
          .reverse()
          .map((c, index) => {
            if (simplify && c === 0) return null;

            let result;
            if (index === 0) {
              result = "";
            } else if (index === 1 && simplify) {
              result = `${varName}`;
            } else {
              result = `${varName}^${index}`;
            }

            if (!(c === 1 && index !== 0 && simplify)) {
              result = `${c}${result}`;
            }

            return result;
          })
          .filter((s) => s !== null)
          .reverse()
          .join(" + ") || "0"
      );
    },
  };
  const entries = Object.entries({ ...defaultContext, ...context });
  const keys = entries.map(([k, v]) => k);
  const values = entries.map(([k, v]) => v);

  try {
    return new Function(...keys, `return (${expression});`)(...values);
  } catch (err) {
    console.error(err);
    return null;
  }
}

// const renderers = {
//   inlineMath: ({ value }) => <TeX math={value} />,
//   math: ({ value }) => <TeX block math={value} />,
//   heading: ({ level, children }) => {
//     switch (level) {
//       case 1:
//         return (
//           <h2
//             className="font-bold border-b-2 border-gray-300 pb-2"
//             style={{ fontSize: "24pt" }}
//           >
//             {children}
//           </h2>
//         );
//       case 2:
//         return (
//           <h3
//             className="font-bold border-b-2 border-gray-300 pb-2"
//             style={{ fontSize: "20pt" }}
//           >
//             {children}
//           </h3>
//         );
//       case 3:
//         return (
//           <h4 className="font-bold" style={{ fontSize: "18pt" }}>
//             {children}
//           </h4>
//         );
//       default:
//         return <h5 className="font-bold">{children}</h5>;
//     }
//   },
// };

interface MarkdownProps extends ReactMarkdownOptions {
  children: string;
}

function Markdown({ children, ...props }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex, { plugins: [rehypeKatex], settings: {} }]}
      {...props}
    >
      {children}
    </ReactMarkdown>
  );
}

async function pasteImage(
  input: HTMLInputElement | HTMLTextAreaElement,
  file: File
) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;

  // Prevent user from typing while image is uploading
  // This is the wrong way to do this (directly manipulating DOM
  // rather than setting React state), but it's quick and easy
  // and is fine for now.
  input.disabled = true;

  // 1. Get presigned AWS url
  const { presignedURL, uploadedURL } = await fetch("/api/upload-image", {
    method: "POST",
  }).then((res) => res.json());

  // 2. Upload image to AWS
  await fetch(presignedURL, {
    method: "PUT",
    body: file,
  });

  // 3. Insert image markdown into textarea
  const markdown = `![](${uploadedURL})`;
  const text = input.value;
  const newText =
    text.substring(0, start) + markdown + text.substring(end, text.length);
  input.value = newText;
  input.selectionStart = input.selectionEnd = start + markdown.length;
}
