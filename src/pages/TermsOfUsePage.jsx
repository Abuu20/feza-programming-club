import React from 'react';
import { Helmet } from 'react-helmet-async';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-primary-600 mb-3">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </div>
);

const TermsOfUsePage = () => {
  return (
    <div className="container-custom py-12 max-w-3xl mx-auto">
      <Helmet>
        <title>Terms of Use | Feza Programming Club</title>
        <meta
          name="description"
          content="Terms for using the Feza Programming Club website and member portal."
        />
      </Helmet>

      <h1 className="text-4xl font-bold text-primary-600 mb-2">Terms of Use</h1>
      <p className="text-gray-500 mb-10">Last updated: August 2026</p>

      <Section title="Who this site is for">
        <p>
          This site belongs to Feza Programming Club, a coding community based at Feza Boys
          School in Dar es Salaam, Tanzania. It's open to students and anyone interested in
          following our activities, and membership features are for club members.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          If you register for a member account, keep your login details private and let an
          admin know if you think someone else has access to your account. You're responsible
          for what's posted or submitted from your account.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Be respectful in the chat, gallery submissions, and anywhere else you interact on this
          site. Don't upload content that is abusive, harassing, or that you don't have the
          right to share. Admins may remove content or suspend accounts that break these rules.
        </p>
      </Section>

      <Section title="Code Lab and Challenges">
        <p>
          The Python practice lab and coding challenges are provided for learning. Code you run
          there is your own — write and submit it responsibly.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms as the club and site grow. Continued use of the site after
          changes means you accept the updated terms.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Reach out on the{' '}
          <a href="/contact" className="text-primary-600 hover:underline">Contact page</a> if
          anything here needs clarifying.
        </p>
      </Section>
    </div>
  );
};

export default TermsOfUsePage;
