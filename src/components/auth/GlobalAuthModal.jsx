"use client";

import { AuthDialog } from "./AuthDialog";
import { useAuth } from "@/hooks/useAuth";

export function GlobalAuthModal() {
  const { isAuthModalOpen, closeLogin } = useAuth();

  return (
    <AuthDialog 
      open={isAuthModalOpen} 
      onOpenChange={(open) => !open && closeLogin()} 
    />
  );
}
