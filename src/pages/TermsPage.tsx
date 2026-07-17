import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | MyCollegeGenie</title>
        <meta name="description" content="Read the terms of service for using MyCollegeGenie platform." />
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
            <li className="current"><span className="pip"></span>Acceptance of Terms</li>
            <li><span className="pip"></span>User Conduct &amp; Content</li>
            <li><span className="pip"></span>Disclaimer of Warranties</li>
            <li><span className="pip"></span>Intellectual Property</li>
          </ul>
        </div>

        <div>
          <div className="legal-head">
            <div className="legal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M5 7l-3 6a3 3 0 0 0 6 0l-3-6zm14 0l-3 6a3 3 0 0 0 6 0l-3-6zM5 7h6M13 7h6M5 21h14"/></svg></div>
            <h1>Terms of <em>Service</em></h1>
            <span className="updated">Last updated: March 25, 2026</span>
          </div>

          <div className="legal-card">
            <div className="legal-card-head">
              <div className="legal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg></div>
              <h3>Acceptance of terms</h3>
              <span className="tag-pill required">Required to use</span>
            </div>
            <p>By accessing or using My College Genie, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service. These terms apply to all visitors, users, and others who access or use the platform.</p>
          </div>

          <div className="legal-card">
            <div className="legal-card-head">
              <div className="legal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
              <h3>User conduct &amp; content</h3>
            </div>
            <p>When using our platform, you agree to:</p>
            <ul className="dot-list">
              <li><span className="ring"><span className="core"></span></span><span>Only upload resources that you have the right to share.</span></li>
              <li><span className="ring"><span className="core"></span></span><span>Not upload any content that is infringing, defamatory, or otherwise unlawful.</span></li>
              <li><span className="ring"><span className="core"></span></span><span>Respect the academic integrity of your college and fellow students.</span></li>
              <li><span className="ring"><span className="core"></span></span><span>Not use the platform for commercial solicitation or spam.</span></li>
            </ul>
          </div>

          <div className="legal-card">
            <div className="legal-card-head">
              <div className="legal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>
              <h3>Disclaimer of warranties</h3>
            </div>
            <div className="warn-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
              My College Genie is a <em>student-led initiative</em>. We provide resources "as is" and do not guarantee the accuracy, completeness, or usefulness of any content.
            </div>
            <p>Use of these resources is at your own risk. We are not responsible for academic decisions made solely on content found on this platform — always verify against official college or university sources.</p>
          </div>

          <div className="legal-card">
            <div className="legal-card-head">
              <div className="legal-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-7 9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9"/></svg></div>
              <h3>Intellectual property</h3>
              <span className="tag-pill student">Student-led initiative</span>
            </div>
            <p>The platform design, logo, and original content are the property of My College Genie. User-uploaded resources remain the property of their respective creators — by uploading, you grant us a license to display and distribute them within the platform for educational purposes.</p>
          </div>

        </div>
      </div>
    </>
  );
};
