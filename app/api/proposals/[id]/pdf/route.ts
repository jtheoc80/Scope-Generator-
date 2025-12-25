import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { jsPDF } from 'jspdf';

// Server-side PDF generation for proposals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const proposalId = parseInt(id);
    
    if (isNaN(proposalId)) {
      return NextResponse.json(
        { message: 'Invalid proposal ID' },
        { status: 400 }
      );
    }

    // Get proposal - allow public access if token is provided
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    let proposal;
    let companyInfo = null;
    
    if (token) {
      // Public access via token
      proposal = await storage.getProposalByPublicToken(token);
      if (proposal) {
        const user = await storage.getUser(proposal.userId);
        companyInfo = user ? {
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          companyPhone: user.companyPhone,
          licenseNumber: user.licenseNumber,
        } : null;
      }
    } else if (userId) {
      // Authenticated access
      proposal = await storage.getProposal(proposalId);
      if (proposal && proposal.userId !== userId) {
        return NextResponse.json(
          { message: 'Access denied' },
          { status: 403 }
        );
      }
      if (proposal) {
        const user = await storage.getUser(userId);
        companyInfo = user ? {
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          companyPhone: user.companyPhone,
          licenseNumber: user.licenseNumber,
        } : null;
      }
    } else {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdf = generateProposalPDF(proposal, companyInfo);
    const pdfBuffer = pdf.output('arraybuffer');

    // Return PDF
    const filename = `proposal-${proposal.clientName.replace(/\s+/g, '-').toLowerCase()}-${proposal.id}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { message: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

interface ProposalData {
  id: number;
  clientName: string;
  address: string;
  jobTypeName: string;
  scope: string[];
  priceLow: number;
  priceHigh: number;
  status: string;
  createdAt: Date | null;
  acceptedAt?: Date | null;
  acceptedByName?: string | null;
  signature?: string | null;
  contractorSignature?: string | null;
  lineItems?: unknown;
  isMultiService?: boolean;
  estimatedDaysLow?: number | null;
  estimatedDaysHigh?: number | null;
}

interface CompanyInfo {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  licenseNumber?: string | null;
}

function generateProposalPDF(proposal: ProposalData, companyInfo: CompanyInfo | null): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Colors
  const primaryColor = '#1e3a5f';
  const secondaryColor = '#f97316';
  const textColor = '#333333';
  const lightGray = '#666666';

  // Helper functions
  const setFont = (style: 'normal' | 'bold' = 'normal', size = 10) => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
  };

  const addText = (text: string, x: number, yPos: number, options?: { maxWidth?: number; align?: 'left' | 'center' | 'right' }) => {
    if (options?.maxWidth) {
      const lines = pdf.splitTextToSize(text, options.maxWidth);
      pdf.text(lines, x, yPos, { align: options.align });
      return lines.length * (pdf.getFontSize() * 0.4);
    }
    pdf.text(text, x, yPos, { align: options?.align });
    return pdf.getFontSize() * 0.4;
  };

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // --- HEADER ---
  pdf.setFillColor(primaryColor);
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  pdf.setTextColor('#ffffff');
  setFont('bold', 24);
  addText('PROPOSAL', margin, 22);
  
  setFont('normal', 10);
  const proposalNumber = String(proposal.id).padStart(4, '0');
  addText(`#${proposalNumber}`, margin, 30);

  // Company info (right side of header)
  if (companyInfo?.companyName) {
    pdf.setTextColor('#ffffff');
    setFont('bold', 12);
    const companyNameWidth = pdf.getTextWidth(companyInfo.companyName);
    addText(companyInfo.companyName, pageWidth - margin - companyNameWidth, 18);
    
    setFont('normal', 8);
    let companyY = 24;
    if (companyInfo.companyAddress) {
      const addrWidth = pdf.getTextWidth(companyInfo.companyAddress);
      addText(companyInfo.companyAddress, pageWidth - margin - addrWidth, companyY);
      companyY += 4;
    }
    if (companyInfo.companyPhone) {
      const phoneWidth = pdf.getTextWidth(companyInfo.companyPhone);
      addText(companyInfo.companyPhone, pageWidth - margin - phoneWidth, companyY);
      companyY += 4;
    }
    if (companyInfo.licenseNumber) {
      const licText = `Lic# ${companyInfo.licenseNumber}`;
      const licWidth = pdf.getTextWidth(licText);
      addText(licText, pageWidth - margin - licWidth, companyY);
    }
  }

  y = 50;

  // --- CLIENT INFO SECTION ---
  pdf.setTextColor(lightGray);
  setFont('bold', 8);
  addText('PREPARED FOR', margin, y);
  
  pdf.setTextColor(textColor);
  setFont('bold', 14);
  y += 6;
  addText(proposal.clientName, margin, y);
  
  setFont('normal', 10);
  y += 5;
  addText(proposal.address, margin, y);

  // Date and job type (right side)
  pdf.setTextColor(lightGray);
  setFont('bold', 8);
  addText('DATE', pageWidth - margin - 50, y - 11, { align: 'left' });
  
  pdf.setTextColor(textColor);
  setFont('normal', 10);
  const dateStr = proposal.createdAt 
    ? new Date(proposal.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  addText(dateStr, pageWidth - margin - 50, y - 6);

  pdf.setTextColor(lightGray);
  setFont('bold', 8);
  addText('JOB TYPE', pageWidth - margin - 50, y + 2, { align: 'left' });
  
  pdf.setTextColor(textColor);
  setFont('normal', 10);
  addText(proposal.jobTypeName, pageWidth - margin - 50, y + 7, { maxWidth: 50 });

  y += 20;

  // --- TIMELINE (if available) ---
  if (proposal.estimatedDaysLow || proposal.estimatedDaysHigh) {
    pdf.setFillColor('#e0f2fe');
    pdf.setDrawColor('#0284c7');
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');
    
    pdf.setTextColor('#0369a1');
    setFont('bold', 10);
    const timelineText = proposal.estimatedDaysLow === proposal.estimatedDaysHigh
      ? `Estimated Timeline: ${proposal.estimatedDaysLow} working days`
      : `Estimated Timeline: ${proposal.estimatedDaysLow}-${proposal.estimatedDaysHigh} working days`;
    addText(timelineText, margin + 5, y + 8);
    y += 18;
  }

  // --- SCOPE OF WORK ---
  checkPageBreak(30);
  
  pdf.setFillColor(primaryColor);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor('#ffffff');
  setFont('bold', 10);
  addText('SCOPE OF WORK', margin + 3, y + 5.5);
  y += 14;

  pdf.setTextColor(lightGray);
  setFont('normal', 9);
  addText('We propose to furnish all materials and perform all labor necessary to complete the following:', margin, y, { maxWidth: contentWidth });
  y += 10;

  // Scope items
  pdf.setTextColor(textColor);
  setFont('normal', 9);
  
  const scope = proposal.scope || [];
  for (const item of scope) {
    checkPageBreak(10);
    
    // Bullet point
    pdf.setFillColor(secondaryColor);
    pdf.circle(margin + 2, y - 1, 1.5, 'F');
    
    // Text
    const lineHeight = addText(item, margin + 7, y, { maxWidth: contentWidth - 7 });
    y += Math.max(lineHeight, 5) + 2;
  }

  y += 5;

  // --- INVESTMENT SECTION ---
  checkPageBreak(40);
  
  pdf.setFillColor(primaryColor);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setTextColor('#ffffff');
  setFont('bold', 10);
  addText('INVESTMENT', margin + 3, y + 5.5);
  y += 14;

  // Price box
  pdf.setFillColor('#f8fafc');
  pdf.setDrawColor('#e2e8f0');
  pdf.roundedRect(margin, y, contentWidth, 25, 2, 2, 'FD');
  
  pdf.setTextColor(lightGray);
  setFont('normal', 9);
  addText('Total Project Estimate', margin + 5, y + 8);
  
  pdf.setTextColor(textColor);
  setFont('bold', 18);
  const avgPrice = Math.round((proposal.priceLow + proposal.priceHigh) / 2);
  const priceStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(avgPrice);
  addText(priceStr, pageWidth - margin - 5 - pdf.getTextWidth(priceStr), y + 16);
  
  pdf.setTextColor(lightGray);
  setFont('normal', 7);
  addText('*Price includes all labor, materials, and taxes as specified above. Valid for 30 days.', margin + 5, y + 22);
  
  y += 32;

  // --- TERMS & CONDITIONS ---
  checkPageBreak(50);
  
  pdf.setTextColor(lightGray);
  setFont('bold', 8);
  addText('TERMS & CONDITIONS', margin, y);
  y += 5;

  setFont('normal', 8);
  const terms = [
    'Payment terms: 50% deposit due upon acceptance, balance due upon completion.',
    'Any changes to the scope of work may result in additional charges.',
    'Work schedule subject to weather conditions and material availability.',
    'Customer to provide access to work area and utilities as needed.',
    'All permits to be obtained by contractor unless otherwise specified.',
  ];

  for (let i = 0; i < terms.length; i++) {
    checkPageBreak(6);
    addText(`${i + 1}. ${terms[i]}`, margin, y, { maxWidth: contentWidth });
    y += 5;
  }

  y += 10;

  // --- SIGNATURE SECTION ---
  checkPageBreak(40);
  
  pdf.setDrawColor('#e2e8f0');
  pdf.line(margin, y, margin + (contentWidth / 2) - 10, y);
  pdf.line(margin + (contentWidth / 2) + 10, y, pageWidth - margin, y);
  
  y += 5;
  pdf.setTextColor(lightGray);
  setFont('bold', 7);
  addText('CONTRACTOR SIGNATURE', margin, y);
  addText('CLIENT SIGNATURE', margin + (contentWidth / 2) + 10, y);

  // Add signatures if present
  if (proposal.contractorSignature) {
    try {
      pdf.addImage(proposal.contractorSignature, 'PNG', margin, y - 20, 50, 15);
    } catch {
      // Signature image failed to load
    }
  }
  
  if (proposal.signature) {
    try {
      pdf.addImage(proposal.signature, 'PNG', margin + (contentWidth / 2) + 10, y - 20, 50, 15);
    } catch {
      // Signature image failed to load
    }
  }

  y += 15;

  // --- FOOTER ---
  pdf.setTextColor(lightGray);
  setFont('normal', 8);
  addText('This proposal is valid for 30 days from the date above.', pageWidth / 2, y, { align: 'center' });
  
  y += 10;
  setFont('normal', 7);
  addText('Powered by ScopeGen - Professional proposals in seconds', pageWidth / 2, y, { align: 'center' });

  // Accepted status badge
  if (proposal.status === 'accepted' && proposal.acceptedAt) {
    pdf.setFillColor('#dcfce7');
    pdf.setDrawColor('#22c55e');
    pdf.roundedRect(pageWidth - margin - 45, 40, 45, 15, 2, 2, 'FD');
    
    pdf.setTextColor('#16a34a');
    setFont('bold', 8);
    addText('✓ ACCEPTED', pageWidth - margin - 40, 48);
    
    setFont('normal', 6);
    const acceptedDate = new Date(proposal.acceptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    addText(acceptedDate, pageWidth - margin - 40, 52);
  }

  return pdf;
}
