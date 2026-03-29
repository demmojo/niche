import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  useProductsDispatch,
  useWorkspaceDispatch,
  useWorkspaceLoading,
} from "./WorkspaceProvider";

export const useSuperadminBootstrap = () => {
  const { user } = useAuth();
  const [customClaims, setCustomClaims] = useState<any>(null);
  const setProducts = useProductsDispatch();
  const setWorkspaceId = useWorkspaceDispatch();
  const isLoading = useWorkspaceLoading();
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (user) {
      user
        .getIdTokenResult()
        .then((result) => {
          setCustomClaims(result.claims);
        })
        .catch(console.error);
    } else {
      setCustomClaims(null);
    }
  }, [user?.uid]); // Use uid to prevent infinite loops if user object is recreated in tests

  useEffect(() => {
    // Wait until workspace loading is finished (or if you prefer, bootstrap regardless of loading state)
    // But usually you want to ensure we don't interfere with initial loads. Let's do a simple check.
    if (!user || hasBootstrapped.current || isLoading) return;

    // Check for superadmin custom claims
    if (customClaims?.superadmin) {
      hasBootstrapped.current = true;

      const defaultId = "prod-kageform";
      setProducts([
        {
          id: defaultId,
          name: "KageForm",
          niche: "BaaS form platform",
        },
      ]);
      setWorkspaceId(defaultId);
    }
  }, [user, customClaims, isLoading, setProducts, setWorkspaceId]);
};
