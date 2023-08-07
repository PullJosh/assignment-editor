import Link from "next/link";

export default function Page() {
  return (
    <>
      <div className="bg-amber-300 flex h-14">
        <div className="container max-w-4xl mx-auto px-16 flex">
          <Link href="/" className="font-bold text-lg flex items-center">
            Assignment Editor
          </Link>
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
    </>
  );
}
