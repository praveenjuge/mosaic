import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 py-4 md:py-10">
      <CardHeader className="p-0">
        <CardTitle>Privacy & Terms</CardTitle>
        <CardDescription>
          We take your privacy and data seriously.
        </CardDescription>
      </CardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>Last updated: June 7, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              At Mosaic, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, and protect your personal
              information when you use our services.
            </p>
            <h3 className="text-xl font-semibold">Information We Collect</h3>
            <p>
              We may collect personal information such as your name, email
              address, billing information, and usage data when you sign up for
              our services, make a purchase, or interact with our website or
              applications. This information may include:
            </p>
            <ul className="list-disc pl-5">
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
            <h3 className="text-xl font-semibold">Use of Information</h3>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-5">
              <li>To provide, maintain, and improve our services</li>
              <li>To process payments and fulfill orders</li>
              <li>To communicate with you about our services and updates</li>
              <li>
                To personalize your experience and provide relevant content
              </li>
              <li>To comply with legal obligations and enforce our policies</li>
            </ul>
            <h3 className="text-xl font-semibold">Data Security</h3>
            <p>
              We implement industry-standard security measures to protect your
              personal information from unauthorized access, disclosure, or
              misuse. These measures include:
            </p>
            <ul className="list-disc pl-5">
              <li>Encryption of data in transit and at rest</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular security audits and vulnerability testing</li>
              <li>Secure data storage and backup procedures</li>
            </ul>
            <h3 className="text-xl font-semibold">Third-Party Services</h3>
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
          <div className="space-y-4">
            <p>
              Welcome to Mosaic! These Terms of Service govern your use of our
              services and products.
            </p>
            <h3 className="text-xl font-semibold">User Accounts</h3>
            <p>
              You may need to create an account to access certain features of
              our services. You are responsible for maintaining the
              confidentiality of your account credentials and for any activities
              that occur under your account. You agree to provide accurate and
              complete information when creating an account and to update your
              information as necessary to keep it accurate and complete.
            </p>
            <h3 className="text-xl font-semibold">Intellectual Property</h3>
            <p>
              All content and materials provided through our services are owned
              by Mosaic or our licensors and are protected by intellectual
              property laws. You may not modify, reproduce, distribute, or
              create derivative works based on our content without our prior
              written consent.
            </p>
            <h3 className="text-xl font-semibold">Acceptable Use</h3>
            <p>
              You agree to use our services in compliance with all applicable
              laws and regulations. You may not use our services for any
              unlawful or prohibited purposes, including but not limited to:
            </p>
            <ul className="list-disc pl-5">
              <li>
                Transmitting or uploading any illegal, harmful, or offensive
                content
              </li>
              <li>Engaging in any fraudulent or deceptive activities</li>
              <li>Interfering with or disrupting our services or systems</li>
              <li>Violating the intellectual property rights of others</li>
            </ul>
            <h3 className="text-xl font-semibold">Limitation of Liability</h3>
            <p>
              Mosaic shall not be liable for any indirect, incidental, special,
              or consequential damages arising out of or in connection with the
              use of our services. Our total liability to you for any claims
              arising from or related to these Terms of Service shall not exceed
              the amount paid by you for the services in the 12 months preceding
              the claim.
            </p>
            <h3 className="text-xl font-semibold">Termination</h3>
            <p>
              We reserve the right to terminate or suspend your access to our
              services at any time, without notice, for any reason, including
              but not limited to a violation of these Terms of Service.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
