const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create certificates directory if it doesn't exist
const certDir = './uploads/certificates';
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const generateCertificate = async (studentName, courseName, certificateId, issueDate) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // File path
      const fileName = `certificate-${certificateId}.pdf`;
      const filePath = path.join(certDir, fileName);

      // Pipe to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Design certificate
      // Border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(3)
         .stroke('#2563eb');

      // Title
      doc.fontSize(40)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('CERTIFICATE OF COMPLETION', 0, 100, {
           align: 'center'
         });

      // Subtitle
      doc.fontSize(16)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('This is to certify that', 0, 170, {
           align: 'center'
         });

      // Student name
      doc.fontSize(32)
         .fillColor('#0f172a')
         .font('Helvetica-Bold')
         .text(studentName, 0, 210, {
           align: 'center'
         });

      // Course completion text
      doc.fontSize(16)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('has successfully completed the course', 0, 260, {
           align: 'center'
         });

      // Course name
      doc.fontSize(24)
         .fillColor('#2563eb')
         .font('Helvetica-Bold')
         .text(courseName, 0, 300, {
           align: 'center'
         });

      // Issue date
      doc.fontSize(14)
         .fillColor('#475569')
         .font('Helvetica')
         .text(`Issued on: ${new Date(issueDate).toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         })}`, 0, 360, {
           align: 'center'
         });

      // Certificate ID
      doc.fontSize(10)
         .fillColor('#94a3b8')
         .text(`Certificate ID: ${certificateId}`, 0, doc.page.height - 100, {
           align: 'center'
         });

      // Signature line
      doc.moveTo(doc.page.width / 2 - 100, doc.page.height - 120)
         .lineTo(doc.page.width / 2 + 100, doc.page.height - 120)
         .stroke('#94a3b8');

      doc.fontSize(12)
         .fillColor('#64748b')
         .text('Authorized Signature', 0, doc.page.height - 110, {
           align: 'center'
         });

      // Finalize PDF
      doc.end();

      // Return file path when stream finishes
      stream.on('finish', () => {
        resolve(`/uploads/certificates/${fileName}`);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateCertificate };
