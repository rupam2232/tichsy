import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion";

const faqs = [
  {
    question:
      "Do customers need to download an app to use the QR ordering system?",
    answer:
      "No, customers can simply scan the QR code with their phone's camera and order directly from their browser. No app download is required.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes, we offer a 7-day free trial so you can explore all the features before committing to a plan.",
  },
  {
    question: "What hardware do I need?",
    answer:
      "You can use any device with a web browser, including tablets, laptops, and smartphones. No proprietary hardware is required.",
  },
  {
    question:
      "Are there limits on the number of restaurants or tables I can manage?",
    answer:
      "It depends on your subscription plan. For details, please visit our pricing page.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer:
      "Yes, you can cancel your subscription at any time from your account billing page.",
  },
  {
    question: "Can I process payments for orders through the app?",
    answer:
      "Currently, we do not process payments within the app. You will need to collect payments directly from customers (e.g., via cash or your existing card terminal).",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="container mx-auto px-4 pb-20">
      <div className="mx-auto max-w-4xl">
        <h4 className="text-3xl lg:text-5xl lg:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium text-black dark:text-white">
          Frequently Asked Questions
        </h4>
        <p className="text-lg lg:text-lg max-w-2xl my-4 mb-10 mx-auto text-neutral-500 text-center font-normal dark:text-neutral-300">
          Answers to common questions about Tichsy and its features. If you have
          any other questions, please don&apos;t hesitate to contact us.
        </p>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-md font-normal hover:no-underline cursor-pointer transition-all hover:bg-muted px-2">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base px-2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
