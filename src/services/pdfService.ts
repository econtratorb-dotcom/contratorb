import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";

export const generateContractPDF = async (contrato: any, fornecedor: any, projeto: any, config: any) => {
  const doc = new jsPDF();
  
  // Header
  if (config.logo_base64) {
    doc.addImage(config.logo_base64, 'PNG', 10, 10, 30, 30);
  }
  
  doc.setFontSize(20);
  doc.text(config.empresa_nome || "Contrato de Prestação de Serviços", 50, 25);
  
  doc.setFontSize(12);
  doc.text(`Fornecedor: ${fornecedor.nome}`, 10, 50);
  doc.text(`CNPJ: ${fornecedor.cnpj}`, 10, 55);
  doc.text(`Projeto: ${projeto.nome}`, 10, 65);
  doc.text(`Valor: R$ ${contrato.valor}`, 10, 75);
  doc.text(`Prazo: ${contrato.prazo}`, 10, 80);
  
  doc.text("Cláusulas:", 10, 95);
  let y = 105;
  contrato.clausulas.forEach((clausula: string) => {
    const lines = doc.splitTextToSize(clausula, 180);
    doc.text(lines, 10, y);
    y += (lines.length * 7);
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text(config.rodape_texto || "Gerado por Sistema E-Contratado GRUPORB", 10, 280);
  
  return doc.output('arraybuffer');
};

export const mergePDFs = async (mainPdfBytes: ArrayBuffer, attachedPdfs: File[]) => {
  const mergedPdf = await PDFDocument.create();
  
  // Add main contract
  const mainPdf = await PDFDocument.load(mainPdfBytes);
  const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
  mainPages.forEach(page => mergedPdf.addPage(page));
  
  // Add attachments
  for (const file of attachedPdfs) {
    const fileBytes = await file.arrayBuffer();
    const attachmentPdf = await PDFDocument.load(fileBytes);
    const attachmentPages = await mergedPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
    attachmentPages.forEach(page => mergedPdf.addPage(page));
  }
  
  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
};
