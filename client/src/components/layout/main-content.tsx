import React from "react";

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div className="flex-1 md:ml-64 min-h-screen">
      {children}
    </div>
  );
}
