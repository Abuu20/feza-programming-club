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
      <h1 className="text-4xl font-bold text-center mb-4">Contact Us</h1>
      <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <FaEnvelope className="text-primary-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-gray-600">fezaclub@gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <FaPhone className="text-primary-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Phone</h3>
                <p className="text-gray-600">+2557 8426 7752 | +2556 1534 7751</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <FaMapMarker className="text-primary-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Location</h3>
                <p className="text-gray-600">Feza Boys School, Dar es Salaam, Tanzania</p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="mt-8 bg-gray-200 h-64 rounded-lg overflow-hidden">
            <iframe
              title="School Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126917.27865791133!2d39.22916745!3d-6.79235415!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x185c39eb96c3a18d%3A0x5087fd2dbd1df0c4!2sDar%20es%20Salaam%2C%20Tanzania!5e0!3m2!1sen!2s!4v1645567890123!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-6">Send Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
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
                Email Address
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
                Message
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
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <FaPaperPlane />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
