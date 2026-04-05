import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useWorkspaceDispatch, useWorkspaceLoading } from "./WorkspaceProvider";

export const useSuperadminBootstrap = () => {
  const { user } = useAuth();
  const [customClaims, setCustomClaims] = useState<any>(null);
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
  }, [user?.uid]);

  useEffect(() => {
    if (!user || hasBootstrapped.current || isLoading) return;

    if (customClaims?.superadmin) {
      hasBootstrapped.current = true;
      const defaultId = "prod-kageform";
      setWorkspaceId(defaultId);
    }
  }, [user, customClaims, isLoading, setWorkspaceId]);
};
