// process-sprites.mjs
import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

async function processImage(filename, outPrefix) {
  const imgPath = path.join(process.cwd(), 'public/assets', filename);
  const outDir = path.join(process.cwd(), 'public/assets/sprites');
  
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const img = await loadImage(imgPath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Flood fill algorithm to remove white background
  function colorMatch(idx, r, g, b, tol) {
    return Math.abs(data[idx] - r) <= tol &&
           Math.abs(data[idx+1] - g) <= tol &&
           Math.abs(data[idx+2] - b) <= tol &&
           data[idx+3] > 0;
  }

  const stack = [{x: 0, y: 0}];
  // White tolerance
  const bgTol = 15;
  const targetR = data[0], targetG = data[1], targetB = data[2]; // assuming 0,0 is background
  
  // Set pixel to transparent
  function setTrans(idx) {
    data[idx] = 0; data[idx+1] = 0; data[idx+2] = 0; data[idx+3] = 0;
  }

  // To avoid maximum call stack, we use a basic stack loop
  while(stack.length > 0) {
     const {x, y} = stack.pop();
     const idx = (y * canvas.width + x) * 4;
     if (data[idx+3] === 0) continue; // already transparent
     if (colorMatch(idx, targetR, targetG, targetB, bgTol)) {
         setTrans(idx);
         if (x > 0) stack.push({x: x-1, y: y});
         if (x < canvas.width-1) stack.push({x: x+1, y: y});
         if (y > 0) stack.push({x: x, y: y-1});
         if (y < canvas.height-1) stack.push({x: x, y: y+1});
     }
  }

  // Put data back
  ctx.putImageData(imgData, 0, 0);

  // Now find bounding boxes of remaining non-transparent pixels
  const boxes = [];
  const visited = new Uint8Array(canvas.width * canvas.height);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = y * canvas.width + x;
      if (visited[idx] === 1) continue;
      
      const pxIdx = idx * 4;
      if (data[pxIdx+3] > 0) {
        // Found a start of a new figure! Find bounds using BFS
        let minX = x, maxX = x, minY = y, maxY = y;
        const q = [{x, y}];
        visited[idx] = 1;

        // BFS to collect all connected pixels of this character
        let head = 0;
        while(head < q.length) {
           const pt = q[head++];
           if (pt.x < minX) minX = pt.x;
           if (pt.x > maxX) maxX = pt.x;
           if (pt.y < minY) minY = pt.y;
           if (pt.y > maxY) maxY = pt.y;

           // check neighbors
           const neighbors = [
             {dx: -1, dy: 0}, {dx: 1, dy: 0},
             {dx: 0, dy: -1}, {dx: 0, dy: 1},
             // Diagonals help connect slight gaps in drawing
             {dx: -1, dy: -1}, {dx: 1, dy: 1},
             {dx: 1, dy: -1}, {dx: -1, dy: 1}
           ];

           for (const n of neighbors) {
              const nx = pt.x + n.dx;
              const ny = pt.y + n.dy;
              if (nx >=0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                 const nIdx = ny * canvas.width + nx;
                 if (visited[nIdx] === 0) {
                    visited[nIdx] = 1;
                    if (data[nIdx*4+3] > 0) {
                       q.push({x: nx, y: ny});
                    }
                 }
              }
           }
        }

        // If the box is big enough to be a character (filter out small noise)
        if (maxX - minX > 20 && maxY - minY > 40) {
           boxes.push({ minX, maxX, minY, maxY });
        }
      }
    }
  }

  console.log(`Found ${boxes.length} bounding boxes in ${filename}`);

  // Sort boxes left-to-right, top-to-bottom
  boxes.sort((a, b) => {
     if (Math.abs(a.minY - b.minY) < 50) return a.minX - b.minX; // same row
     return a.minY - b.minY;
  });

  // Extract and save each!
  for (let i = 0; i < boxes.length; i++) {
     const b = boxes[i];
     const pad = 10;
     const bw = b.maxX - b.minX + pad*2;
     const bh = b.maxY - b.minY + pad*2;
     
     const spriteCanvas = createCanvas(bw, bh);
     const sCtx = spriteCanvas.getContext('2d');
     
     // draw cropped region from original canvas
     sCtx.drawImage(canvas, b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY, pad, pad, b.maxX - b.minX, b.maxY - b.minY);

     const outPath = path.join(outDir, `${outPrefix}-${i}.png`);
     const buffer = spriteCanvas.toBuffer('image/png');
     fs.writeFileSync(outPath, buffer);
  }
}

async function run() {
  await processImage('staff-avatars.png', 'staff');
  await processImage('customers-avatars.png', 'customer');
  console.log("Processing complete!");
}

run();
