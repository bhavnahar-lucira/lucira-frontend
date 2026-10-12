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
import { AnimatePresence } from "framer-motion";
import { OtpSpinAuth } from "./OtpSpinAuth";
import { ScratchCardAuth } from "./scratch/ScratchCardAuth";
import { VARIANT_SCRATCH } from "@/lib/signupExperiment";
import { CheckoutAuthForm } from "@/components/checkout/CheckoutAuthForm";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { runPendingLoginAction, clearPendingLoginAction } from "@/hooks/useAtcLoginGate";

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
  useCheckoutAuth = false,
  // Signup popup A/B test (AutoAuthPopup only): "spin_wheel" | "scratch_card".
  experimentVariant = null,
  experimentDevice = null,
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const liveRedirectPath = useSelector((state) => state.user.authRedirectPath);
  const liveOverrides = useSelector((state) => state.user.authModalOverrides);

  // closeAuthModal wipes the overrides the moment the modal is told to close,
  // while the dialog/sheet is still animating out. Reading them live would flip
  // the closing modal to the default title, or to the spin-wheel form entirely.
  // Hold on to what it was opened with until it opens again.
  const [heldAuthConfig, setHeldAuthConfig] = useState({ overrides: liveOverrides, redirectPath: liveRedirectPath });
  if (open && (heldAuthConfig.overrides !== liveOverrides || heldAuthConfig.redirectPath !== liveRedirectPath)) {
    setHeldAuthConfig({ overrides: liveOverrides, redirectPath: liveRedirectPath });
  }
  const authModalOverrides = open ? liveOverrides : heldAuthConfig.overrides;
  const authRedirectPath = open ? liveRedirectPath : heldAuthConfig.redirectPath;

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

  const defaultTitle = pathname === "/checkout/cart" ? "Unlock Your Benefits" : "Checkout Securely";
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

  // User-initiated close (X, backdrop) without logging in: drop any add-to-cart
  // that was waiting on this login.
  const handleDismiss = () => {
    clearPendingLoginAction();
    handleClose();
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
      runPendingLoginAction();
    }, 50);
  };

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  if (isMobile && experimentVariant === VARIANT_SCRATCH && !isCartOrCheckout) {
    return (
      <AnimatePresence>
        {isOpen && <ScratchCardAuth key="scratch-card" onClose={handleClose} onSuccess={handleSuccess} />}
      </AnimatePresence>
    );
  }

  if (isMobile) {
    return (
      <Sheet
        isOpen={isOpen}
        onClose={handleDismiss}
        detent="content"
        avoidKeyboard={true}
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
                  onClose={handleDismiss}
                  keepSavedCart={!!authModalOverrides?.keepSavedCart}
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
                  experimentVariant={experimentVariant}
                  experimentDevice={experimentDevice}
                />
              </div>
            )}
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={handleDismiss} />
      </Sheet>
    );
  }

  if (isCartOrCheckout) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(val) => (val ? onOpenChange(true) : handleDismiss())}
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
              onClose={handleDismiss}
              keepSavedCart={!!authModalOverrides?.keepSavedCart}
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
          experimentVariant={experimentVariant}
          experimentDevice={experimentDevice}
        />
      </DialogContent>
    </Dialog>
  );
}
