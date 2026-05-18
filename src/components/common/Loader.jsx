"use client";

import { Spinner } from "@/components/ui/spinner";

export default function Loader() {
  return (
    <div className="flex justify-center items-center">
      <Spinner className="size-8" />
    </div>
  );
}
