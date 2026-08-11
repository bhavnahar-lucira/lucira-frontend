"use client";

import React from "react";
import { Sheet } from "react-modal-sheet";
import { X } from "lucide-react";

export function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  snapPoints,
  detent,
  footer,
  hideHeader = false,
  hideDragHandle = false,
  disableDrag = false
}) {
  const isContentHeight = detent === "content-height";
  
  return (
    <Sheet 
      isOpen={isOpen} 
      onClose={onClose}
      snapPoints={!isContentHeight ? (snapPoints || [0, 0.95, 1]) : undefined}
      initialSnap={!isContentHeight ? 1 : undefined}
      detent={detent}
      disableDrag={disableDrag}
    >
      <Sheet.Container className="!rounded-t-[32px]">
        {!hideDragHandle && <Sheet.Header />}
        <Sheet.Content className="!h-auto max-h-screen">
          <div className="px-6 pb-8 flex flex-col max-h-[85vh] bg-white rounded-t-[32px]">
            {!hideHeader && (
              <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#443360] uppercase tracking-wider">{title}</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            )}

            <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar pr-1 custom-scrollbar-hide">
              {children}
            </div>
            
            {footer && (
              <div className="pt-6 pb-2">
                {footer}
              </div>
            )}
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
}
