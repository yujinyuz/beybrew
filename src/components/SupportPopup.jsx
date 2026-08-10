import { useState } from 'react';
import PropTypes from 'prop-types';
import { dismissSupportPopup } from '../lib/supportPopup';
import PartImage from './PartImage';

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

function SupportPopup({ onClose }) {
  const [showQR, setShowQR] = useState(false);

  function handleClose() {
    dismissSupportPopup();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'var(--color-modal-bg)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="rounded-xl shadow-xl max-w-md w-full p-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <h2
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent)' }}
          >
            KEEP BEYBREW FREE
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            BeyBrew is independently funded and built on personal time. If it&apos;s helped you, consider chipping in to keep it going. 💙
          </p>
        </div>

        {/* GCash */}
        <div className="rounded-lg p-3 mb-2" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">💙</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">GCash</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Scan QR code</div>
            </div>
            <button
              onClick={() => setShowQR(v => !v)}
              style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {showQR ? 'Hide QR' : 'Show QR'}
            </button>
          </div>
          {showQR && (
            <div className="flex justify-center mt-3">
              <PartImage
                name="gcash-qr.jpg"
                alt="GCash QR Code"
                className="max-w-[180px] w-full rounded-lg"
                style={{ border: '1px solid var(--color-border)' }}
              />
            </div>
          )}
        </div>

        {/* Ko-fi */}
        <a
          href="https://ko-fi.com/yujinyuz"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-lg p-3 mb-2 transition-colors"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'inherit', textDecoration: 'none' }}
        >
          <span className="text-xl">☕</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">Ko-fi</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>ko-fi.com/yujinyuz</div>
          </div>
          <ExternalLinkIcon />
        </a>

        {/* PayPal */}
        <a
          href="https://paypal.me/yujinyuz"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-lg p-3 mb-2 transition-colors"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'inherit', textDecoration: 'none' }}
        >
          <span className="text-xl">💳</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">PayPal</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>paypal.me/yujinyuz</div>
          </div>
          <ExternalLinkIcon />
        </a>

        {/* GitHub Sponsors */}
        <a
          href="https://github.com/sponsors/yujinyuz"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-lg p-3 mb-4 transition-colors"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'inherit', textDecoration: 'none' }}
        >
          <span className="text-xl">🐙</span>
          <div className="flex-1">
            <div className="font-semibold text-sm">GitHub Sponsors</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>github.com/sponsors/yujinyuz</div>
          </div>
          <ExternalLinkIcon />
        </a>

        <div className="text-center">
          <button
            onClick={handleClose}
            style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '12px', padding: '5px 18px', borderRadius: '20px', cursor: 'pointer' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

SupportPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SupportPopup;
