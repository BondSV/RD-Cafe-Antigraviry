import fs from 'fs';

['Iso.tsx', 'TopDown.tsx'].forEach(f => {
  const path = `./src/components/game/CustomerFlowSimulation${f}`;
  if (fs.existsSync(path)) {
    let text = fs.readFileSync(path, 'utf8');
    text = text.replaceAll('\\$', '$');
    text = text.replaceAll('\\`', '\`');
    text = text.replaceAll('/> />', '/>');
    fs.writeFileSync(path, text);
  }
});
console.log('Fixed escaping rules');
