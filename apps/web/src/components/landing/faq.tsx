import { FadeUp } from "@/components/shared/fade-up";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";

const faqs = [
  {
    question: "Do customers need to download an app?",
    answer:
      "No. Customers simply scan the QR code and order directly from their browser. No app or login required.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. Tichsy offers a free plan that you can use forever. No credit card or payment required to get started.",
  },
  {
    question: "How does billing work?",
    answer:
      "Tichsy works like a recharge system. You choose a plan and duration, pay once, and use it for that period. There are no automatic charges or hidden fees.",
  },
  {
    question: "Will I be charged automatically?",
    answer:
      "No. We do not store your card details and there are no automatic deductions. You only pay when you choose to purchase or renew a plan.",
  },
  {
    question: "What hardware do I need?",
    answer:
      "You can use any device with a web browser, such as a phone, tablet, or laptop. No special hardware is required.",
  },
  {
    question: "What happens when my plan ends?",
    answer:
      "Your account is downgraded to the free plan. Your data remains safe and can still be viewed, but some features may be limited.",
  },
  {
    question: "Can I accept payments through Tichsy?",
    answer:
      "Currently, payments are handled offline. Customers place orders through Tichsy, and you can collect payment directly using cash or your existing payment system then update the order status in the dashboard.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="container px-4 mx-auto pt-30">
      <FadeUp delay={0.2} duration={0.8} yOffset={40}>
        <div className="mx-auto mb-20 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl tracking-tighter font-geist bg-clip-text text-transparent mx-auto bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.55)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] lg:leading-tight max-w-4xl pb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto font-normal">
            Everything you need to know about Tichsy. If you still have
            questions, feel free to reach out.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="w-full"
          >
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base leading-tight font-medium hover:no-underline cursor-pointer transition-all hover:bg-muted px-2">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm px-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </FadeUp>
    </section>
  );
}
