"use client";

import { useSelector } from "react-redux";
import { AuthDialog } from "./AuthDialog";
import { useAuth } from "@/hooks/useAuth";

export function GlobalAuthModal() {
  const { isAuthModalOpen, closeLogin } = useAuth();
  const authModalOverrides = useSelector((state) => state.user.authModalOverrides);

  return (
    <AuthDialog 
      open={isAuthModalOpen} 
      onOpenChange={(open) => !open && closeLogin()} 
      overrideHeading={authModalOverrides?.overrideHeading}
      overrideSubtext={authModalOverrides?.overrideSubtext}
      overrideButtonText={authModalOverrides?.overrideButtonText}
      initialStep={authModalOverrides?.initialStep || "login"}
      useCheckoutAuth={authModalOverrides?.useCheckoutAuth}
    />
  );
}
