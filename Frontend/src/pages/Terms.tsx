import React, { useMemo, useState, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
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
    id: 'intro',
    title: '1. Introduction & Definitions',
    content:
      'These Terms and Conditions (Terms) govern your access to and use of Yaqeen Pay\'s technology platform, marketplace and related services. In these Terms: "Yaqeen Pay", "we", "us", or "our" refers to the Yaqeen Pay platform operator and its affiliates; "you" or "user" refers to any person who visits, registers for, or uses the platform; "Platform" means the website, apps, APIs and services we provide; "Wallet" means your account on the Platform where your balance is represented as Wallet Credits; "Wallet Credits" means the unit recorded in your Wallet used to transact within the Platform; "Escrow" means the transaction-hold service through which Wallet Credits are reserved until release conditions are met.\n\nYaqeen Pay is a technology provider and marketplace facilitator. We are not a bank, financial institution, or electronic money issuer, and we do not accept deposits or provide banking services. By using the Platform, you agree to these Terms and any policies referenced here.'
  },
  {
    id: 'nature',
    title: '2. Nature of Wallet Credits',
    content:
      'Wallet Credits are a prepaid, rechargeable balance maintained on the Platform solely to facilitate transactions and services offered through Yaqeen Pay. When you load Wallet Credits by paying into the Platform\'s designated collection channels (e.g., Easypaisa, JazzCash, or bank transfer), the amount received is recorded as Wallet Credits in your Wallet.\n\nImportant: Wallet Credits do not constitute a bank account, deposit, or electronic money issued by an EMI. They evidence your contractual right to instruct the Platform to apply the credited balance within the ecosystem—such as paying for goods and services, funding Escrow, or settling fees—subject to these Terms and applicable law. For reference and pricing consistency only, each Wallet Credit is denominated on a 1:1 basis with Pakistani Rupees (PKR). Your balance is maintained and displayed exclusively as Wallet Credits (not as PKR or any other currency).'
  },
  {
    id: 'escrow',
  title: '3. Escrow Service',
    content:
  'The Platform provides an Escrow service to enhance transactional trust between Buyers and Sellers. When an order is placed and the Buyer uses Wallet Credits, the relevant amount is moved into a designated Escrow ledger entry pending fulfilment. Escrowed amounts are earmarked for a specific transaction and accounted for separately in the Platform ledger. During the Escrow period, Yaqeen Pay acts as a neutral intermediary: we retain the amount, facilitate disputes according to published rules, and release or refund in line with transaction outcomes.'
  },
  {
    id: 'release',
  title: '4. Release of Escrowed Credits',
    content:
  'Escrowed amounts are released to the Seller upon: (a) buyer acceptance/confirmation, (b) verified delivery evidence, or (c) expiration of the acceptance window without a timely dispute. If a Buyer raises a timely and substantiated dispute, the Platform will investigate and determine whether a refund to the Buyer or a release to the Seller is appropriate under the rules. Any applicable charges or deductions are applied in accordance with the Schedule of Charges.'
  },
  {
    id: 'withdrawal',
    title: '5. Withdrawal by Sellers',
    content:
      'Once Escrow amounts are released to a Seller\'s Wallet Credits, the Seller may request withdrawal to approved payout destinations (e.g., Easypaisa, JazzCash, or a nominated bank account), subject to identity verification and anti-fraud checks. Withdrawal requests are processed as settlement transactions and may be subject to minimum thresholds and processing timelines. As set out in the Schedule of Charges, a platform fee of 1% applies to withdrawals and is typically deducted from the withdrawal amount at the time of processing. We may delay or withhold settlement if we have reasonable grounds to suspect fraud, money laundering, or other unlawful activity, or where required by law.'
  },
  {
    id: 'legal',
    title: '6. Legal Position of Wallet Credits',
    content:
      'Wallet Credits represent a contractual obligation of the Platform to provide services in return for the credited balance. Unless explicitly stated otherwise, Wallet Credits are not legal tender and are not regulated as bank deposits or electronic money issued by an EMI. The characterization of Wallet Credits may be subject to local law and regulation; users and businesses should consult their advisers for regulatory or accounting treatment. By loading Wallet Credits, you acknowledge and agree to their nature and treatment under these Terms and applicable law.'
  },
  {
    id: 'liability',
    title: '7. Liability & Disputes',
    content:
      'To the fullest extent permitted by law, the Platform limits its liability in relation to marketplace transactions. We facilitate Escrow but do not warrant the quality, legality, or suitability of goods or services sold by Sellers. Except as required by law or expressly provided in these Terms, the Platform disclaims liability for indirect, incidental, special, or consequential damages and limits remedies to the value of the Escrowed amount at issue. Disputes between Buyers and Sellers are handled under our dispute resolution procedures; we may take corrective actions, including reversing settlements, issuing refunds, or suspending accounts pending investigation.'
  },
  {
    id: 'fees',
    title: '8. Schedule of Charges',
    content:
      'Unless expressly stated otherwise, the following platform charges apply:\n\n- Top-up (adding Wallet Credits): 0% (no platform charges)\n- Purchases and sales within the marketplace: 0% (no platform charges)\n- Withdrawal from Wallet Credits to an external account: 1% of the withdrawn amount (deducted at the time of processing)\n- Denomination reference: 1 Wallet Credit = PKR 1 (for reference only; balances are maintained as Wallet Credits, not as PKR)\n\nFees may be updated from time to time with notice on the Platform. Any taxes required by law will be applied in addition to the charges above, where applicable.'
  },
];

const Terms: React.FC = () => {
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
    printWindow.document.write('<html><head><title>Terms</title>');
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
    a.download = 'terms-and-conditions.txt';
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
          <TextField size="small" placeholder="Search terms..." fullWidth value={query} onChange={(e) => setQuery(e.target.value)} />

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
            Terms and Conditions
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
                By using Yaqeen Pay’s Wallet and Escrow services, users agree to these terms. Yaqeen Pay reserves the right to modify these terms with notice to users.
              </Typography>
            </Box>
          </div>
        </Box>
      </Box>
    </Container>
  );
};

export default Terms;