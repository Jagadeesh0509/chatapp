import React, { useState } from 'react';
import { IconX, IconShield, IconFileText, IconCheck } from './Icons';

export default function LegalModals({ initialTab = 'privacy', onClose }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="legal-modal modal" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal-header">
          <div className="legal-modal-tabs">
            <button
              type="button"
              className={`legal-tab ${tab === 'privacy' ? 'active' : ''}`}
              onClick={() => setTab('privacy')}
            >
              <IconShield size={16} />
              Privacy Policy
            </button>
            <button
              type="button"
              className={`legal-tab ${tab === 'terms' ? 'active' : ''}`}
              onClick={() => setTab('terms')}
            >
              <IconFileText size={16} />
              Terms of Service
            </button>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">
            <IconX size={20} />
          </button>
        </div>

        <div className="legal-modal-body">
          {tab === 'privacy' ? (
            <div className="legal-content">
              <h2>Privacy Policy</h2>
              <p className="legal-updated">Last updated: October 1, 2026</p>

              <section>
                <h3>1. Commitment to Data Protection</h3>
                <p>
                  Aura (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;) is built with privacy-first
                  principles. We believe real-time personal and workplace communication should remain confidential,
                  secure, and protected from unauthorized harvesting or monetization.
                </p>
              </section>

              <section>
                <h3>2. Information We Collect</h3>
                <p>We collect only the minimum required information to provide the messaging services:</p>
                <ul>
                  <li><strong>Account Credentials:</strong> Username, email address, and hashed authentication tokens (passwords are cryptographically salted and hashed using bcryptjs).</li>
                  <li><strong>Profile Metadata:</strong> Optional avatar URL, username, and bio provided during account customization.</li>
                  <li><strong>Communication Payload:</strong> Messages, mentions, and chat room subscriptions stored in encrypted datastores solely to ensure cross-device synchronization and message history.</li>
                  <li><strong>Presence State:</strong> Ephemeral online/offline state and active typing indicators relayed via encrypted WebSockets.</li>
                </ul>
              </section>

              <section>
                <h3>3. What We Never Do</h3>
                <ul>
                  <li>We do not sell, rent, or trade your personal data to third parties or advertising networks.</li>
                  <li>We do not scan your private messages for commercial ad targeting.</li>
                  <li>We do not retain deleted messages; when a message is removed, its content is permanently redacted.</li>
                </ul>
              </section>

              <section>
                <h3>4. Data Security & Storage</h3>
                <p>
                  All network communication between client instances and our application servers is protected via
                  Transport Layer Security (TLS 1.3) and secure WebSocket tunnels (WSS). Authentication uses
                  cryptographically signed JSON Web Tokens (JWT) with strict expiration policies.
                </p>
              </section>

              <section>
                <h3>5. Your Rights</h3>
                <p>
                  You retain complete ownership over your account. You can export your data, change your credentials,
                  or permanently delete your profile and associated content at any time via Account Settings.
                </p>
              </section>
            </div>
          ) : (
            <div className="legal-content">
              <h2>Terms of Service</h2>
              <p className="legal-updated">Last updated: October 1, 2026</p>

              <section>
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By creating an account or accessing the Aura chat platform, you agree to comply with and be bound by
                  these Terms of Service. If you do not agree, please do not use the application.
                </p>
              </section>

              <section>
                <h3>2. Acceptable Use Policy</h3>
                <p>Aura provides spaces for respectful, collaborative communication. You agree not to:</p>
                <ul>
                  <li>Engage in harassment, hate speech, bullying, defamation, or spamming.</li>
                  <li>Upload malicious software, virus payloads, or exploitative scripts.</li>
                  <li>Attempt to compromise platform security, reverse engineer services, or bypass access controls.</li>
                  <li>Impersonate any other individual, organization, or system administrator.</li>
                </ul>
              </section>

              <section>
                <h3>3. Account Responsibility</h3>
                <p>
                  You are responsible for safeguarding your login credentials and for all activities occurring under your
                  account. Promptly notify our support team if you detect any unauthorized account access.
                </p>
              </section>

              <section>
                <h3>4. Service Availability & Modifications</h3>
                <p>
                  We strive for 99.9% uptime and continuous reliability. We may occasionally deploy feature updates,
                  security patches, or maintenance routines. We reserve the right to suspend accounts that violate our
                  Acceptable Use Policy.
                </p>
              </section>

              <section>
                <h3>5. Contact Information</h3>
                <p>
                  For inquiries regarding these Terms or privacy practices, reach our security and legal desk at{' '}
                  <span className="legal-link">compliance@aura-chat.internal</span>.
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="legal-modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            <IconCheck size={16} />
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
