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
    id: 'nature',
    title: '1. Nature of Wallet Credits',
    content:
      'Wallet Credits are a prepaid, rechargeable account balance maintained on the platform for the exclusive purpose of facilitating transactions and services offered through Yaqeen Pay. When a user loads Wallet Credits by making a payment to the platform’s designated merchant accounts (for example via Easypaisa, JazzCash or bank transfer), such funds are recorded as a credit balance on the platform. Wallet Credits do not constitute a bank account, deposit, electronic money issued by an EMI, or any other regulated deposit-taking instrument unless otherwise specified by applicable law. They represent the user’s right to instruct the platform to apply the credited funds within the ecosystem—such as paying for goods and services, funding Escrow, or settling marketplace fees—subject to the platform’s terms and applicable law.'
  },
  {
    id: 'escrow',
    title: '2. Escrow Service',
    content:
      'The platform provides an Escrow service intended to enhance transactional trust between Buyers and Sellers. When an order is placed and the Buyer elects to fund the order using Wallet Credits, the relevant amount is moved into a designated Escrow ledger entry pending fulfilment. Escrow funds are retained and accounted for separately in the platform ledger to reflect that they are earmarked for a specific transaction. During the Escrow period, Yaqeen Pay acts as a neutral intermediary: it holds the funds, facilitates dispute handling according to published rules, and releases or refunds the amount in accordance with the outcome of the transaction lifecycle.'
  },
  {
    id: 'release',
    title: '3. Release of Escrow Funds',
    content:
      'Escrowed funds will be released to the Seller upon confirmation of buyer acceptance, verified delivery evidence, or the expiration of any agreed acceptance window in the absence of a timely dispute. If a Buyer raises a timely and substantiated dispute in accordance with the platform’s dispute process, the platform will investigate and determine whether a refund to the Buyer or release to the Seller is appropriate under the rules. Platform fees, service charges or any agreed deductions will generally be applied at the point of release in accordance with the applicable fee schedule. Users should consult the platform’s published dispute resolution procedures to understand the evidentiary standards, timelines and possible outcomes.'
  },
  {
    id: 'withdrawal',
    title: '4. Withdrawal by Sellers',
    content:
      'Once Escrow funds are released to a Seller’s Wallet Credits, the Seller may request withdrawal to approved external payout destinations such as Easypaisa, JazzCash or a nominated bank account, subject to identity verification and anti-fraud checks. Withdrawal requests are processed as settlement transactions by the platform and may be subject to minimum thresholds, fees and processing timelines imposed by the platform or the payout partner. The timing of settlement to the Seller’s external account is dependent upon the payout channel and may vary accordingly. The platform reserves the right to delay or withhold settlement where there are reasonable grounds to suspect fraud, money laundering, or other unlawful activity, or where required by law.'
  },
  {
    id: 'legal',
    title: '5. Legal Position of Wallet Credits',
    content:
      'Wallet Credits represent a contractual obligation of the platform to provide services in return for the credited amount. Unless explicitly stated otherwise, Wallet Credits are not legal tender and are not regulated as bank deposits or electronic money issued by an EMI. The legal characterization of Wallet Credits may be subject to local law and regulation; users and businesses should consult legal counsel if they require clarification for regulatory or accounting purposes. By loading Wallet Credits, users acknowledge and agree that the nature and treatment of these balances are governed by the platform’s terms and applicable law.'
  },
  {
    id: 'liability',
    title: '6. Liability & Disputes',
    content:
      'To the fullest extent permitted by applicable law, the platform limits its liability in relation to transactions conducted on the marketplace. The platform is a facilitator of the Escrow service and does not warrant the quality, legality, or suitability of goods or services sold by Sellers. Except as required by law or where expressly provided in these terms, the platform disclaims liability for indirect, incidental, special or consequential damages, and limits remedies to the value of the Escrowed funds at issue. Disputes between Buyers and Sellers will be handled in accordance with the platform’s dispute resolution procedures; where appropriate, the platform may take corrective actions, including reversing settlements, issuing refunds, or suspending accounts pending investigation. Users should review the dispute policy for details on how claims are assessed and resolved.'
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