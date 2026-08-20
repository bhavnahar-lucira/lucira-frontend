"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const ShieldCheckIcon = (props) => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18.51 32.9257C24.75 30.7507 30 27.0007 30 19.5007V9.00067C30 8.60285 29.842 8.22132 29.5607 7.94001C29.2794 7.65871 28.8978 7.50067 28.5 7.50067C25.5 7.50067 21.765 5.71567 19.14 3.42067C18.8222 3.14917 18.418 3 18 3C17.582 3 17.1778 3.14917 16.86 3.42067C14.25 5.70067 10.5 7.50067 7.5 7.50067C7.10218 7.50067 6.72064 7.65871 6.43934 7.94001C6.15804 8.22132 6 8.60285 6 9.00067V19.5007C6 27.0007 11.25 30.7507 17.505 32.9107C17.8283 33.0311 18.1832 33.0364 18.51 32.9257Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 12H22M14 15.3333H22M19.6667 24L14 18.6667H16C20.4447 18.6667 20.4447 12 16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChartLineIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M2 2V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H14M13 4L8.66667 9.33333L6.33333 6.66667L4.66667 8.66667" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RupeeIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4 2H12M4 5.33333H12M9.66667 14L4 8.66667H6C10.4447 8.66667 10.4447 2 6 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HandshakeIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M8.27332 3.88293L6.39132 5.72426C6.14136 5.9743 6.00094 6.31337 6.00094 6.66693C6.00094 7.02048 6.14136 7.35956 6.39132 7.60959C6.64135 7.85955 6.98043 7.99997 7.33398 7.99997C7.68754 7.99997 8.02661 7.85955 8.27665 7.60959L9.41665 6.46959C9.56585 6.32033 9.743 6.20192 9.93798 6.12113C10.133 6.04034 10.3419 5.99876 10.553 5.99876C10.764 5.99876 10.973 6.04034 11.168 6.12113C11.363 6.20192 11.5401 6.32033 11.6893 6.46959L12.9433 7.72426C13.1933 7.9743 13.3337 8.31337 13.3337 8.66693C13.3337 9.02048 13.1933 9.35956 12.9433 9.60959C14.0007 8.55226 14.6673 7.66693 14.6673 6.33359C14.6673 5.59173 14.4423 4.86731 14.0219 4.25603C13.6015 3.64476 13.0056 3.17536 12.3129 2.90986C11.6202 2.64435 10.8632 2.59522 10.142 2.76895C9.42074 2.94269 8.76917 3.33111 8.27332 3.88293ZM12.9433 9.60959C12.8118 9.7411 12.6557 9.84542 12.4839 9.91659C12.3121 9.98777 12.128 10.0244 11.942 10.0244C11.756 10.0244 11.5719 9.98777 11.4001 9.91659C11.2502 9.85452 11.1123 9.76723 10.9923 9.65868M8.27332 3.88293C8.19936 3.952 8.10198 3.99047 8.00078 3.99059C7.89959 3.99072 7.80211 3.95248 7.72798 3.88359C7.23217 3.33182 6.58066 2.94341 5.85949 2.76966C5.13831 2.59591 4.3814 2.64498 3.6887 2.91041C2.996 3.17583 2.4001 3.64511 1.97969 4.25629C1.55928 4.86746 1.33413 5.59178 1.33398 6.33359C1.33398 7.86693 2.33398 9.00026 3.33398 10.0003L7.02398 13.5749C7.14601 13.7061 7.29323 13.8114 7.45685 13.8845C7.62047 13.9575 7.79713 13.9968 7.97629 14C8.15544 14.0033 8.33341 13.9704 8.49956 13.9033C8.66571 13.8362 8.81663 13.7363 8.94332 13.6096C9.07457 13.4782 9.17862 13.3221 9.24953 13.1504C9.32044 12.9788 9.35681 12.7948 9.35656 12.609C9.35632 12.4233 9.31945 12.2394 9.24809 12.0679C9.18619 11.9192 9.09939 11.7823 8.99158 11.663M8.99158 11.663C8.97509 11.6448 8.95811 11.627 8.94065 11.6096C8.95718 11.6279 8.97416 11.6457 8.99158 11.663ZM8.99158 11.663C9.10983 11.7808 9.24812 11.8769 9.40016 11.9467C9.57459 12.0268 9.76349 12.0706 9.95537 12.0754C10.1472 12.0802 10.3381 12.046 10.5163 11.9748C10.6946 11.9036 10.8565 11.7969 10.9922 11.6611C11.1279 11.5254 11.2346 11.3635 11.3058 11.1853C11.3771 11.007 11.4113 10.8162 11.4065 10.6243C11.4017 10.4324 11.3579 10.2435 11.2778 10.0691C11.2076 9.91627 11.1109 9.77733 10.9923 9.65868M10.9923 9.65868C10.9755 9.64191 10.9583 9.62554 10.9407 9.60959C10.9575 9.6264 10.9747 9.64277 10.9923 9.65868Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FEATURES = [
  {
    icon: RupeeIcon,
    title: "Rates captured at checkout",
    description: "Gold and other rates are fixed at the time you reach checkout",
  },
  {
    icon: ChartLineIcon,
    title: "Protected from market fluctuations",
    description: "Your price won't change if rates move during the 10 minutes",
  },
  {
    icon: HandshakeIcon,
    title: "Complete your purchase with confidence",
    description: "The protected price remains unchanged while you checkout",
  },
];

export default function PriceProtectionDrawer({ open, onOpenChange, secondsLeft = 0 }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const content = (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full">
      <div className="flex-1 flex flex-col justify-center items-center w-full py-8">
        <div className="w-14 h-14 rounded-full bg-[#FBEFDD] flex items-center justify-center mb-4">
          <ShieldCheckIcon className="text-[#5A413F]" />
        </div>

        <h3 className="font-figtree font-semibold text-[16px] text-black leading-[1.4] tracking-normal text-center mb-2">
          A Promise to Protect Your Price
        </h3>
        <p className="font-figtree font-normal text-[12px] text-[#222222]/70 mb-6 leading-[1.7] tracking-normal text-center">
          Your Final Price won&apos;t fluctuate as per the market for{" "}
          <span className="font-semibold text-black">{mm}:{ss} mins</span>
        </p>

        <div className="w-full space-y-5 text-left">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FBEFDD] flex items-center justify-center shrink-0">
                <Icon size={16} className="text-[#5A413F]" strokeWidth={2} />
              </div>
              <div>
                <p className="font-figtree font-semibold text-[13.5px] text-black leading-tight mb-[5px]">{title}</p>
                <p className="font-figtree font-normal text-[12px] text-[#222222]/65 leading-[16px] tracking-normal align-middle mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-white pt-4 pb-6 shrink-0 mt-auto text-center">
        <p className="font-figtree text-[12px] text-[#222222]/50 mb-3">
          Complete your Payment to secure your Luxury
        </p>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full bg-[#5A413F] text-white py-3.5 rounded-[6px] font-figtree font-medium text-[15px] transition-colors hover:bg-[#4A312F] shadow-md"
        >
          Got It
        </button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="bg-white flex flex-col p-0 sm:max-w-md w-full border-l border-zinc-200 shadow-xl overflow-hidden z-[2000]">
          <SheetHeader className="sr-only">
            <SheetTitle>A Promise to Protect Your Price</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-12 pb-0 no-scrollbar">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white rounded-t-[20px] [&>div:first-child]:hidden max-h-[92vh] flex flex-col p-0 overflow-hidden z-[2000]">
        <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-6 pb-0 no-scrollbar">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
