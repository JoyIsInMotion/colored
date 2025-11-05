import React from "react";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-gray-200 px-4 py-3 text-xs text-gray-500 flex flex-wrap gap-2 justify-between">
      <span>© {new Date().getFullYear()} Colored</span>
      <span>
        Background removal by{" "}
        <a
          href="https://huggingface.co/Trendyol/background-removal"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-black"
        >
          Trendyol/background-removal
        </a>
        , licensed under CC BY-SA 4.0.
      </span>
    </footer>
  );
}