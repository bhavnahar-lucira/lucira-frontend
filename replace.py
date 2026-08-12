import re

with open('src/app/(checkout-flow)/(protected)/checkout/payment/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new mobile block
new_mobile_block = '''            {!isDesktop && (
              <div className="space-y-6 px-4">
                <div className="flex items-center gap-4 py-4 px-2 border-b border-zinc-100">
                  <div className="w-10 h-10 rounded-full border border-[#EBE1D7] flex items-center justify-center shrink-0 bg-[#FDFBF9]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3D2B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-figtree font-bold text-[0.875rem] text-black truncate">
                      Delivering to {customer?.name || user?.name || "Customer"}
                    </p>
                    <p className="font-figtree text-[0.75rem] text-black/60 truncate mt-0.5">
                      {isPickup ? checkoutSelection?.selectedStore?.address : formatAddressPreview(selectedAddress)}
                    </p>
                  </div>
                  <Link prefetch={false} href={shipToChangeHref} className="font-figtree font-semibold text-[0.75rem] text-black hover:underline shrink-0">
                    Change
                  </Link>
                </div>

                <PriceProtectionTimer onInfoClick={() => setShowPriceProtection(true)} className="-mt-2" />

                <div className="pt-2">
                  <CheckoutSummary
                    showItems={false}
                    showBreakdown={false}
                    showContact={false}
                    isSilverPendantClaimed={isSilverPendantClaimed}
                    onToggleSilverPendant={() => setIsSilverPendantClaimed(!isSilverPendantClaimed)}
                    mobilePaymentCoinsTheme={true}
                    onApplyCoinsWarning={(proceed) => {
                      setCoinsProceedAction(() => proceed);
                      setShowCoinsNudge(true);
                    }}
                  />
                </div>

                <div ref={summaryRef} className="scroll-mt-16 bg-white pt-2">
                  <CheckoutSummary
                    showPoints={false}
                    showContact={false}
                    isSilverPendantClaimed={isSilverPendantClaimed}
                    onToggleSilverPendant={() => setIsSilverPendantClaimed(!isSilverPendantClaimed)}
                    showSilverPendantOffer={false}
                    breakdownRef={summaryBreakdownRef}
                  />
                </div>

                {paymentGateways.length > 1 && (
                  <div className="space-y-4 pt-2">
                    <h2 className="font-figtree font-medium text-black uppercase tracking-wide text-[0.875rem]">PAYMENT OPTIONS</h2>
                    <RadioGroup value={selectedPaymentGateway} onValueChange={setSelectedPaymentGateway} className="space-y-3">
                      {paymentGateways.map((gateway) => (
                        <div key={gateway.id} className="relative">
                          <Label 
                            htmlFor={m-opt-}
                            className={lock p-4 rounded-[6px] border transition-colors cursor-pointer \}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-figtree font-medium text-black text-[0.875rem]">
                                  {gateway.id === "razorpay" ? \Full Payment ₹\\ : \Partial COD ₹\\}
                                </h4>
                                <p className="font-figtree text-[0.75rem] text-black/70 mt-1">
                                  {gateway.id === "razorpay" ? "Complete your Purchase with Ease" : \Pay Remaining ₹\ at Delivery\}
                                </p>
                              </div>
                              <RadioGroupItem value={gateway.id} id={m-opt-} className="border-[#3D2B28] text-[#5A413F]" />
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}'''

start_marker = "{!isDesktop && ("
end_marker = "{/* DESKTOP ONLY ORDER */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_mobile_block + "\n\n            " + content[end_idx:]
    with open('src/app/(checkout-flow)/(protected)/checkout/payment/page.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Mobile section replaced successfully.")
else:
    print("Markers not found.")
