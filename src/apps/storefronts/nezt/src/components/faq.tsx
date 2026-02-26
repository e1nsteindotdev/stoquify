import { DownChevron } from "./icons/down-chevron";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "api/convex";

export function FAQs() {
  const faqs = useQuery(api.settings.getFAQs) || [];

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-6  flex flex-col gap-4 lg:gap-8">
      <div className="flex justify-center">
        <p className="relative uppercase text-primary text-[35px] lg:text-[103px] font-display tracking-tighter inline">
          Questions fréquentes
          <span className="absolute font-display -left-8 lg:-left-18 lg:bottom-[22px] bottom-[8px] text-[19px] lg:text-[47px] text-black/20 font-bold hidden lg:inline tracking-[-0.06em]">
            {faqs.length.toString().padStart(2, "0")}
          </span>
        </p>
      </div>
      <div className="flex flex-col w-full border-1 border-white bg-white/40">
        {faqs.map((faq, index) => (
          <div key={faq._id}>
            <Question question={faq.question} answer={faq.answer} />
            {index < faqs.length - 1 && (
              <div className="h-[1px] w-full bg-white" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Question({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full justify-between py-3 px-4 hover:bg-white/20 transition-colors"
      >
        <p className="uppercase text-black text-[14px] lg:text-[18px] font-semibold font-inter text-left">
          {question}
        </p>
        <div
          className={`border-[1.5px] border-black px-1.5 py-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <DownChevron color={"black"} size={10} />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-3">
          <p className="text-black text-[12px] lg:text-[16px] font-inter">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}
