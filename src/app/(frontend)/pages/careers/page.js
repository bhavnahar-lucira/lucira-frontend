import React from "react";
import Link from "next/link";

export default function CareersPage() {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="full-page font-figtree">
        <div className="page-title mb-8">
          <h1 className="font-abhaya text-3xl font-semibold">Join The Lucira Team!</h1>
        </div>

        <div className="card bg-white shadow-sm border border-gray-200 rounded p-6 mb-6">
          <div className="card-text mb-4 text-gray-900">
            Are you all about fashion, e-commerce, and marketing? Do diamonds and exquisite gemstones steal your heart? If the answer’s a ‘Yes!’ then Lucira's just the place for you!
          </div>
          <div className="card-text text-gray-900">
            At <a href="https://www.lucirajewelry.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lucira Jewelry</a>, we’re dedicated to making our customers look stunning (it’s our name after all!) while redefining the jewelry game! If you think you've got what it takes to consistently outperform yourself and set new standards, then we’d love to hear from you!
          </div>
        </div>

        <div className="card bg-white shadow-sm border border-gray-200 rounded p-6 mb-6">
          <div className="font-abhaya card-title text-xl font-medium mb-4">How to apply?</div>
          <div className="card-text text-gray-900">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You can browse our job openings, find the ones that fit your expertise, and fill in the registration forms.
              </li>
              <li>
                No job openings? No worries! Drop an email at <a href="mailto:hr@lucirajewelry.com" className="text-blue-600 hover:underline">hr@lucirajewelry.com</a> and we’ll get back to you!
              </li>
            </ul>
          </div>
        </div>

        <div className="card bg-white shadow-sm border border-gray-200 rounded p-6 mb-6">
          <div className="font-abhaya card-title text-xl font-medium mb-4">But why us?</div>
          <div className="card-text text-gray-900">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>The Golden Standard:</strong> At Lucira Jewelry, we take excellence very seriously. We continuously raise the bar and redefine benchmarks - here, excellence is non-negotiable.
              </li>
              <li>
                <strong>Learning and Experimentation:</strong> We combine lifelong learning with continuous experimentation to validate our insights and consistently enhance ourselves.
              </li>
              <li>
                <strong>Perks and Benefits:</strong> Enjoy amazing employee discounts, competitive salaries and many more perks when you work with us!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}