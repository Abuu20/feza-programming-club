import React, { useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarker, FaPaperPlane } from 'react-icons/fa';
import { messagesService } from '../services/messages';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    const { error } = await messagesService.create(formData);
    
    if (!error) {
      toast.success('Message sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    }
    
    setSending(false);
  };

  return (
    <div className="container-custom py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">Contact Us</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-semibold text-primary-600 mb-6">Get in Touch</h2>
          
          <div className="space-y-6">
            {/* Email */}
            <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition">
              <div className="bg-primary-100 p-3 rounded-lg">
                <FaEnvelope className="text-primary-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                <p className="text-gray-600">fezaclub@gmail.com</p>
                <p className="text-sm text-gray-500 mt-1">We'll respond within 24 hours</p>
              </div>
            </div>
            
            {/* Phone */}
            <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition">
              <div className="bg-primary-100 p-3 rounded-lg">
                <FaPhone className="text-primary-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Phone</h3>
                <p className="text-gray-600">+2557 8426 7751</p>
                <p className="text-gray-600">+2556 1534 7751</p>
                <p className="text-sm text-gray-500 mt-1">Monday - Friday, 9am - 5pm</p>
              </div>
            </div>
            
            {/* Location - Fixed with correct Tegeta Bahari Beach Road */}
            <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition">
              <div className="bg-primary-100 p-3 rounded-lg">
                <FaMapMarker className="text-primary-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Location</h3>
                <p className="text-gray-600">Feza Boys Secondary School</p>
                <p className="text-gray-600">Tegeta Bahari Beach Road</p>
                <p className="text-gray-600">Dar es Salaam, Tanzania</p>
                <p className="text-sm text-gray-500 mt-1">Visit us during school hours</p>
              </div>
            </div>
          </div>

          {/* Map - Using correct coordinates for Tegeta area */}
          <div className="mt-8 bg-gray-200 h-80 rounded-lg overflow-hidden shadow-md">
            <iframe
              title="Feza Boys School Location - Tegeta"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15852.624578138922!2d39.1075!3d-6.7325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x185c4f0b9a8d6b9b%3A0x6a9f8e5c4b3a2d1c!2sFeza%20Boys%20Secondary%20School!5e0!3m2!1sen!2stz!4v1700000000000!5m2!1sen!2stz"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            ></iframe>
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-primary-50 p-4 rounded-lg">
            <p className="text-sm text-primary-700">
              <span className="font-semibold">📍 Need directions?</span> The school is located along Tegeta Bahari Beach Road, 
              easily accessible from the main road. Look for the Feza Schools signboard.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-primary-600 mb-6">Send Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className="input-field resize-none"
                placeholder="Your message here..."
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={sending}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg"
            >
              <FaPaperPlane />
              {sending ? 'Sending...' : 'Send Message'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By submitting this form, you agree to our privacy policy and consent to being contacted.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
