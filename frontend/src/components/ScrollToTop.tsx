import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scroll to top on every route/search change (centralized for all pages). */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}
