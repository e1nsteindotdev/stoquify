import React from "react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
        <img
          src="/logo.svg"
          alt="Stoquify"
          className="h-24 w-auto animate-pulse"
        />
      </div>
    </div>
  );
}
