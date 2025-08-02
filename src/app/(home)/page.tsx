"use client";
export const dynamic = "force-dynamic";


import { ChatLayout } from "@/components/chat/chat-layout";
import { uuid } from "@/lib/utils";
import React from "react";

export default function Home() {
  const id = uuid();

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
        <ChatLayout
          key={id}
          id={id}
          initialMessages={[]}
        />
    </main>
  );
}
