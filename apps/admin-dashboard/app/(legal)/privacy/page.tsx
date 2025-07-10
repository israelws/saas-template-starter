import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - SAAS Admin Dashboard',
  description: 'Privacy Policy for SAAS Admin Dashboard',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <p className="text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to our Privacy Policy. Your privacy is critically important to us. We have a few fundamental principles:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>We are thoughtful about the personal information we ask you to provide.</li>
            <li>We store personal information for only as long as we have a reason to keep it.</li>
            <li>We aim for full transparency on how we gather, use, and share your personal information.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <p>
            We collect information about you when you provide it to us, when you use our services, and when other sources 
            provide it to us, as further described below.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">Information You Provide to Us</h3>
          <p>We collect information about you when you input it into the Services or otherwise provide it directly to us.</p>
          <ul className="list-disc ml-6 mt-2">
            <li><strong>Account Information:</strong> We collect information about you when you register for an account, 
            create or modify your profile, set preferences, sign-up for or make purchases.</li>
            <li><strong>Content:</strong> We collect and store content that you post, send, receive and share.</li>
            <li><strong>Customer Support:</strong> We collect information when you submit support requests.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">Information We Collect Automatically</h3>
          <ul className="list-disc ml-6 mt-2">
            <li><strong>Usage Information:</strong> We collect information about your activity on our services, 
            like service-related, diagnostic, and performance information.</li>
            <li><strong>Device Information:</strong> We collect information about your device, including device type, 
            operating system, unique device identifiers, and network information.</li>
            <li><strong>Location Information:</strong> We may derive your approximate location from your IP address.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Information</h2>
          <p>
            We use the information we collect in various ways, including to:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Provide, operate, and maintain our Services</li>
            <li>Improve, personalize, and expand our Services</li>
            <li>Understand and analyze how you use our Services</li>
            <li>Develop new products, services, features, and functionality</li>
            <li>Communicate with you for customer service, updates, and other purposes</li>
            <li>Process your transactions and manage your orders</li>
            <li>Send you emails</li>
            <li>Find and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
          <p>
            We may share information about you in the following ways:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li><strong>Your Consent:</strong> We share information about you when you give us consent to do so.</li>
            <li><strong>Service Providers:</strong> We share information with third-party vendors and service providers 
            that perform services on our behalf.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in 
            response to valid requests by public authorities.</li>
            <li><strong>Business Transfers:</strong> We may share or transfer information in connection with, or during 
            negotiations of, any merger, sale of company assets, financing, or acquisition.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to provide the services you have requested, 
            or for other legitimate purposes such as complying with our legal obligations, resolving disputes, 
            and enforcing our agreements. When we have no ongoing legitimate business need to process your personal 
            information, we will either delete or anonymize it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Security</h2>
          <p>
            We take security seriously and use administrative, technical, and physical safeguards to protect 
            your information. While we take reasonable precautions to protect your information, no security system 
            is impenetrable and we cannot guarantee the security of our systems 100%.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li><strong>Access:</strong> You can request access to the personal information we hold about you.</li>
            <li><strong>Update:</strong> You can update your information through your account settings.</li>
            <li><strong>Delete:</strong> You can request that we delete your personal information.</li>
            <li><strong>Portability:</strong> You can request a copy of your information in a machine-readable format.</li>
            <li><strong>Opt-out:</strong> You can opt-out of certain communications from us.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Service and hold certain information. 
            Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct 
            your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
          <p>
            Your information may be transferred to — and maintained on — computers located outside of your state, province, 
            country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
          <p>
            Our Service is not directed to children under 13 (or other age as required by local law), and we do not 
            knowingly collect personal information from children. If you learn that your child has provided us with 
            personal information without your consent, please contact us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <ul className="list-none mt-2">
            <li>Email: privacy@example.com</li>
            <li>Address: 123 Business St, Suite 100, City, State 12345</li>
            <li>Phone: (555) 123-4567</li>
          </ul>
        </section>
      </div>
    </div>
  )
}