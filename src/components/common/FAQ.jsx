"use client"
import { useState } from "react"

export default function FAQ({title, description, faqs}) {
    const [openIndex, setOpenIndex] = useState(0)

    const toggle = (index) => {
        setOpenIndex(openIndex === index ? null : index)
    }


    return (
        <section className="w-full py-16 px-6">
            <div className="max-w-[1440px] mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-[28px] tracking-wide uppercase">{title}</h2>
                    <p className="text-gray-600 mt-3 max-w-[600px] mx-auto text-[14px] leading-[22px]">
                        {description}
                    </p>
                </div>

                <div>
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-300">

                        {/* QUESTION */}
                        <button
                            onClick={() => toggle(index)}
                            className="w-full flex justify-between items-center py-5 text-left"
                        >
                            <span className="text-[15px] tracking-wide">
                            {faq.question}
                            </span>

                            <span className="text-[20px]">
                            {openIndex === index ? "×" : "+"}
                            </span>
                        </button>

                        {/* ANSWER */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ${
                            openIndex === index ? "max-h-[200px] pb-5" : "max-h-0"
                            }`}
                        >
                            <p className="text-gray-600 text-[14px] leading-[22px]">
                            {faq.answer}
                            </p>
                        </div>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}