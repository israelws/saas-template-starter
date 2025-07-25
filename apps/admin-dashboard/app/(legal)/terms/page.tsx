import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - SAAS Admin Dashboard',
  description: 'Terms of Service for SAAS Admin Dashboard',
};

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <p className="text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing and using this service, you accept and agree to be bound by the terms and
            provision of this agreement. If you do not agree to abide by the above, please do not
            use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or
            software) on our platform for personal, non-commercial transitory viewing only. This is
            the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>modify or copy the materials;</li>
            <li>
              use the materials for any commercial purpose, or for any public display (commercial or
              non-commercial);
            </li>
            <li>
              attempt to decompile or reverse engineer any software contained on our platform;
            </li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>
              transfer the materials to another person or "mirror" the materials on any other
              server.
            </li>
          </ul>
          <p className="mt-2">
            This license shall automatically terminate if you violate any of these restrictions and
            may be terminated by us at any time. Upon terminating your viewing of these materials or
            upon the termination of this license, you must destroy any downloaded materials in your
            possession whether in electronic or printed format.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
          <p>
            To use certain features of our service, you must register for an account. When you
            register for an account, you agree to:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>provide accurate, current, and complete information</li>
            <li>maintain and update your information to keep it accurate, current, and complete</li>
            <li>maintain the security of your account credentials</li>
            <li>accept all risks of unauthorized access to your account</li>
            <li>immediately notify us of any unauthorized use of your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Privacy Policy</h2>
          <p>
            Your use of our service is also governed by our Privacy Policy. Please review our
            Privacy Policy, which also governs the Site and informs users of our data collection
            practices.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
          <p>
            In addition to other prohibitions as set forth in the Terms of Service, you are
            prohibited from using the site or its content:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>
              for any unlawful purpose or to solicit others to perform or participate in any
              unlawful acts;
            </li>
            <li>
              to violate any international, federal, provincial, or state regulations, rules, laws,
              or local ordinances;
            </li>
            <li>
              to infringe upon or violate our intellectual property rights or the intellectual
              property rights of others;
            </li>
            <li>
              to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or
              discriminate;
            </li>
            <li>to submit false or misleading information;</li>
            <li>to upload or transmit viruses or any other type of malicious code;</li>
            <li>to interfere with or circumvent the security features of the Service;</li>
            <li>
              to engage in any other conduct that restricts or inhibits anyone's use or enjoyment of
              the Service.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
          <p>If you purchase a subscription to our service:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>
              You agree to pay all fees or charges to your account based on our pricing and billing
              terms;
            </li>
            <li>You are responsible for providing valid payment information;</li>
            <li>You authorize us to charge your payment method for all fees;</li>
            <li>
              If payment is not received, we may suspend or terminate your access to the service.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Disclaimer</h2>
          <p>
            The materials on our platform are provided on an 'as is' basis. We make no warranties,
            expressed or implied, and hereby disclaim and negate all other warranties including,
            without limitation, implied warranties or conditions of merchantability, fitness for a
            particular purpose, or non-infringement of intellectual property or other violation of
            rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitations</h2>
          <p>
            In no event shall our company or its suppliers be liable for any damages (including,
            without limitation, damages for loss of data or profit, or due to business interruption)
            arising out of the use or inability to use the materials on our platform, even if we or
            our authorized representative has been notified orally or in writing of the possibility
            of such damage. Because some jurisdictions do not allow limitations on implied
            warranties, or limitations of liability for consequential or incidental damages, these
            limitations may not apply to you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the Service immediately,
            without prior notice or liability, under our sole discretion, for any reason whatsoever
            and without limitation, including but not limited to a breach of the Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any
            time. If a revision is material, we will provide at least 30 days notice prior to any
            new terms taking effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us at:</p>
          <ul className="list-none mt-2">
            <li>Email: legal@example.com</li>
            <li>Address: 123 Business St, Suite 100, City, State 12345</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
