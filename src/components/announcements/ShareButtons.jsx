import React from 'react';
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
  EmailShareButton,
  EmailIcon,
  LinkedinShareButton,
  LinkedinIcon
} from 'react-share';
import { FaShare } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ShareButtons = ({ announcement, url = window.location.href }) => {
  const shareTitle = announcement?.title || 'Feza Programming Club Announcement';
  const shareText = announcement?.content?.substring(0, 100) + '...' || 'Check out this announcement from Feza Programming Club!';
  const shareUrl = url;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  // For mobile native share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Native Share Button (for mobile) */}
      <button
        onClick={handleNativeShare}
        className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition"
        title="Share"
      >
        <FaShare size={16} />
      </button>

      {/* Social Media Buttons */}
      <FacebookShareButton url={shareUrl} quote={shareTitle}>
        <FacebookIcon size={32} round />
      </FacebookShareButton>

      <TwitterShareButton url={shareUrl} title={shareTitle}>
        <TwitterIcon size={32} round />
      </TwitterShareButton>

      <WhatsappShareButton url={shareUrl} title={shareTitle} separator=" - ">
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>

      <TelegramShareButton url={shareUrl} title={shareTitle}>
        <TelegramIcon size={32} round />
      </TelegramShareButton>

      <EmailShareButton url={shareUrl} subject={shareTitle} body={shareText}>
        <EmailIcon size={32} round />
      </EmailShareButton>

      <LinkedinShareButton url={shareUrl} title={shareTitle} summary={shareText}>
        <LinkedinIcon size={32} round />
      </LinkedinShareButton>

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition"
        title="Copy link"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  );
};

export default ShareButtons;
