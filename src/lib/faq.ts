export interface FAQ {
  question: string;
  answer: string;
}

export const FAQS: FAQ[] = [
  {
    question: "What is an OG Image?",
    answer:
      "An OG Image, or Open Graph Image, is a preview image that appears when you share a link to your website on social media. It helps your posts stand out with a visual summary of the page.",
  },
  {
    question: "How does the Free plan work?",
    answer:
      "The Free plan gives you 500 OG images per month for one website. Perfect for personal projects or trying out the service.",
  },
  {
    question: "What are the benefits of upgrading to Pro?",
    answer:
      "Pro plans offer higher limits (5,000 images/month or unlimited for yearly), unlimited websites, priority email support, and advanced analytics. Pro Yearly also includes custom branding options.",
  },
  {
    question: "What happens when I hit my plan limit?",
    answer:
      "New images won't be generated until your next billing cycle, but your existing ones stay available. You can upgrade to a higher plan anytime for more capacity.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your Pro subscription at any time. You'll continue to have access to Pro features until the end of your current billing period.",
  },
  {
    question: "How often are OG images refreshed?",
    answer:
      "Images are generated once per page and cached. You can manually refresh them from your dashboard if needed.",
  },
  {
    question: "What image format is used?",
    answer:
      "All OG images are generated as high-quality PNG files at 1200x630 pixels, the standard size for social media previews.",
  },
] as const;
