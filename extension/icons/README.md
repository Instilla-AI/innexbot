# InnexBot Extension Icons

Questa cartella deve contenere le icone dell'estensione nei seguenti formati:

## Icone Richieste

- `icon16.png` - 16x16 pixels
- `icon32.png` - 32x32 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Design Guidelines

### Colori InnexData:
- **Primario:** Blu scuro (#1B3B6F) e blu medio (#2C5F8D)
- **Accent:** Arancione (#FF6B35) e arancione dorato (#F7931E)

### Concept:
- Logo esagonale con gradiente arancione
- Lettere "IB" in bianco al centro
- Stile moderno e professionale
- Bordo sottile blu scuro

## Come Generare le Icone

### Opzione 1: Online (Consigliato)
1. Vai su https://www.figma.com o https://www.canva.com
2. Crea un design 128x128px con:
   - Background: Gradiente da #FF6B35 a #F7931E
   - Forma: Esagono arrotondato
   - Testo: "IB" in bianco, font bold
   - Bordo: 2px #1B3B6F
3. Esporta in PNG a 128x128, 48x48, 32x32, 16x16

### Opzione 2: Photoshop/GIMP
1. Crea nuovo documento 128x128px
2. Disegna esagono con gradiente arancione
3. Aggiungi testo "IB" centrato
4. Salva come PNG
5. Ridimensiona per altre dimensioni

### Opzione 3: Codice SVG
Salva questo SVG e convertilo in PNG:

```svg
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F7931E;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad)"/>
  <text x="64" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        text-anchor="middle" fill="white">IB</text>
</svg>
```

Converti SVG in PNG usando:
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com

### Opzione 4: Placeholder Temporaneo
Per test immediati, usa icone colorate solide:
- Crea quadrati colorati con gradiente arancione
- Aggiungi testo "IB" al centro
- Salva nelle 4 dimensioni richieste

## Verifica Icone

Dopo aver generato le icone:
1. Controlla che siano PNG (non JPG)
2. Verifica dimensioni esatte (16x16, 32x32, 48x48, 128x128)
3. Assicurati che siano su sfondo trasparente o con colore solido
4. Testa in Chrome: chrome://extensions/

## Note

- Le icone devono essere chiare e riconoscibili anche a 16x16px
- Evita dettagli troppo fini che si perdono nelle dimensioni piccole
- Usa colori ad alto contrasto per leggibilità
- Mantieni coerenza con il brand InnexData
