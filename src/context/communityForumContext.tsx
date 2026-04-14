import { createContext, useContext } from "react";
import { useCommunityPosts, type UseCommunityPostsReturn } from "@/hooks/useCommunityPosts";

type CommunityForumContextValue = UseCommunityPostsReturn;

const CommunityForumContext = createContext<CommunityForumContextValue | null>(null);

export function useCommunityForum() {
  const ctx = useContext(CommunityForumContext);
  if (!ctx) {
    throw new Error("useCommunityForum must be used within CommunityForumProvider");
  }
  return ctx;
}

export function CommunityForumProvider({ children }: { children: React.ReactNode }) {
  const value = useCommunityPosts();

  return (
    <CommunityForumContext.Provider value={value}>
      {children}
    </CommunityForumContext.Provider>
  );
}
