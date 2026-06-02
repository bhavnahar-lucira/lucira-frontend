import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    value: "faq-1",
    trigger: "What is Vault of Dreams?",
    content:
      "Vault of Dreams is Lucira Jewelry's savings scheme where you pay 9 monthly installments and Lucira adds the 10th installment, helping you plan your jewelry purchase with ease.",
  },
  {
    value: "faq-2",
    trigger: "How does the 10th installment benefit work?",
    content:
      "After completing all 9 installments on time, Lucira contributes one additional installment amount, which is added to your redeemable balance.",
  },
  {
    value: "faq-3",
    trigger: "Who can enroll in Vault of Dreams?",
    content:
      "Anyone aged 18 or above residing in India can enroll. All payments must be made in Indian Rupees (INR).",
  },
  {
    value: "faq-4",
    trigger: "What is the installment amount range?",
    content:
      "You can choose a fixed monthly installment between ₹2,000 and ₹19,000 at the time of enrollment.",
  },
  {
    value: "faq-5",
    trigger: "Can I change my installment amount later?",
    content:
      "No. The installment amount selected during enrollment remains fixed for the entire scheme duration.",
  },
  {
    value: "faq-6",
    trigger: "What payment methods are accepted?",
    content:
      "Installments can be paid via Credit Card, Debit Card, UPI, Cash, or Post-Dated Cheques, subject to availability.",
  },
  {
    value: "faq-7",
    trigger: "Is there a grace period for late payments?",
    content:
      "Yes. A grace period of up to 7 days is allowed for delayed installment payments.",
  },
  {
    value: "faq-8",
    trigger: "What happens if I miss or delay an installment?",
    content:
      "Payments delayed beyond the grace period may reduce your scheme benefits, including Lucira's 10th installment. Delays of 30 days or more will result in automatic cancellation of the scheme.",
  },
  {
    value: "faq-9",
    trigger: "Can I close the scheme before completion?",
    content:
      "Yes. You may opt for pre-closure after completing at least 6 months, but with reduced or no benefits, as applicable.",
  },
  {
    value: "faq-10",
    trigger: "When does the scheme mature?",
    content:
      "The scheme matures after successful completion of all 9 installments as per the scheme terms.",
  },
  {
    value: "faq-11",
    trigger: "How long do I have to redeem my Vault of Dreams amount?",
    content:
      "You must redeem your amount within 90 days from the date of scheme maturity.",
  },
  {
    value: "faq-12",
    trigger: "Where can I redeem the scheme amount?",
    content:
      "The amount can be redeemed only against purchases of Lucira Jewelry products, online or at select offline stores.",
  },
  {
    value: "faq-13",
    trigger: "Are making charges and taxes applicable?",
    content:
      "Yes. Making charges, taxes, and other applicable costs will be charged as per prevailing rates at the time of purchase.",
  },
  {
    value: "faq-14",
    trigger: "Can I add a nominee to my account?",
    content:
      "Yes. You can add or update a nominee at the time of enrollment or later through your account.",
  },
  {
    value: "faq-15",
    trigger: "What happens in case of the customer's demise?",
    content:
      "The nominee can redeem the scheme amount, subject to verification and Lucira Jewelry's policies.",
  },
  {
    value: "faq-16",
    trigger: "What happens if my scheme is cancelled?",
    content:
      "If the scheme is cancelled, the amount paid till date (excluding benefits) will be refunded or credited to your Lucira Wallet as per policy.",
  },
  {
    value: "faq-17",
    trigger: "What is the Lucira Wallet?",
    content:
      "Lucira Wallet credits can be used only for purchases on Lucira Jewelry platforms and cannot be transferred or redeemed for cash.",
  },
  {
    value: "faq-18",
    trigger: "What should I do if my payment fails?",
    content:
      "You can retry the payment without penalty. Lucira Jewelry is not responsible for failures caused by banks or payment gateways.",
  },
  {
    value: "faq-19",
    trigger: "Can I track my payments and balance?",
    content:
      "Yes. All transactions are recorded in a digital passbook and synced across Lucira Jewelry systems.",
  },
  {
    value: "faq-20",
    trigger: "Can Vault of Dreams be combined with other offers?",
    content:
      "No. Vault of Dreams benefits are non-transferable and cannot be combined with other offers unless stated otherwise.",
  },
  {
    value: "faq-21",
    trigger: "Can Lucira Jewelry change or discontinue the scheme?",
    content:
      "Lucira Jewelry may modify, suspend, or discontinue the scheme at any time, as permitted by law. Existing enrollments will follow the terms applicable at enrollment.",
  },
];

export function SchemeFaq() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Accordion
        type="single"
        collapsible
        className="w-full rounded-lg border"
        defaultValue="faq-1"
      >
        {items.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger>{item.trigger}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
