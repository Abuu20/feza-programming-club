import React from 'react';
import { Helmet } from 'react-helmet-async';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-primary-600 mb-3">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

const PrivacyPolicyPage = () => {
  return (
    <div className="container-custom py-12 max-w-3xl mx-auto">
      <Helmet>
        <title>Privacy Policy | Feza Programming Club</title>
        <meta
          name="description"
          content="How Feza Programming Club collects, uses, and protects member information."
        />
      </Helmet>

      <h1 className="text-4xl font-bold text-primary-600 mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-10">Last updated: August 2026</p>

      <Section title="What we collect">
        <p>
          When you register as a member, we collect your name, email address, and any details
          you choose to share (such as a bio or profile photo). When you send us a message
          through the Contact page, we collect the information you submit in that form.
        </p>
      </Section>

      <Section title="How we use it">
        <p>
          We use member information to run club activities, keep the Members and Gallery pages
          up to date, verify who is registering, and communicate about announcements, activities,
          and club business. We do not sell or rent member information to anyone.
        </p>
      </Section>

      <Section title="Who can see it">
        <p>
          Your name and profile appear on the public Members page as part of showcasing our club.
          Contact form messages and account details are only visible to club administrators.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can ask us to update or remove your information at any time by emailing{' '}
          <a href="mailto:fezaclub@gmail.com" className="text-primary-600 hover:underline">
            fezaclub@gmail.com
          </a>
          . Members can also update most of their own details from their student dashboard.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          If anything here is unclear, reach out any time on the{' '}
          <a href="/contact" className="text-primary-600 hover:underline">Contact page</a>.
        </p>
      </Section>
    </div>
  );
};

export default PrivacyPolicyPage;
