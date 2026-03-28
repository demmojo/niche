import { useState, useEffect } from "react";

export function useUrlSearchParam(
  key: string,
  defaultValue: string,
): [string, (value: string) => void] {
  const [value, setValue] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || defaultValue;
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setValue(params.get(key) || defaultValue);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [key, defaultValue]);

  const updateValue = (newValue: string) => {
    setValue(newValue);
    const url = new URL(window.location.href);
    if (newValue === defaultValue) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, newValue);
    }
    window.history.pushState({}, "", url.toString());
  };

  return [value, updateValue];
}
