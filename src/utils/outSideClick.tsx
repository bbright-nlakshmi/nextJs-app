import { useState, useEffect, useRef } from "react";

{
  /*  outside click dropdown toggle - custom hook */
}
export default function useOutSideClick(initialIsVisible:any) {
  const [isComponentVisible, setIsComponentVisible] = useState(initialIsVisible);
  const ref = useRef<any>(null);

  const handleClickOutside = (event:any) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setIsComponentVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  return { ref, isComponentVisible, setIsComponentVisible };
}
