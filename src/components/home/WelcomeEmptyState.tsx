import { useWebsiteActions } from "@/components/websites/use-website-actions";
import { WebsiteUrlForm } from "@/components/websites/website-url-form";
import { useState } from "react";

const steps = [
  "Add your website's hostname below.",
  "Mosaic screenshots your home page right away.",
  "Copy the meta tags into your pages' <head>.",
];

export default function WelcomeEmptyState() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveWebsite } = useWebsiteActions();

  const handleSubmit = async (url: string) => {
    setIsSubmitting(true);

    try {
      await saveWebsite({ url });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-2xl border p-6 shadow-sm md:p-8">
        <span className="bg-brand-muted text-brand mb-5 inline-flex rounded-full px-2.5 py-1 text-xs font-medium">
          Getting started
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Mosaic
        </h1>
        <p className="text-muted-foreground mt-2 text-sm text-balance">
          Generate beautiful Open Graph images for your websites automatically.
          Add your first website to get started.
        </p>
        <ol className="mt-6 flex flex-col gap-2.5">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground grid size-6 shrink-0 place-items-center rounded-full border font-mono text-xs">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-6 border-t pt-6">
          <WebsiteUrlForm
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            submitLabel="Add Website & Generate OG Images"
          />
        </div>
      </div>
    </div>
  );
}
