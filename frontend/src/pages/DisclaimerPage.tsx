import './Pages.css';

export function DisclaimerPage() {
  return (
    <div className="page disclaimer-page">
      <header className="page-header">
        <h1 className="page-title">Legal Disclaimer</h1>
        <p className="page-subtitle">Educational and Research Purposes Only</p>
      </header>

      <div className="disclaimer-content">
        <section className="disclaimer-section">
          <h2>YouTube Terms of Service</h2>
          <p>
            <strong>Important:</strong> Downloading content from YouTube may violate{' '}
            <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
              YouTube's Terms of Service
            </a>{' '}
            (Section 4.B), which states:
          </p>
          <blockquote>
            "You shall not download any Content unless you see a 'download' or similar link
            displayed by YouTube on the Service for that Content."
          </blockquote>
          <p>
            This tool is designed to help users understand video/audio download technologies and
            offline media management architectures. It is <strong>NOT</strong> intended to
            facilitate violations of YouTube's terms.
          </p>
        </section>

        <section className="disclaimer-section">
          <h2>User Responsibility</h2>
          <p>
            <strong>YOU, the user, are solely responsible for:</strong>
          </p>
          <ul>
            <li>Ensuring you have the legal right to download and store the content</li>
            <li>Complying with all applicable laws in your jurisdiction</li>
            <li>Respecting copyright holders' rights</li>
            <li>Following YouTube's Terms of Service and Community Guidelines</li>
            <li>
              Using this tool only for content you own or have explicit permission to download
            </li>
          </ul>
        </section>

        <section className="disclaimer-section">
          <h2>Legal Use Cases</h2>
          <ul>
            <li>Downloading your own uploaded content</li>
            <li>
              Downloading content with explicit Creative Commons licenses permitting downloads
            </li>
            <li>Educational use in jurisdictions where fair use/fair dealing applies</li>
            <li>Research purposes in academic or institutional settings</li>
            <li>
              Personal archival in jurisdictions that permit format-shifting of legally obtained
              content
            </li>
          </ul>
        </section>

        <section className="disclaimer-section">
          <h2>No Warranty & Limitation of Liability</h2>
          <p>
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE AND NONINFRINGEMENT.
          </p>
          <p>
            <strong>The developers of this software:</strong>
          </p>
          <ul>
            <li>Do NOT endorse or encourage copyright infringement</li>
            <li>Do NOT take responsibility for how you use this tool</li>
            <li>Are NOT liable for any legal consequences arising from your use</li>
            <li>Do NOT provide legal advice</li>
          </ul>
        </section>

        <section className="disclaimer-section">
          <h2>Age Restrictions</h2>
          <p>
            This software is intended for users <strong>18 years or older</strong>, or the age of
            majority in your jurisdiction. By using this software, you confirm you meet the age
            requirement.
          </p>
        </section>

        <section className="disclaimer-section acknowledgment">
          <h2>Acknowledgment</h2>
          <p>
            <strong>By using this software, you acknowledge that:</strong>
          </p>
          <ol>
            <li>You have read and understood this disclaimer</li>
            <li>You agree to use the software responsibly and legally</li>
            <li>You accept all risks and liability associated with your use</li>
            <li>You will not hold the developers liable for your actions</li>
          </ol>
          <p className="disclaimer-warning">
            If you do not agree with these terms, do not use this software.
          </p>
        </section>
      </div>
    </div>
  );
}
