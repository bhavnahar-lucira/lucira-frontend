"use client";

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">
          Something went wrong!
        </h2>

        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}