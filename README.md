# Aplicație de Conversie și Comprimare PDF

O aplicație web modernă pentru conversie de documente Word (DOC/DOCX) în PDF și comprimare fișiere PDF existente.

## Funcționalități

- ✅ Conversie DOC/DOCX în PDF
- ✅ Comprimare fișiere PDF
- ✅ Interfață modernă și ușor de utilizat
- ✅ Drag & drop pentru fișiere
- ✅ Procesare rapidă
- ✅ Fișierele sunt șterse automat după procesare

## Cerințe

- Node.js (v14 sau mai nou)
- LibreOffice (pentru conversia DOC/DOCX)

## Instalare

### 1. Instalează LibreOffice

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y libreoffice
```

**macOS:**
```bash
brew install --cask libreoffice
```

**Windows:**
Descarcă și instalează de pe [libreoffice.org](https://www.libreoffice.org/)

### 2. Instalează dependențele Node.js

```bash
npm install
```

## Utilizare

### Pornire server

```bash
npm start
```

Aplicația va fi disponibilă la: `http://localhost:3000`

### Mod dezvoltare (cu auto-restart)

```bash
npm run dev
```

## Cum funcționează

1. Accesează aplicația în browser la `http://localhost:3000`
2. Selectează un fișier DOC, DOCX sau PDF:
   - **Drag & drop** fișierul în zona de upload
   - SAU click pe "Alege fișier" pentru a selecta manual
3. Click pe "Procesează fișierul"
4. Așteaptă procesarea (se afișează progress bar)
5. Descarcă fișierul PDF rezultat

## Limite

- Dimensiune maximă fișier: **50MB**
- Formate acceptate: **DOC, DOCX, PDF**

## Tehnologii folosite

- **Backend:** Node.js, Express
- **Conversie:** LibreOffice (prin libre-office-convert)
- **Comprimare PDF:** pdf-lib
- **Upload:** Multer
- **Frontend:** HTML5, CSS3, JavaScript vanilla

## Structura proiectului

```
.
├── server.js           # Server Express
├── package.json        # Dependențe npm
├── public/            
│   ├── index.html     # Interfață utilizator
│   ├── styles.css     # Stiluri
│   └── script.js      # Logică client-side
└── uploads/           # Director temporar (creat automat)
```

## API Endpoints

### POST /api/convert
Convertește/comprima un fișier.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (DOC, DOCX sau PDF)

**Response:**
- Content-Type: application/pdf
- Headers:
  - `X-Original-Size`: Dimensiunea originală (pentru PDF)
  - `X-Compressed-Size`: Dimensiunea comprimată (pentru PDF)
  - `X-Compression-Ratio`: Procentul de comprimare (pentru PDF)
  - `X-File-Size`: Dimensiunea fișierului (pentru conversie)

### GET /api/health
Verifică starea serverului.

**Response:**
```json
{
  "status": "OK",
  "message": "Serverul funcționează corect"
}
```

## Securitate

- Fișierele sunt stocate temporar în directorul `uploads/`
- Fișierele sunt șterse automat după procesare
- Validare tip și dimensiune fișier
- Limită de 50MB per fișier

## Troubleshooting

### Eroare: "Nu s-a putut converti documentul în PDF"

Verifică dacă LibreOffice este instalat corect:
```bash
libreoffice --version
```

### Portul 3000 este deja folosit

Schimbă portul prin variabila de mediu:
```bash
PORT=8080 npm start
```

## Licență

MIT
