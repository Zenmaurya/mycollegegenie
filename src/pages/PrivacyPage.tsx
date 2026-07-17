import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | MyCollegeGenie</title>
        <meta name="description" content="Read our privacy policy to understand how we protect your data." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to home
      </Link>

      <div className="legal-wrap">
        <div className="toc">
          <h4>Contents</h4>
          <ul>
            <li className="current"><span className="pip"></span>Information We Collect</li>
            <li><span className="pip"></span>How We Use Your Data</li>
            <li><span className="pip"></span>Data Security</li>
          </ul>
        </div>

        <div>
          <div className="legal-head">
            <div className="legal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
            <h1>Privacy <em>Policy</em></h1>
            <span className="updated">Last updated: March 25, 2026</span>
          </div>

          <div className="legal-card">
            <div className="legal-card-head">
              <div className="legal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg></div>
              <h3>Information we collect</h3>
            </div>
            <p>We collect minimal information to give you the best possible experience on My College Genie. This includes:</p>
            <ul className="check-list">
              <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>Account information:</b> when you sign in with Google or GitHub, we receive your name, email address, and profile picture.</span></li>
              <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>Usage data:</b> we collect information about which resources you view, save, and rate so we can improve recommendations.</span></li>
              <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg></span><span><b>Uploaded content:</b> any resource you upload — title, description, and file — is stored on our secure servers.</span></li>
            </ul>
          </div>

          <div className="legal-card">
            <div className="legal-card-head">
              <div className="legal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <h3>How we use your data</h3>
            </div>
            <p>Your data is used solely for the following purposes:</p>
            <ul className="check-list">
              <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg></span><span>To personalise your experience and surface relevant academic resources.</span></li>
              <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg></span><span>To maintain community integrity through moderation and reporting systems.</span></li>
              <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg></span><span>To send you updates about new features or important campus news.</span></li>
            </ul>
            <div className="notice-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M4.9 4.9l14.2 14.2"/></svg>
              We <b>never</b> sell your personal information to third parties. Ever.
            </div>
          </div>

          <div className="legal-card">
            <div className="legal-card-head">
              <div className="legal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
              <h3>Data security</h3>
            </div>
            <p>We use industry-standard security measures to protect your data, including encryption in transit and at rest. Access to sensitive data is strictly controlled through server-side rules.</p>
            <div className="pill-row">
              <span className="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> SSL encrypted</span>
              <span className="pill mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Secure servers</span>
              <span className="pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg> Encrypted at rest</span>
            </div>
          </div>

          <div className="legal-card cta-card">
            <h3 style={{ marginBottom: '6px' }}>Questions or concerns?</h3>
            <p>If you have questions about our privacy practices, or want to request deletion of your data, reach out to the student moderation team.</p>
            <div className="actions">
              <button className="btn btn-primary">Contact moderation team</button>
              <button className="btn btn-mark">Ask on the forum →</button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
