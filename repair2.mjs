import fs from 'fs';

const compPath = './src/components/game/CustomerFlowSimulation.tsx';

let compContent = fs.readFileSync(compPath, 'utf8');

compContent = compContent.replaceAll('{backlog.map(ticket => (', '{backlog.map((ticket: BacklogTicket) => (');
compContent = compContent.replaceAll('{staffTokens.map(staff => (', '{staffTokens.map((staff: StaffToken) => (');
compContent = compContent.replaceAll('{tokens.map(token => (', '{tokens.map((token: Token) => (');
compContent = compContent.replaceAll('Queue: {tokens.filter(t => t.state', 'Queue: {tokens.filter((t: Token) => t.state');
compContent = compContent.replaceAll('Waiting: {tokens.filter(t => t.state', 'Waiting: {tokens.filter((t: Token) => t.state');

fs.writeFileSync(compPath, compContent);
console.log('Repair complete');
