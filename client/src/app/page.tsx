"use client";

import RenderMainPage from "@/components/RenderMainPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RenderMainPage type={"MAIN"} />
    </Suspense>
  );
}
