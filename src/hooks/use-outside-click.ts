import React from "react";

export const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  callback: (event: MouseEvent | TouchEvent) => void
) => {
  React.useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      if (ref.current === null || ref.current.contains(event.target as Node)) {
        return;
      }
      callback(event);
    }
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};