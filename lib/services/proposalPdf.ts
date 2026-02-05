import crypto from "crypto";
import { jsPDF } from "jspdf";

// Types for proposal data
interface ScopeSection {
  title: string;
  items: string[];
}

interface LineItem {
  serviceId?: string;
  tradeName: string;
  jobTypeName: string;
  scope: string[];
  scopeSections?: ScopeSection[];
  priceLow?: number;
  priceHigh?: number;
  priceRange?: { low: number; high: number };
  estimatedDaysLow?: number;
  estimatedDaysHigh?: number;
  estimatedDays?: { low: number; high: number };
  warranty?: string;
  exclusions?: string[];
}

type ProposalData = {
  id: number;
  clientName: string;
  address: string;
  jobTypeName: string;
  scope: string[];
  scopeSections?: ScopeSection[];
  lineItems?: LineItem[];
  isMultiService?: boolean;
  priceLow: number;
  priceHigh: number;
  status: string;
  createdAt: Date | null;
  acceptedAt?: Date | null;
  acceptedByName?: string | null;
  signature?: string | null;
  contractorSignature?: string | null;
  estimatedDaysLow?: number | null;
  estimatedDaysHigh?: number | null;
  warranty?: string | null;
  exclusions?: string[] | null;
};

type CompanyInfo = {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  licenseNumber?: string | null;
  companyLogo?: string | null;
};

function slugifyFilenamePart(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function formatLongDateUTC(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatShortDateUTC(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function sha256Hex(bytes: ArrayBuffer): string {
  return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

export function buildProposalPdf(params: {
  proposal: ProposalData;
  companyInfo: CompanyInfo | null;
  isPro?: boolean;
}): { pdfBytes: ArrayBuffer; filename: string; sha256: string } {
  const { proposal, companyInfo } = params;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
    compress: false,
    putOnlyUsedFonts: true,
  });

  // Stabilize PDF trailer/metadata for stable bytes across requests.
  try {
    pdf.setCreationDate("D:20000101000000Z");
  } catch {
    // ignore
  }
  try {
    pdf.setFileId("00000000000000000000000000000000");
  } catch {
    // ignore
  }
  try {
    pdf.setProperties({
      title: `Proposal #${proposal.id}`,
      subject: "Proposal PDF",
      creator: "ScopeGen",
      author: "ScopeGen",
      keywords: "proposal,scopegen",
    });
  } catch {
    // Older jsPDF builds may not support setProperties in server mode
  }

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors (hex format)
  const primaryColor = "#1e3a5f";
  const secondaryColor = "#f97316";
  const textColor = "#333333";
  const lightGray = "#666666";
  const sectionBg = "#f8fafc";

  // Helper functions
  const setFont = (style: "normal" | "bold" = "normal", size = 10) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : { r: 0, g: 0, b: 0 };
  };

  const setTextColorHex = (hex: string) => {
    const rgb = hexToRgb(hex);
    pdf.setTextColor(rgb.r, rgb.g, rgb.b);
  };

  const setFillColorHex = (hex: string) => {
    const rgb = hexToRgb(hex);
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
  };

  const setDrawColorHex = (hex: string) => {
    const rgb = hexToRgb(hex);
    pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
  };

  const addText = (
    text: string,
    x: number,
    yPos: number,
    options?: { maxWidth?: number; align?: "left" | "center" | "right" },
  ): number => {
    if (options?.maxWidth) {
      const lines = pdf.splitTextToSize(text, options.maxWidth);
      pdf.text(lines, x, yPos, { align: options.align });
      return lines.length * (pdf.getFontSize() * 0.4);
    }
    pdf.text(text, x, yPos, { align: options?.align });
    return pdf.getFontSize() * 0.4;
  };

  const checkPageBreak = (neededSpace: number): boolean => {
    if (y + neededSpace > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Check if multi-service proposal
  const isMultiService = proposal.lineItems && proposal.lineItems.length > 1;

  // --- HEADER ---
  setFillColorHex(primaryColor);
  pdf.rect(0, 0, pageWidth, 35, "F");

  pdf.setTextColor(255, 255, 255);
  setFont("bold", 24);
  addText("PROPOSAL", margin, 22);

  setFont("normal", 10);
  const proposalNumber = String(proposal.id).padStart(4, "0");
  addText(`#${proposalNumber}`, margin, 30);

  // Company info (right side of header)
  // Try to add company logo if available
  let logoRendered = false;
  if (companyInfo?.companyLogo) {
    try {
      // Add logo image in the header (right side)
      // Logo should be max 30mm wide and 20mm tall to fit in header
      const logoWidth = 30;
      const logoHeight = 15;
      const logoX = pageWidth - margin - logoWidth;
      const logoY = 5;

      pdf.addImage(companyInfo.companyLogo, "PNG", logoX, logoY, logoWidth, logoHeight);
      logoRendered = true;

      // Add company name below logo if available
      if (companyInfo.companyName) {
        pdf.setTextColor(255, 255, 255);
        setFont("bold", 9);
        const companyNameWidth = pdf.getTextWidth(companyInfo.companyName);
        addText(companyInfo.companyName, pageWidth - margin - companyNameWidth, 26);
      }

      // Add license number if available
      if (companyInfo.licenseNumber) {
        setFont("normal", 7);
        const licText = `Lic# ${companyInfo.licenseNumber}`;
        const licWidth = pdf.getTextWidth(licText);
        addText(licText, pageWidth - margin - licWidth, 31);
      }
    } catch (e) {
      console.error('[PDF] Failed to add company logo:', e);
      logoRendered = false;
    }
  }

  // If no logo or logo failed, show text-based company info
  if (!logoRendered && companyInfo?.companyName) {
    pdf.setTextColor(255, 255, 255);
    setFont("bold", 12);
    const companyNameWidth = pdf.getTextWidth(companyInfo.companyName);
    addText(companyInfo.companyName, pageWidth - margin - companyNameWidth, 18);

    setFont("normal", 8);
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
  setTextColorHex(lightGray);
  setFont("bold", 8);
  addText("PREPARED FOR", margin, y);

  setTextColorHex(textColor);
  setFont("bold", 14);
  y += 6;
  addText(proposal.clientName, margin, y);

  setFont("normal", 10);
  y += 5;
  const addressLines = pdf.splitTextToSize(proposal.address, contentWidth / 2);
  pdf.text(addressLines, margin, y);
  const addressHeight = addressLines.length * 4;

  // Date and job type (right side)
  setTextColorHex(lightGray);
  setFont("bold", 8);
  addText("DATE", pageWidth - margin - 50, y - 11, { align: "left" });

  setTextColorHex(textColor);
  setFont("normal", 10);
  const createdAt = proposal.createdAt ? new Date(proposal.createdAt) : new Date();
  addText(formatLongDateUTC(createdAt), pageWidth - margin - 50, y - 6);

  setTextColorHex(lightGray);
  setFont("bold", 8);
  addText("JOB TYPE", pageWidth - margin - 50, y + 2, { align: "left" });

  setTextColorHex(textColor);
  setFont("normal", 10);
  const jobTypeDisplay = isMultiService
    ? `Multi-Service (${proposal.lineItems!.length} services)`
    : proposal.jobTypeName;
  addText(jobTypeDisplay, pageWidth - margin - 50, y + 7, { maxWidth: 50 });

  y += Math.max(addressHeight, 15) + 10;

  // --- TIMELINE (if available) ---
  if (proposal.estimatedDaysLow || proposal.estimatedDaysHigh) {
    setFillColorHex("#e0f2fe");
    setDrawColorHex("#0284c7");
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, "FD");

    setTextColorHex("#0369a1");
    setFont("bold", 10);
    const timelineText =
      proposal.estimatedDaysLow === proposal.estimatedDaysHigh
        ? `Estimated Timeline: ${proposal.estimatedDaysLow} working days`
        : `Estimated Timeline: ${proposal.estimatedDaysLow}-${proposal.estimatedDaysHigh} working days`;
    addText(timelineText, margin + 5, y + 8);
    y += 18;
  }

  // --- MULTI-SERVICE SUMMARY TABLE ---
  if (isMultiService && proposal.lineItems) {
    checkPageBreak(60);

    setFillColorHex(primaryColor);
    pdf.rect(margin, y, contentWidth, 8, "F");
    pdf.setTextColor(255, 255, 255);
    setFont("bold", 10);
    addText("SERVICES INCLUDED", margin + 3, y + 5.5);
    y += 12;

    // Table header
    setFillColorHex("#e2e8f0");
    pdf.rect(margin, y, contentWidth, 7, "F");
    setTextColorHex(textColor);
    setFont("bold", 9);
    addText("Service", margin + 3, y + 5);
    addText("Est. Days", margin + contentWidth * 0.6, y + 5);
    addText("Price", margin + contentWidth * 0.82, y + 5);
    y += 9;

    // Table rows
    proposal.lineItems.forEach((item, index) => {
      checkPageBreak(10);
      if (index % 2 === 1) {
        setFillColorHex("#f8fafc");
        pdf.rect(margin, y - 2, contentWidth, 8, "F");
      }

      setTextColorHex(textColor);
      setFont("normal", 9);

      // Service name
      addText(item.jobTypeName, margin + 3, y + 3, { maxWidth: contentWidth * 0.55 });

      // Trade name (smaller, below)
      setTextColorHex(lightGray);
      setFont("normal", 7);
      addText(item.tradeName, margin + 3, y + 7);

      // Days
      setTextColorHex(textColor);
      setFont("normal", 9);
      const daysLow = item.estimatedDaysLow ?? item.estimatedDays?.low ?? 0;
      const daysHigh = item.estimatedDaysHigh ?? item.estimatedDays?.high ?? 0;
      const daysText = daysLow === daysHigh ? `${daysLow}` : `${daysLow}-${daysHigh}`;
      addText(daysText, margin + contentWidth * 0.65, y + 5);

      // Price
      const priceLow = item.priceLow ?? item.priceRange?.low ?? 0;
      const priceHigh = item.priceHigh ?? item.priceRange?.high ?? 0;
      const avgPrice = Math.round((priceLow + priceHigh) / 2);
      setFont("bold", 9);
      addText(formatCurrency(avgPrice), margin + contentWidth * 0.82, y + 5);

      y += 10;
    });

    // Total row
    setFillColorHex("#dbeafe");
    pdf.rect(margin, y - 1, contentWidth, 9, "F");
    setTextColorHex(textColor);
    setFont("bold", 10);
    addText("TOTAL", margin + 3, y + 5);

    const totalDaysLow = proposal.estimatedDaysLow ?? 0;
    const totalDaysHigh = proposal.estimatedDaysHigh ?? 0;
    const totalDaysText =
      totalDaysLow === totalDaysHigh ? `${totalDaysLow}` : `${totalDaysLow}-${totalDaysHigh}`;
    addText(totalDaysText, margin + contentWidth * 0.65, y + 5);

    const totalAvgPrice = Math.round((proposal.priceLow + proposal.priceHigh) / 2);
    setFillColorHex(primaryColor);
    setTextColorHex(primaryColor);
    setFont("bold", 11);
    addText(formatCurrency(totalAvgPrice), margin + contentWidth * 0.82, y + 5);

    y += 15;
  }

  // --- SCOPE OF WORK ---
  checkPageBreak(30);

  setFillColorHex(primaryColor);
  pdf.rect(margin, y, contentWidth, 8, "F");
  pdf.setTextColor(255, 255, 255);
  setFont("bold", 10);
  addText("SCOPE OF WORK", margin + 3, y + 5.5);
  y += 14;

  setTextColorHex(lightGray);
  setFont("normal", 9);
  addText(
    "We propose to furnish all materials and perform all labor necessary to complete the following:",
    margin,
    y,
    { maxWidth: contentWidth },
  );
  y += 10;

  // Render scope items
  if (isMultiService && proposal.lineItems) {
    // Multi-service: Show each service's scope separately
    proposal.lineItems.forEach((item, serviceIndex) => {
      checkPageBreak(25);

      // Service header
      setFillColorHex(secondaryColor);
      pdf.rect(margin, y - 1, 4, 8, "F");
      setTextColorHex(textColor);
      setFont("bold", 10);
      const titleText = `${serviceIndex + 1}. ${item.jobTypeName}`;
      addText(titleText, margin + 8, y + 4);
      const titleWidth = pdf.getTextWidth(titleText);

      setTextColorHex(lightGray);
      setFont("normal", 8);
      addText(`(${item.tradeName})`, margin + 8 + titleWidth + 3, y + 4);
      y += 12;

      // Scope items for this service
      const scopeItems = item.scopeSections && item.scopeSections.length > 0
        ? item.scopeSections.flatMap(s => s.items)
        : item.scope;

      setTextColorHex(textColor);
      setFont("normal", 9);

      for (const scopeItem of scopeItems) {
        checkPageBreak(10);

        // Bullet point
        setFillColorHex(secondaryColor);
        pdf.circle(margin + 4, y - 1, 1.2, "F");

        // Text
        const lineHeight = addText(scopeItem, margin + 10, y, { maxWidth: contentWidth - 10 });
        y += Math.max(lineHeight, 5) + 1.5;
      }

      y += 5;
    });
  } else {
    // Single service or legacy: Show flat scope list or grouped sections
    setTextColorHex(textColor);
    setFont("normal", 9);

    if (proposal.scopeSections && proposal.scopeSections.length > 0) {
      // Grouped sections
      for (const section of proposal.scopeSections) {
        checkPageBreak(20);

        // Section header
        setTextColorHex(textColor);
        setFont("bold", 9);
        addText(section.title.toUpperCase(), margin, y);
        y += 6;

        setFont("normal", 9);
        for (const item of section.items) {
          checkPageBreak(8);
          setFillColorHex(secondaryColor);
          pdf.circle(margin + 2, y - 1, 1.2, "F");
          const lineHeight = addText(item, margin + 7, y, { maxWidth: contentWidth - 7 });
          y += Math.max(lineHeight, 5) + 1.5;
        }
        y += 4;
      }
    } else {
      // Flat scope list
      const scope = proposal.scope || [];
      for (const item of scope) {
        checkPageBreak(10);

        // Bullet point
        setFillColorHex(secondaryColor);
        pdf.circle(margin + 2, y - 1, 1.5, "F");

        // Text
        const lineHeight = addText(item, margin + 7, y, { maxWidth: contentWidth - 7 });
        y += Math.max(lineHeight, 5) + 2;
      }
    }
  }

  y += 5;

  // --- EXCLUSIONS SECTION ---
  const exclusions = proposal.exclusions || [];
  if (exclusions.length > 0) {
    checkPageBreak(25);

    setFillColorHex("#fef3c7");
    setDrawColorHex("#d97706");
    pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, "FD");
    setTextColorHex("#92400e");
    setFont("bold", 9);
    addText("NOT INCLUDED", margin + 3, y + 5.5);
    y += 12;

    setFillColorHex("#fffbeb");
    const exclusionStartY = y;
    let exclusionHeight = 4;

    setTextColorHex("#92400e");
    setFont("normal", 8);
    for (const item of exclusions) {
      addText(`• ${item}`, margin + 5, y + exclusionHeight, { maxWidth: contentWidth - 10 });
      exclusionHeight += 5;
    }
    exclusionHeight += 3;

    pdf.roundedRect(margin, exclusionStartY, contentWidth, exclusionHeight, 2, 2, "F");

    // Re-render text on top of background
    exclusionHeight = 4;
    for (const item of exclusions) {
      addText(`• ${item}`, margin + 5, exclusionStartY + exclusionHeight, { maxWidth: contentWidth - 10 });
      exclusionHeight += 5;
    }

    y = exclusionStartY + exclusionHeight + 5;
  }

  // --- WARRANTY SECTION ---
  if (proposal.warranty) {
    checkPageBreak(25);

    setFillColorHex("#dcfce7");
    setDrawColorHex("#16a34a");
    pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, "FD");
    setTextColorHex("#166534");
    setFont("bold", 9);
    addText("WARRANTY", margin + 3, y + 5.5);
    y += 12;

    setFillColorHex("#f0fdf4");
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
    setTextColorHex("#166534");
    setFont("normal", 9);
    addText(proposal.warranty, margin + 5, y + 8, { maxWidth: contentWidth - 10 });
    y += 18;
  }

  // --- INVESTMENT SECTION (for single service) ---
  if (!isMultiService) {
    checkPageBreak(40);

    setFillColorHex(primaryColor);
    pdf.rect(margin, y, contentWidth, 8, "F");
    pdf.setTextColor(255, 255, 255);
    setFont("bold", 10);
    addText("INVESTMENT", margin + 3, y + 5.5);
    y += 14;

    // Price box
    setFillColorHex(sectionBg);
    setDrawColorHex("#e2e8f0");
    pdf.roundedRect(margin, y, contentWidth, 25, 2, 2, "FD");

    setTextColorHex(lightGray);
    setFont("normal", 9);
    addText("Total Project Estimate", margin + 5, y + 8);

    setTextColorHex(textColor);
    setFont("bold", 18);
    const avgPrice = Math.round((proposal.priceLow + proposal.priceHigh) / 2);
    const priceStr = formatCurrency(avgPrice);
    addText(priceStr, pageWidth - margin - 5 - pdf.getTextWidth(priceStr), y + 16);

    setTextColorHex(lightGray);
    setFont("normal", 7);
    addText(
      "*Price includes all labor, materials, and taxes as specified above. Valid for 30 days.",
      margin + 5,
      y + 22,
    );

    y += 32;
  }

  // --- TERMS & CONDITIONS ---
  checkPageBreak(50);

  setTextColorHex(lightGray);
  setFont("bold", 8);
  addText("TERMS & CONDITIONS", margin, y);
  y += 5;

  setFont("normal", 8);
  const terms = [
    "Payment terms: 50% deposit due upon acceptance, balance due upon completion.",
    "Any changes to the scope of work may result in additional charges.",
    "Work schedule subject to weather conditions and material availability.",
    "Customer to provide access to work area and utilities as needed.",
    "All permits to be obtained by contractor unless otherwise specified.",
  ];

  for (let i = 0; i < terms.length; i++) {
    checkPageBreak(6);
    addText(`${i + 1}. ${terms[i]}`, margin, y, { maxWidth: contentWidth });
    y += 5;
  }

  y += 10;

  // --- SIGNATURE SECTION ---
  checkPageBreak(40);

  setDrawColorHex("#e2e8f0");
  pdf.line(margin, y, margin + contentWidth / 2 - 10, y);
  pdf.line(margin + contentWidth / 2 + 10, y, pageWidth - margin, y);

  y += 5;
  setTextColorHex(lightGray);
  setFont("bold", 7);
  addText("CONTRACTOR SIGNATURE", margin, y);
  addText("CLIENT SIGNATURE", margin + contentWidth / 2 + 10, y);

  // Add signatures if present
  if (proposal.contractorSignature) {
    try {
      pdf.addImage(proposal.contractorSignature, "PNG", margin, y - 20, 50, 15);
    } catch {
      // Signature image failed to load
    }
  }

  if (proposal.signature) {
    try {
      pdf.addImage(proposal.signature, "PNG", margin + contentWidth / 2 + 10, y - 20, 50, 15);
    } catch {
      // Signature image failed to load
    }
  }

  y += 15;

  // --- FOOTER ---
  setTextColorHex(lightGray);
  setFont("normal", 8);
  addText("This proposal is valid for 30 days from the date above.", pageWidth / 2, y, {
    align: "center",
  });

  if (!params.isPro) {
    y += 10;
    setFont("normal", 7);
    addText("Powered by ScopeGen - Professional proposals in seconds", pageWidth / 2, y, {
      align: "center",
    });
  }

  // Accepted status badge
  if (proposal.status === "accepted" && proposal.acceptedAt) {
    setFillColorHex("#dcfce7");
    setDrawColorHex("#22c55e");
    pdf.roundedRect(pageWidth - margin - 45, 40, 45, 15, 2, 2, "FD");

    setTextColorHex("#16a34a");
    setFont("bold", 8);
    addText("✓ ACCEPTED", pageWidth - margin - 40, 48);

    setFont("normal", 6);
    addText(formatShortDateUTC(new Date(proposal.acceptedAt)), pageWidth - margin - 40, 52);
  }

  const pdfBytes = pdf.output("arraybuffer");
  const sha256 = sha256Hex(pdfBytes);
  const filename = `proposal-${slugifyFilenamePart(proposal.clientName)}-${proposal.id}.pdf`;

  return { pdfBytes, filename, sha256 };
}
