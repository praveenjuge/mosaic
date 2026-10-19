import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    question: "What is an OG Image?",
    answer:
      "An OG Image, or Open Graph Image, is a preview image that appears when you share a link to your website on social media. It helps your posts stand out with a visual summary of the page.",
  },
  {
    question: "How does the Free plan work?",
    answer:
      "The Free plan lets you save unlimited websites and use Mosaic's automatic shared OG image cache. There is no verification or signing setup.",
  },
  {
    question: "What are the benefits of upgrading to Pro?",
    answer:
      "Pro plans add priority email support and advanced features. The shared OG image cache works the same across plans, so your metadata URLs stay simple.",
  },
  {
    question: "What happens during heavy traffic?",
    answer:
      "Mosaic protects the service with daily generation budgets. If a budget is temporarily exhausted, it serves an existing cached image or a safe fallback instead of breaking your social preview.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your Pro subscription at any time. You'll continue to have access to Pro features until the end of your current billing period.",
  },
  {
    question: "How often are OG images refreshed?",
    answer:
      "Images are cached by canonical page URL and refresh automatically after 30 days. To update one sooner, choose Regenerate next to its image on the dashboard, or Regenerate images in a website's menu to reset every page.",
  },
  {
    question: "What image format is used?",
    answer:
      "OG images are JPEG screenshots taken at 1560×819 pixels, the 1.91:1 shape social networks use for link previews.",
  },
];

export default function FAQ() {
  return (
    <Accordion type="single" collapsible className="border-t">
      {FAQS.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="py-4 text-base">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
