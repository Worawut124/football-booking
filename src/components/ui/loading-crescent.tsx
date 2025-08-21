"use client";

import React from "react";

type LoadingCrescentProps = {
  text?: string;
};

export default function LoadingCrescent({ text }: LoadingCrescentProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-white/70 border-t-transparent border-l-transparent animate-spin" />
        {text ? <p className="text-white text-sm">{text}</p> : null}
      </div>
    </div>
  );
}


