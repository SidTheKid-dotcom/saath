"use client";

import { useState, type ReactNode } from "react";
import { promptInstall, useInstallMode } from "./installStore";

type Props = {
  label: string;
  iosSteps: ReactNode;
  installedText: string;
  fallbackText: string;
  className?: string;
  noteClassName?: string;
};

/** "Add to home screen": the browser prompt where it exists, short steps on iPhone, a plain hint elsewhere. */
export function InstallButton({ label, iosSteps, installedText, fallbackText, className, noteClassName }: Props) {
  const mode = useInstallMode();
  const [showIos, setShowIos] = useState(false);

  if (mode === "unknown") return null;
  if (mode === "installed") return <p className={noteClassName}>{installedText}</p>;
  if (mode === "none") return <p className={noteClassName}>{fallbackText}</p>;

  return (
    <>
      <button
        type="button"
        className={className}
        aria-expanded={mode === "ios" ? showIos : undefined}
        onClick={() => (mode === "prompt" ? void promptInstall() : setShowIos((open) => !open))}
      >
        {label}
      </button>
      {mode === "ios" && showIos && (
        <div className={noteClassName} role="status">
          {iosSteps}
        </div>
      )}
    </>
  );
}
