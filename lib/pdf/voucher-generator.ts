import { PDFDocument, rgb } from "pdf-lib";

export interface VoucherData {
  userId: string;
  userName: string;
  transactionId: string;
  amount: number;
  service: string;
  paymentMethod: string;
  date: Date;
  reference?: string;
}

export async function generateVoucher(data: VoucherData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points
  const { height } = page.getSize();

  // Colors
  const primaryColor = rgb(0.05, 0.5, 0.82); // Cyan
  const textColor = rgb(0.1, 0.1, 0.1); // Dark gray
  const lightColor = rgb(0.95, 0.95, 0.95); // Light gray

  // Header
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: 595,
    height: 120,
    color: primaryColor,
  });

  page.drawText("COMPROBANTE DE PAGO", {
    x: 50,
    y: height - 60,
    size: 28,
    color: rgb(1, 1, 1),
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  // Company info
  let yPosition = height - 160;
  page.drawText("PagoIA - Gestión de Pagos", {
    x: 50,
    y: yPosition,
    size: 14,
    color: textColor,
    font: await pdfDoc.embedFont("Helvetica-Bold"),
  });

  yPosition -= 25;
  page.drawText("RFC: XXX-XXXXXXX-XXX", {
    x: 50,
    y: yPosition,
    size: 11,
    color: textColor,
  });

  yPosition -= 20;
  page.drawText("https://pago-ia.com", {
    x: 50,
    y: yPosition,
    size: 11,
    color: textColor,
  });

  // Divider
  yPosition -= 25;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: lightColor,
  });

  // Transaction details
  yPosition -= 35;
  const detailsFont = await pdfDoc.embedFont("Helvetica");
  const detailsBoldFont = await pdfDoc.embedFont("Helvetica-Bold");

  const details = [
    { label: "No. de Transacción:", value: data.transactionId },
    { label: "Fecha:", value: data.date.toLocaleDateString("es-MX") },
    { label: "Hora:", value: data.date.toLocaleTimeString("es-MX") },
  ];

  for (const detail of details) {
    page.drawText(detail.label, {
      x: 50,
      y: yPosition,
      size: 11,
      color: textColor,
      font: detailsBoldFont,
    });

    page.drawText(detail.value, {
      x: 250,
      y: yPosition,
      size: 11,
      color: textColor,
      font: detailsFont,
    });

    yPosition -= 22;
  }

  // Divider
  yPosition -= 15;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: lightColor,
  });

  // Client info
  yPosition -= 30;
  page.drawText("DATOS DEL CLIENTE", {
    x: 50,
    y: yPosition,
    size: 12,
    color: textColor,
    font: detailsBoldFont,
  });

  yPosition -= 25;
  page.drawText("Nombre:", {
    x: 50,
    y: yPosition,
    size: 10,
    color: textColor,
  });
  page.drawText(data.userName, {
    x: 150,
    y: yPosition,
    size: 10,
    color: textColor,
  });

  yPosition -= 22;
  page.drawText("ID Usuario:", {
    x: 50,
    y: yPosition,
    size: 10,
    color: textColor,
  });
  page.drawText(data.userId, {
    x: 150,
    y: yPosition,
    size: 9,
    color: textColor,
  });

  // Divider
  yPosition -= 25;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: lightColor,
  });

  // Service details
  yPosition -= 30;
  page.drawText("DETALLES DEL SERVICIO", {
    x: 50,
    y: yPosition,
    size: 12,
    color: textColor,
    font: detailsBoldFont,
  });

  yPosition -= 25;
  page.drawText("Servicio:", {
    x: 50,
    y: yPosition,
    size: 11,
    color: textColor,
  });
  page.drawText(data.service, {
    x: 250,
    y: yPosition,
    size: 11,
    color: textColor,
    font: detailsBoldFont,
  });

  if (data.reference) {
    yPosition -= 22;
    page.drawText("Referencia:", {
      x: 50,
      y: yPosition,
      size: 11,
      color: textColor,
    });
    page.drawText(data.reference, {
      x: 250,
      y: yPosition,
      size: 11,
      color: textColor,
    });
  }

  yPosition -= 22;
  page.drawText("Método de Pago:", {
    x: 50,
    y: yPosition,
    size: 11,
    color: textColor,
  });
  page.drawText(data.paymentMethod, {
    x: 250,
    y: yPosition,
    size: 11,
    color: textColor,
  });

  // Amount box
  yPosition -= 35;
  page.drawRectangle({
    x: 50,
    y: yPosition - 60,
    width: 495,
    height: 70,
    color: primaryColor,
    opacity: 0.1,
    borderColor: primaryColor,
    borderWidth: 2,
  });

  const amountYPosition = yPosition - 30;
  page.drawText("MONTO A PAGAR", {
    x: 60,
    y: amountYPosition,
    size: 11,
    color: textColor,
    font: detailsBoldFont,
  });

  page.drawText(`$${data.amount.toFixed(2)} MXN`, {
    x: 60,
    y: amountYPosition - 28,
    size: 32,
    color: primaryColor,
    font: detailsBoldFont,
  });

  // Footer
  const footerY = 50;
  page.drawLine({
    start: { x: 50, y: footerY + 30 },
    end: { x: 545, y: footerY + 30 },
    thickness: 1,
    color: lightColor,
  });

  page.drawText("Este comprobante es válido como recibo de pago.", {
    x: 50,
    y: footerY + 10,
    size: 9,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText("Para consultas sobre este comprobante, contacta a soporte@pago-ia.com", {
    x: 50,
    y: footerY - 5,
    size: 9,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(`Generado: ${new Date().toLocaleString("es-MX")}`, {
    x: 50,
    y: footerY - 20,
    size: 8,
    color: rgb(0.7, 0.7, 0.7),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
