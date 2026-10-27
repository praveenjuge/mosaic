import { ChevronDownIcon, ChevronUpIcon } from "vadivam-react";

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

/**
 * Native `<details>` elements sharing a `name`, so opening one closes the
 * others. They work before the page's JavaScript loads and ship none of
 * their own.
 */
export default function FAQ() {
  return (
    <div className="flex w-full flex-col border-t">
      {FAQS.map((faq) => (
        <details
          key={faq.question}
          name="faq"
          className="group/faq not-last:border-b"
        >
          <summary className="focus-visible:border-ring focus-visible:ring-ring/50 relative flex cursor-pointer list-none items-start justify-between rounded-lg border border-transparent py-4 text-left text-base font-medium transition-all outline-none hover:underline focus-visible:ring-3 [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDownIcon
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none ml-auto size-4 shrink-0 group-open/faq:hidden"
            />
            <ChevronUpIcon
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none ml-auto hidden size-4 shrink-0 group-open/faq:inline"
            />
          </summary>
          <p className="text-muted-foreground pb-2.5 text-sm leading-relaxed">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
