"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet } from "react-modal-sheet";
import { OtpSpinAuth } from "./OtpSpinAuth";
import { CheckoutAuthForm } from "@/components/checkout/CheckoutAuthForm";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { useSelector } from "react-redux";

export function AuthDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  initialStep = "login",
  forceShowWheel = false,
  overrideHeading = "",
  overrideSubtext = "",
  overrideButtonText = "",
  useCheckoutAuth = false
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const authRedirectPath = useSelector((state) => state.user.authRedirectPath);
  const authModalOverrides = useSelector((state) => state.user.authModalOverrides);
  const hideRegisterLink = authRedirectPath === "/checkout/shipping" || pathname === "/checkout/cart";

  const isCartOrCheckout = 
    useCheckoutAuth || 
    authModalOverrides?.useCheckoutAuth ||
    pathname === "/checkout/cart" || 
    pathname?.startsWith("/checkout") ||
    authRedirectPath === "/checkout/shipping" ||
    authRedirectPath === "/checkout/cart";

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialStep, setPrevInitialStep] = useState(initialStep);
  if (open !== prevOpen || initialStep !== prevInitialStep) {
    setPrevOpen(open);
    setPrevInitialStep(initialStep);
    if (open) {
      setCurrentStep(initialStep);
    }
  }

  // Registering dispatches `login`, which flips isAuthModalOpen to false in Redux
  // and would yank the modal away before the reward coupon is ever seen. Latch it
  // open on the success step until the user dismisses it themselves.
  const isOpen = open || currentStep === "success";

  const defaultTitle = pathname === "/checkout/cart" ? "Sign Up To Get Assured Rewards" : "Checkout Securely";
  const defaultSubtitle = pathname === "/checkout/cart" ? "" : "Login / Signup to proceed checkout";

  const hasHeadingOverride = overrideHeading !== undefined && overrideHeading !== null && overrideHeading !== "";
  const hasSubtextOverride = overrideSubtext !== undefined && overrideSubtext !== null;

  const finalTitle = hasHeadingOverride 
    ? overrideHeading 
    : (authModalOverrides?.overrideHeading || defaultTitle);

  const finalSubtitle = hasSubtextOverride
    ? overrideSubtext
    : (authModalOverrides?.overrideSubtext !== undefined && authModalOverrides.overrideSubtext !== null
        ? authModalOverrides.overrideSubtext
        : defaultSubtitle);

  const handleClose = () => {
    setCurrentStep(initialStep); // releases the success latch
    onOpenChange(false);
  };

  const handleSuccess = (redirectPath) => {
    // 1. Explicitly navigate first if a path is provided
    if (redirectPath) {
      router.push(redirectPath);
    }

    // 2. Then close the modal after a short delay to allow navigation to initiate
    setTimeout(() => {
      handleClose();
      if (onSuccess) onSuccess();
    }, 50);
  };

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  if (isMobile) {
    return (
      <Sheet
        isOpen={isOpen}
        onClose={handleClose}
        detent="content"
        avoidKeyboard={true}
        springConfig={{ stiffness: 380, damping: 32, mass: 0.35 }}
        style={{ zIndex: 2000 }}
      >
        <Sheet.Container className="!bg-white !rounded-t-lg !shadow-[0_-2px_16px_rgba(0,0,0,0.3)] !h-auto !max-h-[95dvh] !z-[2000]">
          <Sheet.Content className="!p-0">
            <div className="sr-only">
              <h2>{finalTitle || (currentStep === "register" ? "Registration" : "Authentication")}</h2>
              <p>{finalSubtitle || (currentStep === "register" ? "Join Lucira to win rewards." : "Login to your account.")}</p>
            </div>
            {isCartOrCheckout ? (
              <div className="px-5 pt-5 pb-6 relative">
                <CheckoutAuthForm
                  onSuccess={handleSuccess}
                  title={finalTitle}
                  subtitle={finalSubtitle}
                  buttonText={overrideButtonText || "CONTINUE"}
                  onClose={handleClose}
                />
              </div>
            ) : (
              <div className="custom-scrollbar-hide overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                <OtpSpinAuth
                  onSuccess={handleSuccess}
                  onClose={handleClose}
                  initialStep={currentStep}
                  onStepChange={handleStepChange}
                  forceShowWheel={forceShowWheel}
                  overrideHeading={overrideHeading}
                  overrideSubtext={overrideSubtext}
                  overrideButtonText={overrideButtonText}
                  isPopup={true}
                  hideRegisterLink={hideRegisterLink}
                />
              </div>
            )}
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={handleClose} />
      </Sheet>
    );
  }

  if (isCartOrCheckout) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}
      >
        <DialogContent 
          className="w-full max-w-[420px] p-0 border-none bg-white shadow-2xl rounded-lg overflow-hidden" 
          showCloseButton={false}
        >
          <div className="sr-only">
            <DialogTitle>{finalTitle}</DialogTitle>
            <DialogDescription>
              {finalSubtitle}
            </DialogDescription>
          </div>
          <div className="relative w-full">
            <CheckoutAuthForm
              onSuccess={handleSuccess}
              title={finalTitle}
              subtitle={finalSubtitle}
              buttonText={overrideButtonText || "CONTINUE"}
              onClose={handleClose}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(val) => (val ? onOpenChange(true) : handleClose())}
    >
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[1200px] p-0 border-none bg-transparent shadow-none overflow-visible" showCloseButton={false}>
        <div className="sr-only">
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>
            Login or register to access your account and win prizes.
          </DialogDescription>
        </div>
        <OtpSpinAuth
          onSuccess={handleSuccess}
          onClose={handleClose}
          initialStep={currentStep}
          onStepChange={handleStepChange}
          forceShowWheel={forceShowWheel}
          overrideHeading={overrideHeading}
          overrideSubtext={overrideSubtext}
          overrideButtonText={overrideButtonText}
          isPopup={true}
          hideRegisterLink={hideRegisterLink}
        />
      </DialogContent>
    </Dialog>
  );
}
