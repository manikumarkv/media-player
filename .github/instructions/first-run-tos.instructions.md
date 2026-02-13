# First-Run Terms of Service Acceptance Instructions

**Purpose:** Ensure users acknowledge legal responsibilities before using the application  
**Scope:** Frontend modal dialog shown on first app launch  
**Related:** DISCLAIMER.md, LICENSE

---

## 🎯 Implementation Overview

On first application launch, users MUST accept ToS before accessing any features. This provides:
1. Legal protection for developers
2. Clear user acknowledgment of responsibilities
3. Documented consent for legal compliance

---

## 🔧 Implementation

### 1. Local Storage Flag

```typescript
// frontend/src/utils/legal.ts

export const LegalConsent = {
  KEY: 'legal-consent-accepted',
  VERSION: '1.0.0', // Increment when ToS changes
  
  hasAccepted(): boolean {
    const consent = localStorage.getItem(this.KEY);
    return consent === this.VERSION;
  },
  
  accept(): void {
    localStorage.setItem(this.KEY, this.VERSION);
    localStorage.setItem('legal-consent-date', new Date().toISOString());
  },
  
  getAcceptanceDate(): string | null {
    return localStorage.getItem('legal-consent-date');
  },
  
  revoke(): void {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem('legal-consent-date');
  },
};
```

### 2. ToS Modal Component

```tsx
// frontend/src/components/Legal/FirstRunModal.tsx
import { useState } from 'react';
import { LegalConsent } from '../../utils/legal';

interface FirstRunModalProps {
  onAccept: () => void;
}

export const FirstRunModal: React.FC<FirstRunModalProps> = ({ onAccept }) => {
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);
  const [hasReadLicense, setHasReadLicense] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const canAccept = hasReadDisclaimer && hasReadLicense && hasAcknowledged;

  const handleAccept = () => {
    if (!canAccept) return;
    LegalConsent.accept();
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4">
          <h2 className="text-2xl font-bold">⚠️ Important Legal Notice</h2>
          <p className="text-red-100 mt-1">Please read carefully before proceeding</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          
          {/* Warning Box */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-4">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-200 text-lg mb-2">
              🔴 This Software is for Educational Purposes Only
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300">
              Downloading content from YouTube may violate their Terms of Service. 
              You are solely responsible for your use of this tool.
            </p>
          </div>

          {/* Key Points */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg">You Acknowledge That:</h3>
            
            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReadDisclaimer}
                  onChange={(e) => setHasReadDisclaimer(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I have read and understand the{' '}
                  <a 
                    href="/DISCLAIMER.md" 
                    target="_blank" 
                    className="text-blue-600 underline"
                  >
                    Legal Disclaimer
                  </a>
                  , which explains my legal responsibilities
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReadLicense}
                  onChange={(e) => setHasReadLicense(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I have read the{' '}
                  <a 
                    href="/LICENSE" 
                    target="_blank" 
                    className="text-blue-600 underline"
                  >
                    GPL-3.0 License
                  </a>
                  {' '}and understand this is open-source software
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="mt-1"
                />
                <span className="font-medium">
                  I understand that I am solely responsible for ensuring I have 
                  legal rights to download any content, and I will comply with 
                  YouTube's Terms of Service and all applicable laws
                </span>
              </label>
            </div>
          </div>

          {/* Detailed Terms */}
          <div className="border-t pt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-1">❌ This Tool Does NOT:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Endorse or encourage copyright infringement</li>
                <li>Circumvent DRM or technological protection measures</li>
                <li>Violate DMCA anti-circumvention provisions</li>
                <li>Take responsibility for user actions</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-1">✅ You Are Responsible For:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Ensuring you have legal rights to download content</li>
                <li>Complying with YouTube Terms of Service</li>
                <li>Following copyright laws in your jurisdiction</li>
                <li>Respecting content creators' rights</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-1">⚖️ Legal Use Cases May Include:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Downloading your own uploaded content</li>
                <li>Content with Creative Commons licenses permitting downloads</li>
                <li>Educational use where fair use/dealing applies</li>
                <li>Research in academic or institutional settings</li>
              </ul>
            </div>
          </div>

          {/* No Liability */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-xs">
            <p className="font-semibold mb-2">NO WARRANTY & LIMITATION OF LIABILITY:</p>
            <p>
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. 
              IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR 
              OTHER LIABILITY ARISING FROM YOUR USE OF THIS SOFTWARE.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View YouTube Terms of Service →
          </a>

          <div className="flex gap-3">
            <button
              onClick={() => window.close()}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Decline & Exit
            </button>
            
            <button
              onClick={handleAccept}
              disabled={!canAccept}
              className={`
                px-6 py-2 rounded font-semibold
                ${canAccept 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              I Accept - Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 3. App-Level Guard

```tsx
// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { FirstRunModal } from './components/Legal/FirstRunModal';
import { LegalConsent } from './utils/legal';

export const App = () => {
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = useState(true);

  useEffect(() => {
    const hasConsent = LegalConsent.hasAccepted();
    setShowLegalModal(!hasConsent);
    setIsCheckingConsent(false);
  }, []);

  const handleAccept = () => {
    setShowLegalModal(false);
  };

  if (isCheckingConsent) {
    return <div>Loading...</div>;
  }

  if (showLegalModal) {
    return <FirstRunModal onAccept={handleAccept} />;
  }

  return (
    <div className="app">
      {/* Main application content */}
    </div>
  );
};
```

### 4. Settings Page - Revoke Consent

```tsx
// frontend/src/pages/Settings/Legal.tsx
import { LegalConsent } from '../../utils/legal';

export const LegalSettings: React.FC = () => {
  const acceptanceDate = LegalConsent.getAcceptanceDate();

  const handleRevoke = () => {
    if (confirm('Revoking consent will close the application. Continue?')) {
      LegalConsent.revoke();
      window.location.reload(); // Forces ToS modal on next load
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Legal & Privacy</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Terms Acceptance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You accepted the terms on: {' '}
              {acceptanceDate 
                ? new Date(acceptanceDate).toLocaleDateString() 
                : 'Unknown'
              }
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/DISCLAIMER.md"
              target="_blank"
              className="text-blue-600 hover:underline text-sm"
            >
              View Disclaimer
            </a>
            <a
              href="/LICENSE"
              target="_blank"
              className="text-blue-600 hover:underline text-sm"
            >
              View License
            </a>
          </div>

          <button
            onClick={handleRevoke}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Revoke Consent & Exit
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 📋 Implementation Checklist

When implementing first-run ToS:

- [ ] Create `LegalConsent` utility
- [ ] Build `FirstRunModal` component
- [ ] Add app-level guard in `App.tsx`
- [ ] Make DISCLAIMER.md accessible at `/DISCLAIMER.md` route
- [ ] Make LICENSE accessible at `/LICENSE` route
- [ ] Add legal settings page
- [ ] Test modal appears on first run
- [ ] Test modal doesn't appear after acceptance
- [ ] Test consent version upgrades (when ToS changes)
- [ ] Test "Decline & Exit" closes app
- [ ] Test all checkboxes required before acceptance
- [ ] Test external links open correctly
- [ ] Add telemetry for acceptance rate (if analytics enabled)

---

## 🔄 Handling ToS Updates

When legal terms change:

```typescript
// Update version in legal.ts
export const LegalConsent = {
  VERSION: '1.1.0', // Increment here
  // ...
};

// Users will see modal again on next visit
// Their previous acceptance is preserved with date
```

---

## 🎨 Styling Considerations

- **Red/Yellow colors** - Emphasize seriousness
- **Large text** - Ensure readability
- **Checkboxes** - Force active acknowledgment (no auto-check)
- **Disabled button** - Can't proceed without reading
- **Scrollable content** - Full disclaimer visible
- **Responsive** - Works on mobile devices

---

## 🌐 Internationalization

When adding i18n:

```typescript
// Load legal text per language
const disclaimer = {
  en: 'I understand that I am solely responsible...',
  es: 'Entiendo que soy el único responsable...',
  de: 'Ich verstehe, dass ich allein verantwortlich bin...',
};

// Ensure legal compliance in each jurisdiction
```

---

## 📊 Analytics (Optional)

Track acceptance rates (anonymized):

```typescript
trackEvent('Legal', 'ToS Accepted', LegalConsent.VERSION);
trackEvent('Legal', 'ToS Declined'); // User closed app
```

---

**Related Documentation:**
- `frontend.instructions.md` - React implementation
- `ux-design.instructions.md` - User experience
- `i18n.instructions.md` - Multi-language support

---

**End of First-Run ToS Instructions**
