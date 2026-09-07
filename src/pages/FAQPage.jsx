import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaChevronDown } from 'react-icons/fa';

const FAQS = [
  {
    q: 'Who can join Feza Programming Club?',
    a: 'Any student interested in coding is welcome. Submit a membership request from the "Join" button and an admin will review it.',
  },
  {
    q: 'Do I need to know how to code already?',
    a: "No. We have members at every level, from complete beginners to students who've built real projects. The Python Practice lab and Curriculum page are there to help you start.",
  },
  {
    q: 'What is the Code Lab / Python Practice page?',
    a: 'It\'s an in-browser Python editor where you can write and run code directly, no installation needed — useful for practicing between meetings.',
  },
  {
    q: 'How do I find out about upcoming activities?',
    a: 'Check the Activities page for our schedule, and Announcements for club news. Members also get updates through the club chat.',
  },
  {
    q: 'How do Challenges work?',
    a: 'Challenges are coding problems posted for members to solve and submit. Check the Challenges page for what\'s currently open.',
  },
  {
    q: 'I forgot my password, what do I do?',
    a: 'Use the "Forgot password" option on the member login page, or email fezaclub@gmail.com and an admin can help.',
  },
];

const FAQItem = ({ item, isOpen, onToggle }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
    >
      <span className="font-semibold text-gray-800">{item.q}</span>
      <FaChevronDown
        className={`text-primary-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    {isOpen && (
      <div className="px-5 pb-4 text-gray-600 leading-relaxed">{item.a}</div>
    )}
  </div>
);

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="container-custom py-12 max-w-3xl mx-auto">
      <Helmet>
        <title>FAQ | Feza Programming Club</title>
        <meta
          name="description"
          content="Answers to common questions about joining and using Feza Programming Club."
        />
      </Helmet>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600">Can't find your answer here? Reach out on the Contact page.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, i) => (
          <FAQItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQPage;
