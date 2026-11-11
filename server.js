const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const libre = require('libreoffice-convert');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

async function compressPDF(inputPath, outputPath) {
  try {
    const existingPdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: false
    });
    
    await fs.writeFile(outputPath, pdfBytes);
    
    const originalSize = (await fs.stat(inputPath)).size;
    const compressedSize = (await fs.stat(outputPath)).size;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
    
    return {
      originalSize,
      compressedSize,
      compressionRatio
    };
  } catch (error) {
    console.error('Eroare la comprimarea PDF:', error);
    throw new Error('Nu s-a putut comprima PDF-ul');
  }
}

async function convertToPDF(inputPath, inputExtension) {
  try {
    const inputBuffer = await fs.readFile(inputPath);
    
    const ext = inputExtension.toLowerCase().replace('.', '');
    
    return new Promise((resolve, reject) => {
      libre.convert(inputBuffer, '.pdf', undefined, (err, pdfBuffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(pdfBuffer);
        }
      });
    });
  } catch (error) {
    console.error('Eroare la conversia în PDF:', error);
    throw new Error('Nu s-a putut converti documentul în PDF');
  }
}

app.post('/api/convert', upload.single('file'), async (req, res) => {
  let uploadedFilePath = null;
  let outputFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nu a fost încărcat niciun fișier' });
    }

    uploadedFilePath = req.file.path;
    const originalName = req.file.originalname;
    const fileExtension = path.extname(originalName).toLowerCase();
    
    const allowedExtensions = ['.doc', '.docx', '.pdf'];
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        error: 'Format de fișier neacceptat. Folosiți doar DOC, DOCX sau PDF' 
      });
    }

    const outputFileName = `${path.basename(originalName, fileExtension)}_processed.pdf`;
    outputFilePath = path.join('uploads', outputFileName);

    if (fileExtension === '.pdf') {
      const stats = await compressPDF(uploadedFilePath, outputFilePath);
      
      const pdfData = await fs.readFile(outputFilePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
      res.setHeader('X-Original-Size', stats.originalSize);
      res.setHeader('X-Compressed-Size', stats.compressedSize);
      res.setHeader('X-Compression-Ratio', stats.compressionRatio);
      
      res.send(pdfData);
    } else {
      const pdfBuffer = await convertToPDF(uploadedFilePath, fileExtension);
      
      await fs.writeFile(outputFilePath, pdfBuffer);
      
      const stats = await fs.stat(outputFilePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
      res.setHeader('X-File-Size', stats.size);
      
      res.send(pdfBuffer);
    }

    await fs.unlink(uploadedFilePath);
    await fs.unlink(outputFilePath);

  } catch (error) {
    console.error('Eroare:', error);
    
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (e) {}
    }
    
    if (outputFilePath) {
      try {
        await fs.unlink(outputFilePath);
      } catch (e) {}
    }
    
    res.status(500).json({ 
      error: error.message || 'A apărut o eroare la procesarea fișierului' 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serverul funcționează corect' });
});

async function ensureUploadsDir() {
  try {
    await fs.mkdir('uploads', { recursive: true });
  } catch (error) {
    console.error('Eroare la crearea directorului uploads:', error);
  }
}

ensureUploadsDir().then(() => {
  app.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
  });
});
