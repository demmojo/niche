import { useMemo, useEffect } from "react";
import useSWR from "swr";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  limit,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { z } from "zod";

const hexSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/i, "Invalid hex");

/**
 *
 */
function getContrastForeground(hexcolor: string): string {
  const hex = hexcolor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

/**
 *
 */
const fetchBrandIdentity = async (projectId: string) => {
  if (
    typeof window !== "undefined" &&
    (window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true"))
  ) {
    return null;
  }
  // Query for the active version
  const q = query(
    collection(
      db,
      "project_brand_identities",
      projectId,
      "BrandIdentityVersions",
    ),
    where("isActive", "==", true),
    limit(1),
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    // Fallback: Check if the main document has legacy schema
    const legacyDocRef = doc(db, "project_brand_identities", projectId);
    const legacySnapshot = await getDoc(legacyDocRef);
    if (legacySnapshot.exists() && legacySnapshot.data()?.selected_identity) {
      return { id: legacySnapshot.id, ...(legacySnapshot.data() as any) };
    }
    return null; // No brand identity found
  }

  const activeDoc = snapshot.docs[0];
  return { id: activeDoc.id, ...(activeDoc.data() as any) };
};

export type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

/**
 *
 */
export function useProjectBrandIdentity(projectId: string | null) {
  const { data, error, isLoading } = useSWR(
    projectId ? `brand-identity-${projectId}` : null,
    () => fetchBrandIdentity(projectId!),
    {
      revalidateOnFocus: false, // Infrequently changes unless HITL approved
      revalidateIfStale: false,
    },
  );

  const safeBrandState = useMemo(() => {
    if (isLoading) return { status: "loading" } as FetchState<any>;
    if (error) return { status: "error", error } as FetchState<any>;
    if (!data) return { status: "idle" } as FetchState<any>;

    // 1. Validate the hex securely
    const rawColor =
      data.selected_identity?.visual_identity?.primary_color || "#3B82F6";
    const parsedHex = hexSchema.safeParse(rawColor);
    const safeHex = parsedHex.success ? parsedHex.data : "#3B82F6"; // Default blue

    // 2. Compute the foreground contrast color
    const safeFg = getContrastForeground(safeHex);

    return {
      status: "success",
      data: {
        ...data,
        primary_color: safeHex,
        primary_fg: safeFg,
        tone:
          data.selected_identity?.positioning?.personality || "Professional",
        typography:
          data.selected_identity?.visual_identity?.typography_pair || "Inter",
      },
    } as FetchState<any>;
  }, [data, error, isLoading]);

  return safeBrandState;
}
