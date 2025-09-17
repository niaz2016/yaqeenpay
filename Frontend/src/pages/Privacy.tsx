import React, { useMemo, useRef, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Divider,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

type Section = { id: string; title: string; content: string };

const defaultSections: Section[] = [
  {
    id: 'collect',
    title: '1. Information We Collect',
    content:
      'We collect and process certain categories of information in order to deliver, maintain, and improve the Wallet and Escrow services offered through our platform. This information includes—but is not limited to—identifiers and contact information you provide directly (such as full name, telephone number, email address, postal address and national identity number where required for Seller KYC), transactional information (including payment instrument references, amounts, timestamps, Escrow movement history, withdrawal requests and settlement records), and technical information automatically collected when you interact with our services (device type, operating system, browser type and version, IP addresses, device identifiers, cookie identifiers and server logs). Where applicable, we also collect KYC and verification documentation (such as government-issued identity documents, photographs, business registration documents and verification metadata) to satisfy regulatory and risk-management requirements. We limit collection to the data necessary to provide the service, to comply with legal obligations, and to protect users and the platform from misuse or fraud.'
  },
  {
    id: 'use',
    title: '2. How We Use Your Information',
    content:
      'We process personal data for a number of lawful purposes that enable the functioning of our Wallet and Escrow services. These purposes include: facilitating payments, top-ups and disbursements; executing Escrow operations such as holding, releasing and refunding funds in accordance with order lifecycle events; verifying user identity and performing KYC and AML checks where required by law; preventing, detecting and remediating fraud and abuse; providing customer support and dispute resolution; delivering transactional and operational communications (such as receipts, settlement confirmations, and security alerts); and improving, developing and securing our platform and services. We rely upon a combination of lawful bases for processing (such as contract performance, legitimate interests in fraud prevention and platform security, and compliance with legal obligations). Where marketing or profiling activities are conducted, we will provide clear choices and comply with applicable consent requirements.'
  },
  {
    id: 'share',
    title: '3. Data Sharing and Disclosure',
    content:
      'We do not sell or rent personal data to third parties. We may disclose personal data to carefully selected third-party service providers and partners who act on our behalf to provide services such as payment processing, identity verification, KYC/AML screening, fraud detection, analytics, hosting and customer support. These parties are contractually bound to use personal data only for the purposes specified by us and to apply appropriate security measures. We may also disclose personal information to payment partners (for example, Easypaisa, JazzCash, or banking partners) when required to process a transaction, settle a withdrawal or reconcile accounts. Where disclosure is required by law—such as a court order, subpoena or governmental request—we will cooperate with lawful requests from public authorities. Additionally, we may disclose data to protect the rights, property or safety of our users, the public, or the platform, such as in the investigation of fraud or other wrongdoing. When transfers of personal data occur across national borders, we apply safeguards required by applicable law.'
  },
  {
    id: 'security',
    title: '4. Data Security',
    content:
      'We implement technical, administrative and organizational measures designed in accordance with industry best practices to protect personal data against unauthorized access, loss, misuse, alteration or disclosure. These measures include the use of strong encryption for data in transit and at rest where appropriate, network and application security controls, role-based access restrictions, secure development practices, log monitoring and incident response procedures. Access to financial and personal data is strictly limited to personnel who require such access to perform their duties, and third-party service providers are contractually required to maintain equivalent safeguards. Despite these protections, no security controls are infallible; in the unlikely event of a data security incident, we will follow our incident response plan and notify affected individuals and regulators as required by applicable law. You should also take reasonable measures to protect your account credentials and report any suspicious activity to our support team immediately.'
  },
  {
    id: 'rights',
    title: '5. Your Rights',
    content:
      'Subject to applicable law, you have certain rights in relation to your personal data. These may include the right to request access to the personal data we hold about you, to request rectification of inaccurate data, to request erasure of personal data where there is no lawful reason for continued processing, to request restriction of processing, to object to certain types of processing (including direct marketing), and to request data portability where technically feasible. Certain rights may be limited in scope where we are required to retain data for legal, regulatory or legitimate business purposes (for example, for accounting or fraud investigation). To exercise your rights, please contact our Data Protection or support team using the contact details provided below; we will verify your identity and respond within the timescales required by applicable law.'
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    content:
      'We retain personal data only for as long as necessary to fulfil the purposes outlined in this Privacy Policy, to comply with our legal and regulatory obligations, to resolve disputes, to enforce our agreements, and to maintain the safety and security of the platform. Transactional and ledger records, which are subject to financial and regulatory retention requirements, will be retained for a period of no less than seven (7) years or as otherwise required by law. Other categories of personal data will be retained for periods proportionate to the reasons for collection, after which they will be securely deleted or anonymized. If you wish to request deletion of your personal data, please contact support; certain data may be retained if necessary to comply with legal obligations or to protect the rights or property of the platform or other users.'
  },
  {
    id: 'cookies',
    title: '7. Cookies & Tracking',
    content:
      'We use cookies, web beacons, device identifiers and similar technologies to enable essential platform functionality (such as session management and authentication), to enhance security, to measure and analyze usage patterns, and to deliver tailored content and advertising where applicable. Cookies may be set by us directly or by third-party providers that enable analytics or other features. Most web browsers allow you to control cookies through their settings; however, disabling certain cookies may reduce functionality or degrade your user experience. For more detailed information about the cookies we use and how to manage preferences, please refer to the Cookie Notice (if available) or your browser settings.'
  },
  {
    id: 'thirdparty',
    title: '8. Third-Party Services',
    content:
      'Our platform interoperates with a number of third-party service providers and partners to provide payment processing, identity verification, communications, analytics, hosting and other operational services. These third parties may process personal data on our behalf or independently when you choose to connect an external service. Their collection and use of your personal data will be governed by their own privacy policies and terms of service, and we encourage you to review those policies before using such integrations. We endeavour to select reputable providers and require contractual assurances that they will protect personal data to a standard commensurate with our own practices and legal obligations.'
  },
  {
    id: 'changes',
    title: '9. Changes to this Policy',
    content:
      'We may revise this Privacy Policy from time to time to reflect changes in our practices, regulatory developments or new product features. Where changes are material, we will take reasonable steps to provide notice to affected users (for example, via email or in-app notification) and will publish the effective date of the latest version. Continued use of the platform after such notice will constitute acceptance of the updated policy in accordance with applicable law. We recommend that you periodically review this page to stay informed about how we protect and process personal data.'
  },
  {
    id: 'contact',
    title: '10. Contact & Complaints',
    content:
      'If you have any questions about this Privacy Policy, would like to exercise your data subject rights, or wish to lodge a complaint regarding our data practices, please contact our support or Data Protection team at support@yourplatform.example (replace with actual support email) or via the in-app support channel. We will acknowledge receipt of your request and, following verification, respond in accordance with applicable law. If you remain dissatisfied after engaging with our internal processes, you may have the right to lodge a complaint with the relevant data protection authority in your jurisdiction.'
  }
];

const buyerSellerSections: Section[] = [
  {
    id: 'buyer-protection',
    title: 'Buyer Protection Policy',
    content:
      'Purpose and Scope:\nThe Buyer Protection policy exists to provide clear expectations and procedural safeguards for buyers who use the platform to purchase goods and services through Escrow. Its objective is to reduce transaction risk by ensuring that funds placed into Escrow are handled impartially and according to defined operational rules.\n\nCoverage and Eligibility:\nThis policy applies to transactions that are funded through Wallet Credits and processed using the platform’s Escrow mechanism. To be eligible for Buyer Protection, an order must be placed with a Seller operating on the platform and the associated payment must have been captured into Escrow. Claims must be submitted within the timeframe and according to the evidentiary requirements set forth in this policy (for example, reporting non-delivery or materially damaged goods within the specified dispute window).\n\nExclusions:\nBuyer Protection does not apply to buyer preference changes (for example, change of mind), transactions conducted off-platform, or categories of goods and services explicitly excluded from coverage (such as certain digital goods or services where delivery cannot be objectively demonstrated). The platform may publish a list of excluded items where appropriate.\n\nClaims and Refund Process:\nIf a buyer believes an order qualifies for protection (non-delivery, wrong item, or materially damaged goods), the buyer must initiate a dispute and provide supporting evidence (such as order details, photographs, tracking information, correspondence with the Seller, and any other requested documentation). The platform will review the evidence, which may include corroboration from the Seller and third-party shipment tracking, and will determine whether a refund to Buyer Wallet Credits is appropriate. Refunds are ordinarily limited to the amount held in Escrow for that order, subject to any verified fees or adjustments that are applied in accordance with the platform’s rules.\n\nAutomatic Release and Timeouts:\nWhere a Buyer does not take action within the allotted dispute window (for example, 48 hours after delivery confirmation or a defined acceptance period), Escrow funds may be automatically released to the Seller in accordance with the platform’s release rules. The platform will use reasonable efforts to notify the Buyer prior to automatic release.\n\nNeutral Role and Limitations:\nThe platform acts as a neutral facilitator of Escrow services and does not assume responsibility for product quality, Seller performance or shipping delays beyond the Escrow mechanics and dispute resolution described herein. Buyer remedies under this policy are limited to the Escrowed amount, and the platform’s role is to facilitate an equitable resolution based on documented evidence and platform policy.'
  },
  {
    id: 'seller-protection',
    title: 'Seller Protection Policy',
    content:
      'Purpose and Scope:\nThe Seller Protection policy is designed to provide Sellers with a clear and predictable process for receiving payment once they have fulfilled their shipment or service obligations. The policy seeks to balance the rights of Buyers and Sellers by defining objective evidence standards and timelines for release of Escrowed funds.\n\nCoverage and Requirements:\nSeller Protection applies to orders that were funded into Escrow prior to shipment or performance. To qualify, Sellers should follow the platform’s specified fulfilment and evidence procedures—this may include providing valid shipment tracking information, courier receipts, shipment photographs, or other documentation demonstrating that the goods were dispatched in accordance with the order.\n\nExclusions and Non-Qualifying Situations:\nSeller Protection does not cover shipments or transactions where funds were not placed into Escrow, where the Seller cannot produce verifiable evidence of shipment or delivery, or where the transaction involves items expressly excluded by platform policy. Claims involving alleged counterfeit or fraudulent activity will be subject to additional review.\n\nAutomatic Release and Timing:\nIf the Buyer does not raise a legitimate dispute within the defined acceptance window (for example, 48 hours following delivery confirmation), Escrow funds may be released to the Seller automatically. The platform may define additional conditions under which automatic release occurs (for example, verified delivery events).\n\nFunds Settlement Process:\nUpon release, Escrowed funds will be credited to the Seller’s Wallet Credits and become eligible for withdrawal to approved external accounts (such as Easypaisa, JazzCash or bank accounts) in accordance with the platform’s withdrawal policies and identity verification requirements. Settlement timelines may vary depending on the destination and payment partner processing times.\n\nDisputes and Escalation:\nIn cases where a Buyer disputes an order after funds have been released, the platform may undertake an investigation and, where appropriate, apply remedies such as reversing a settlement subject to evidence of fraud or material non-compliance by the Seller. Sellers have the right to escalate suspected fraud or unfair disputes to platform administrators for review.\n\nLimitations of Liability:\nSeller remedies are generally limited to the Escrowed amount related to the transaction. The platform does not act as an insurer for Seller performance beyond the mechanisms provided by the Escrow and dispute resolution processes, and is not liable for indirect or consequential losses arising from a transaction.'
  }
];

// Merge buyer/seller sections into the main sections list so they appear on the page
defaultSections.push(...buyerSellerSections);

const Privacy: React.FC = () => {
  const [query, setQuery] = useState('');
  const printableRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return defaultSections;
    const q = query.toLowerCase();
    return defaultSections.filter((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
  }, [query]);

  const handlePrint = () => {
    if (!printableRef.current) return;
    const printWindow = window.open('', '_blank', 'noopener');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Privacy Policy</title>');
    printWindow.document.write('<style>body{font-family:Roboto, Arial, sans-serif;padding:20px;} h1{font-size:20px;} .section{margin-bottom:18px;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printableRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    const text = defaultSections.map((s) => `${s.title}\n\n${s.content}\n\n`).join('');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'privacy-policy.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const text = defaultSections.map((s) => `${s.title}\n\n${s.content}\n\n`).join('');
    await navigator.clipboard.writeText(text);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 6, mb: 8, display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ width: { xs: '100%', md: '25%' } }}>
          <Typography variant="h6" gutterBottom>
            On this page
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField size="small" placeholder="Search policy..." fullWidth value={query} onChange={(e) => setQuery(e.target.value)} />

          <List dense sx={{ mt: 2, maxHeight: '60vh', overflow: 'auto' }}>
            {filtered.map((s) => (
              <ListItemButton key={s.id} component="a" href={`#${s.id}`}>
                <ListItemText primary={s.title} />
              </ListItemButton>
            ))}
          </List>

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Print">
              <IconButton size="small" onClick={handlePrint}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as .txt">
              <IconButton size="small" onClick={handleDownload}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy to clipboard">
              <IconButton size="small" onClick={handleCopy}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '75%' } }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Privacy Policy
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <div ref={printableRef}>
            {filtered.map((s) => (
              <Accordion key={s.id} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
                  <Typography id={s.id} variant="h6">
                    {s.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {s.content}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2">
                This Privacy Policy describes how we collect, use, share and retain your personal data in connection with the Yaqeen Pay Wallet and Escrow services.
              </Typography>
            </Box>
          </div>
        </Box>
      </Box>
    </Container>
  );
};

export default Privacy;