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
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function AuthDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  initialStep = "login",
  forceShowWheel = false,
  overrideHeading = "",
  overrideSubtext = ""
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(initialStep);

  useEffect(() => {
    if (open) {
      setCurrentStep(initialStep);
    }
  }, [open, initialStep]);

  const handleSuccess = (redirectPath) => {
    onOpenChange(false);
    if (onSuccess) onSuccess();
    if (redirectPath && redirectPath !== pathname) {
      router.push(redirectPath);
    }
  };

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  if (isMobile) {
    return (
      <Sheet 
        isOpen={open} 
        onClose={() => onOpenChange(false)}
      >
        <Sheet.Container className="!bg-white !rounded-t-lg !shadow-[0_-2px_16px_rgba(0,0,0,0.3)] !h-auto">
          <Sheet.Content className="!p-0">
            <div className="sr-only">
              <h2>{currentStep === "register" ? "Registration" : "Authentication"}</h2>
              <p>{currentStep === "register" ? "Join Lucira to win rewards." : "Login to your account."}</p>
            </div>
            <div className="custom-scrollbar-hide">
              <OtpSpinAuth 
                onSuccess={handleSuccess} 
                onClose={() => onOpenChange(false)} 
                initialStep={currentStep}
                onStepChange={handleStepChange}
                forceShowWheel={forceShowWheel}
                overrideHeading={overrideHeading}
                overrideSubtext={overrideSubtext}
              />
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => onOpenChange(false)} />
      </Sheet>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
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
          onClose={() => onOpenChange(false)} 
          initialStep={currentStep}
          onStepChange={handleStepChange}
          forceShowWheel={forceShowWheel}
          overrideHeading={overrideHeading}
          overrideSubtext={overrideSubtext}
          isPopup={true}
        />
      </DialogContent>
    </Dialog>
  );
}
