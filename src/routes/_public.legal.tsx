import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildSeoMeta } from "@/lib/seo";
import { getOgImageUrl } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_public/legal")({
  head: () =>
    buildSeoMeta({
      title: "Legal Information",
      description: "We take your privacy and data seriously.",
      image: getOgImageUrl("legal"),
      path: "/legal",
    }),
  component: LegalPage,
});

function Prose({ children }: { children: ReactNode }) {
  return <div className="prose prose-sm prose-zinc dark:prose-invert">{children}</div>;
}

function LegalPage() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>Legal Information</CardTitle>
        <CardDescription>We take your privacy and data seriously.</CardDescription>
      </CardHeader>

      <Card id="privacy-policy">
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>Last updated: June 7, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <Prose>
            <p>
              This Privacy Policy explains how we collect, use, and protect your
              personal information when you use our services.
            </p>
            <h3>Information We Collect</h3>
            <p>
              We may collect personal information such as your name, email address,
              billing information, and usage data when you sign up for our services,
              make a purchase, or interact with our website or applications.
            </p>
            <ul>
              <li>Contact information (name, email address, phone number)</li>
              <li>Billing information (payment method, billing address)</li>
              <li>Usage data (features used, pages visited, session duration)</li>
              <li>Technical information (IP address, device information, browser type)</li>
            </ul>
            <h3>Use of Information</h3>
            <ul>
              <li>To provide, maintain, and improve our services</li>
              <li>To process payments and fulfill orders</li>
              <li>To communicate with you about our services and updates</li>
              <li>To personalize your experience and provide relevant content</li>
              <li>To comply with legal obligations and enforce our policies</li>
            </ul>
            <h3>Data Security</h3>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security audits and vulnerability testing</li>
              <li>Secure data storage and backup procedures</li>
            </ul>
            <h3>Third-Party Services</h3>
            <p>
              We may share your personal information with third-party service
              providers who assist us in operating our services, such as payment
              processors, hosting providers, and analytics tools.
            </p>
            <h3>Your Rights</h3>
            <p>
              You have the right to access, correct, or delete your personal
              information. To exercise these rights, contact us at
              {" "}
              <a href="mailto:hello@praveenjuge.com">hello@praveenjuge.com</a>.
            </p>
            <h3>Data Retention</h3>
            <p>
              We retain your personal information for as long as necessary to
              provide our services and comply with legal obligations.
            </p>
            <h3>International Data Transfers</h3>
            <p>
              Your information may be transferred to and processed in countries
              other than your own, with appropriate safeguards in place.
            </p>
          </Prose>
        </CardContent>
      </Card>

      <Card id="terms-of-service">
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <CardDescription>Last updated: June 7, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <Prose>
            <p>These Terms of Service govern your use of our services and products.</p>
            <h3>User Accounts</h3>
            <p>
              You may need to create an account to access certain features of our
              services. You are responsible for maintaining the confidentiality of
              your account credentials and for activities that occur under your
              account.
            </p>
            <h3>Intellectual Property</h3>
            <p>
              All content and materials provided through our services are owned by
              Mosaic or our licensors and are protected by intellectual property laws.
            </p>
            <h3>Acceptable Use</h3>
            <ul>
              <li>Transmitting or uploading illegal, harmful, or offensive content</li>
              <li>Engaging in fraudulent or deceptive activities</li>
              <li>Interfering with or disrupting our services or systems</li>
              <li>Violating the intellectual property rights of others</li>
            </ul>
            <h3>Limitation of Liability</h3>
            <p>
              Mosaic shall not be liable for indirect, incidental, special, or
              consequential damages arising out of or in connection with the use of
              our services.
            </p>
            <h3>Termination</h3>
            <p>
              We reserve the right to terminate or suspend access to our services at
              any time for violations of these Terms of Service.
            </p>
            <h3>Subscription Terms and Pricing</h3>
            <p>
              Our services are available on a subscription basis. Pricing and terms
              may change over time.
            </p>
            <h3>User-Generated Content</h3>
            <p>
              You are responsible for any content you create or upload to our
              services, and you grant us the license needed to operate the service.
            </p>
            <h3>Age Restrictions</h3>
            <p>
              Our services are not intended for individuals under the age of 18.
            </p>
          </Prose>
        </CardContent>
      </Card>

      <Card id="refund-policy">
        <CardHeader>
          <CardTitle>Refund Policy</CardTitle>
          <CardDescription>Last updated: June 7, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <Prose>
            <h3>Refunds</h3>
            <p>
              At Mosaic, we strive to provide the best possible service. Refunds may
              be granted when services are significantly disrupted, billed
              incorrectly, or unsatisfactory within the first 30 days.
            </p>
            <h3>Requesting a Refund</h3>
            <p>
              To request a refund, contact
              {" "}
              <a href="mailto:hello@praveenjuge.com">hello@praveenjuge.com</a>
              {" "}
              with your account details, the reason for the request, and the related
              transaction information.
            </p>
            <h3>Processing Refunds</h3>
            <p>
              Approved refund requests are typically processed within 10-15 business
              days to the original payment method.
            </p>
          </Prose>
        </CardContent>
      </Card>
    </div>
  );
}
