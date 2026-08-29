import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      "Images are cached by canonical page URL and refresh automatically after 30 days. No manual refresh is required.",
  },
  {
    question: "What image format is used?",
    answer:
      "OG images are generated as high-quality JPEG files at 1200x630 pixels, the standard size for social media previews.",
  },
];

interface FAQProps {
  showCard?: boolean;
  className?: string;
}

export default function FAQ({ showCard = true, className = "" }: FAQProps) {
  const content = (
    <Accordion type="single" collapsible className={className}>
      {FAQS.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardDescription>
          Common questions about OG Images and our service.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
