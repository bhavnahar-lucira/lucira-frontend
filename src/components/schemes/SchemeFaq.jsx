"use client";

import { useState } from "react";

const items = [
  {
    question: "What is Vault of Dreams?",
    answer:
      "Vault of Dreams is Lucira Jewelry's savings scheme where you pay 9 monthly installments and Lucira adds the 10th installment, helping you plan your jewelry purchase with ease.",
  },
  {
    question: "How does the 10th installment benefit work?",
    answer:
      "After completing all 9 installments on time, Lucira contributes one additional installment amount, which is added to your redeemable balance.",
  },
  {
    question: "Who can enroll in Vault of Dreams?",
    answer:
      "Anyone aged 18 or above residing in India can enroll. All payments must be made in Indian Rupees (INR).",
  },
  {
    question: "What is the installment amount range?",
    answer:
      "You can choose a fixed monthly installment between ₹2,000 and ₹19,000 at the time of enrollment.",
  },
  {
    question: "Can I change my installment amount later?",
    answer:
      "No. The installment amount selected during enrollment remains fixed for the entire scheme duration.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "Installments can be paid via Credit Card, Debit Card, UPI, Cash, or Post-Dated Cheques, subject to availability.",
  },
  {
    question: "Is there a grace period for late payments?",
    answer:
      "Yes. A grace period of up to 7 days is allowed for delayed installment payments.",
  },
  {
    question: "What happens if I miss or delay an installment?",
    answer:
      "Payments delayed beyond the grace period may reduce your scheme benefits, including Lucira's 10th installment. Delays of 30 days or more will result in automatic cancellation of the scheme.",
  },
  {
    question: "Can I close the scheme before completion?",
    answer:
      "Yes. You may opt for pre-closure after completing at least 6 months, but with reduced or no benefits, as applicable.",
  },
  {
    question: "When does the scheme mature?",
    answer:
      "The scheme matures after successful completion of all 9 installments as per the scheme terms.",
  },
  {
    question: "How long do I have to redeem my Vault of Dreams amount?",
    answer:
      "You must redeem your amount within 90 days from the date of scheme maturity.",
  },
  {
    question: "Where can I redeem the scheme amount?",
    answer:
      "The amount can be redeemed only against purchases of Lucira Jewelry products, online or at select offline stores.",
  },
  {
    question: "Are making charges and taxes applicable?",
    answer:
      "Yes. Making charges, taxes, and other applicable costs will be charged as per prevailing rates at the time of purchase.",
  },
  {
    question: "Can I add a nominee to my account?",
    answer:
      "Yes. You can add or update a nominee at the time of enrollment or later through your account.",
  },
  {
    question: "What happens in case of the customer's demise?",
    answer:
      "The nominee can redeem the scheme amount, subject to verification and Lucira Jewelry's policies.",
  },
  {
    question: "What happens if my scheme is cancelled?",
    answer:
      "If the scheme is cancelled, the amount paid till date (excluding benefits) will be refunded or credited to your Lucira Wallet as per policy.",
  },
  {
    question: "What is the Lucira Wallet?",
    answer:
      "Lucira Wallet credits can be used only for purchases on Lucira Jewelry platforms and cannot be transferred or redeemed for cash.",
  },
  {
    question: "What should I do if my payment fails?",
    answer:
      "You can retry the payment without penalty. Lucira Jewelry is not responsible for failures caused by banks or payment gateways.",
  },
  {
    question: "Can I track my payments and balance?",
    answer:
      "Yes. All transactions are recorded in a digital passbook and synced across Lucira Jewelry systems.",
  },
  {
    question: "Can Vault of Dreams be combined with other offers?",
    answer:
      "No. Vault of Dreams benefits are non-transferable and cannot be combined with other offers unless stated otherwise.",
  },
  {
    question: "Can Lucira Jewelry change or discontinue the scheme?",
    answer:
      "Lucira Jewelry may modify, suspend, or discontinue the scheme at any time, as permitted by law. Existing enrollments will follow the terms applicable at enrollment.",
  },
];

export function SchemeFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0">
      {items.map((item, index) => (
        <div key={index} className="border-b border-gray-200">
          {/* QUESTION */}
          <button
            onClick={() => toggle(index)}
            className="w-full flex justify-between items-center py-6 text-left group transition-all duration-300 cursor-pointer"
          >
            <span className={`text-[15px] md:text-[16px] tracking-wide font-medium transition-colors duration-300 ${openIndex === index ? "text-[#5a413f]" : "text-gray-900 group-hover:text-[#5a413f]"}`}>
              {item.question}
            </span>

            <span className={`text-[24px] font-light transition-transform duration-300 ${openIndex === index ? "rotate-0 text-[#5a413f]" : "text-gray-400 group-hover:text-[#5a413f]"}`}>
              {openIndex === index ? "×" : "+"}
            </span>
          </button>

          {/* ANSWER */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              openIndex === index ? "max-h-[500px] pb-6 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <p className="text-gray-600 text-[14px] md:text-[15px] leading-[24px] max-w-4xl">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
