import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHeart, 
  FaCode, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarker,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-800 text-white mt-auto">
      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-secondary-500 p-2 rounded-lg">
                <FaCode className="text-primary-800 text-xl" />
              </div>
              <h3 className="text-xl font-bold">Feza Code Club</h3>
            </div>
            <p className="text-primary-200 text-sm leading-relaxed mb-4">
              Empowering young minds through coding and technology. Join us to learn, create, and innovate.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com/fezaprogramming" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-secondary-500 transition"
                aria-label="Facebook"
              >
                <FaFacebook size={20} />
              </a>
              <a 
                href="https://twitter.com/fezaprogramming" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-secondary-500 transition"
                aria-label="Twitter"
              >
                <FaTwitter size={20} />
              </a>
              <a 
                href="https://instagram.com/fezaprogramming" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-secondary-500 transition"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a 
                href="https://youtube.com/@fezaprogramming" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-200 hover:text-secondary-500 transition"
                aria-label="YouTube"
              >
                <FaYoutube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/activities" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Activities
                </Link>
              </li>
              <li>
                <Link to="/members" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Members
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/announcements" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Announcements
                </Link>
              </li>
              <li>
                <Link to="/challenges" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Challenges
                </Link>
              </li>
              <li>
                <Link to="/python-practice" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Python Lab
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaMapMarker className="text-secondary-500 mt-1 flex-shrink-0" />
                <span className="text-primary-200 text-sm">
                  Feza Boys School, Dar es Salaam, Tanzania
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="text-secondary-500 flex-shrink-0" />
                <a href="tel:+255123456789" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  +255 615 3477 51  | +255 784 2677 51
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-secondary-500 flex-shrink-0" />
                <a href="mailto:club@fezaprogramming.com" className="text-primary-200 hover:text-secondary-500 transition text-sm">
                  fezaclub@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-700">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-primary-300 text-sm text-center md:text-left">
              © {currentYear} Feza Programming Club. All rights reserved.
            </p>
            <p className="text-primary-300 text-sm flex items-center gap-1">
              Made with <FaHeart className="text-red-500" /> for young developers in Tanzania
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
