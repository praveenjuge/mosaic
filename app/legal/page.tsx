import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Legal Information",
  description: "We take your privacy and data seriously.",
};

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>{metadata.title as string}</CardTitle>
        <CardDescription>{metadata.description}</CardDescription>
      </CardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>Last updated: June 7, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm prose-zinc dark:prose-invert">
            <p>
              At Mosaic, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, and protect your personal
              information when you use our services.
            </p>
            <h3>Information We Collect</h3>
            <p>
              We may collect personal information such as your name, email
              address, billing information, and usage data when you sign up for
              our services, make a purchase, or interact with our website or
              applications. This information may include:
            </p>
            <ul>
              <li>Contact information (name, email address, phone number)</li>
              <li>Billing information (payment method, billing address)</li>
              <li>
                Usage data (features used, pages visited, session duration)
              </li>
              <li>
                Technical information (IP address, device information, browser
                type)
              </li>
            </ul>
            <h3>Use of Information</h3>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li>To provide, maintain, and improve our services</li>
              <li>To process payments and fulfill orders</li>
              <li>To communicate with you about our services and updates</li>
              <li>
                To personalize your experience and provide relevant content
              </li>
              <li>To comply with legal obligations and enforce our policies</li>
            </ul>
            <h3>Data Security</h3>
            <p>
              We implement industry-standard security measures to protect your
              personal information from unauthorized access, disclosure, or
              misuse. These measures include:
            </p>
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
              processors, hosting providers, and analytics tools. These third
              parties are required to maintain the confidentiality and security
              of your information and are prohibited from using it for any other
              purpose.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <CardDescription>Last updated: June 7, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm prose-zinc dark:prose-invert">
            <p>
              These Terms of Service govern your use of our services and
              products.
            </p>
            <h3>User Accounts</h3>
            <p>
              You may need to create an account to access certain features of
              our services. You are responsible for maintaining the
              confidentiality of your account credentials and for any activities
              that occur under your account. You agree to provide accurate and
              complete information when creating an account and to update your
              information as necessary to keep it accurate and complete.
            </p>
            <h3>Intellectual Property</h3>
            <p>
              All content and materials provided through our services are owned
              by Mosaic or our licensors and are protected by intellectual
              property laws. You may not modify, reproduce, distribute, or
              create derivative works based on our content without our prior
              written consent.
            </p>
            <h3>Acceptable Use</h3>
            <p>
              You agree to use our services in compliance with all applicable
              laws and regulations. You may not use our services for any
              unlawful or prohibited purposes, including but not limited to:
            </p>
            <ul>
              <li>
                Transmitting or uploading any illegal, harmful, or offensive
                content
              </li>
              <li>Engaging in any fraudulent or deceptive activities</li>
              <li>Interfering with or disrupting our services or systems</li>
              <li>Violating the intellectual property rights of others</li>
            </ul>
            <h3>Limitation of Liability</h3>
            <p>
              Mosaic shall not be liable for any indirect, incidental, special,
              or consequential damages arising out of or in connection with the
              use of our services. Our total liability to you for any claims
              arising from or related to these Terms of Service shall not exceed
              the amount paid by you for the services in the 12 months preceding
              the claim.
            </p>
            <h3>Termination</h3>
            <p>
              We reserve the right to terminate or suspend your access to our
              services at any time, without notice, for any reason, including
              but not limited to a violation of these Terms of Service.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle id="refund-policy">Refund Policy</CardTitle>
          <CardDescription>Last updated: June 7, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm prose-zinc dark:prose-invert">
            <h3>Refunds</h3>
            <p>
              At Mosaic, we strive to provide the best possible service to our
              users. However, we understand that sometimes things don't go as
              planned. This Refund Policy outlines the conditions under which
              refunds may be granted for our SaaS (Software as a Service)
              products and services.
            </p>

            <h3>Eligibility for Refunds</h3>
            <p>Refunds may be issued in the following cases:</p>
            <ul>
              <li>
                <strong>Service Disruption:</strong> If our services are
                unavailable or significantly disrupted due to technical issues
                on our end for an extended period.
              </li>
              <li>
                <strong>Billing Errors:</strong> If you have been charged
                incorrectly or for services you did not use.
              </li>
              <li>
                <strong>Unsatisfactory Service:</strong> If you are unsatisfied
                with our services within the first 30 days of your subscription.
              </li>
            </ul>

            <h3>Requesting a Refund</h3>
            <p>
              To request a refund, please contact our support team at{" "}
              <a href="mailto:hello@praveenjuge.com">hello@praveenjuge.com</a>{" "}
              with the following information:
            </p>
            <ul>
              <li>
                <strong>Account Details:</strong> Your account username or email
                address associated with your Mosaic account.
              </li>
              <li>
                <strong>Reason for Refund:</strong> A brief description of the
                reason for the refund request.
              </li>
              <li>
                <strong>Transaction Information:</strong> Details of the
                transaction for which you are requesting a refund, including the
                date and amount charged.
              </li>
            </ul>

            <h3>Processing Refunds</h3>
            <p>
              Upon receiving your refund request, our support team will review
              it and respond within 5-7 business days. If your refund request is
              approved, the refund will be processed to the original payment
              method within 10-15 business days.
            </p>
            <p>
              Please note that processing times may vary depending on your
              financial institution.
            </p>

            <h3>Non-Refundable Situations</h3>
            <p>Refunds will not be issued in the following cases:</p>
            <ul>
              <li>
                <strong>Usage Beyond 30 Days:</strong> If more than 30 days have
                passed since your subscription started.
              </li>
              <li>
                <strong>Violation of Terms:</strong> If your account has been
                terminated due to a violation of our Terms of Service.
              </li>
              <li>
                <strong>Change of Mind:</strong> If you simply change your mind
                after the subscription or purchase.
              </li>
            </ul>

            <h3>Contact Us</h3>
            <p>
              If you have any questions or concerns about our Refund Policy,
              please do not hesitate to contact us at{" "}
              <a href="mailto:hello@praveenjuge.com">hello@praveenjuge.com</a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
