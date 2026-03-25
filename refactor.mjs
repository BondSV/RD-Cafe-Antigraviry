import fs from 'fs';

const srcPath = './src/components/game/CustomerFlowSimulation.tsx';
const hookPath = './src/hooks/useCustomerFlowSimulation.ts';

const content = fs.readFileSync(srcPath, 'utf8');

// Find sections
const splitAtTypes = content.indexOf('// ============================================================');
const renderingStart = content.indexOf('// SVG RENDERING HELPERS');
const splitAtMainComponent = content.indexOf('// MAIN COMPONENT');

// We need to extract imports that the hook needs
const hookImports = `import { useRef, useEffect, useCallback, useState } from 'react';\nimport { VisibleMetrics, ActionFlags } from '../types/game';\nimport { normaliseForDisplay } from '../engine/normaliseForDisplay';\n\n`;

// Extract everything from line 5 to SVG RENDER HELPERS
let hookLogic = content.substring(splitAtTypes, renderingStart).trim();

// Add 'export ' so the renderers can use them
hookLogic = hookLogic.replace(/^type /gm, 'export type ');
hookLogic = hookLogic.replace(/^interface /gm, 'export interface ');
hookLogic = hookLogic.replace(/^const VB_W/gm, 'export const VB_W');
hookLogic = hookLogic.replace(/^const VB_H/gm, 'export const VB_H');
hookLogic = hookLogic.replace(/^const POS/gm, 'export const POS');
hookLogic = hookLogic.replace(/^const STAGE_LABELS/gm, 'export const STAGE_LABELS');
hookLogic = hookLogic.replace(/^const TOKEN_R/gm, 'export const TOKEN_R');
hookLogic = hookLogic.replace(/^const STAFF_R/gm, 'export const STAFF_R');
hookLogic = hookLogic.replace(/^const TICKET_SIZE/gm, 'export const TICKET_SIZE');
hookLogic = hookLogic.replace(/^function deriveStaffConfig/gm, 'export function deriveStaffConfig');
hookLogic = hookLogic.replace(/^function deriveSimRates/gm, 'export function deriveSimRates');
hookLogic = hookLogic.replace(/^function createInitialState/gm, 'export function createInitialState');
hookLogic = hookLogic.replace(/^function initStaffTokens/gm, 'export function initStaffTokens');
hookLogic = hookLogic.replace(/^function tickSimulation/gm, 'export function tickSimulation');


// Now extract the hook implementation body
const mainComponentStr = content.substring(splitAtMainComponent);
const hookBodyStart = mainComponentStr.indexOf('{'); // start of component body
const hookBodyEnd = mainComponentStr.indexOf('const state = simRef.current;');

// Wrap it in export function
const newHookStr = `\nexport function useCustomerFlowSimulation(metrics: VisibleMetrics, flags: ActionFlags, triggerKey: number) {
  ${mainComponentStr.substring(hookBodyStart + 1, hookBodyEnd)}
  return { state: simRef.current, renderTick };\n}\n`;

// Write the hook file
if (!fs.existsSync('./src/hooks')) fs.mkdirSync('./src/hooks');
fs.writeFileSync(hookPath, hookImports + hookLogic + '\n' + newHookStr);

// REWRITE CustomerFlowSimulation.tsx
// It needs the React imports, the original SVG rendering helpers, and the new Component body
const renderingHelpers = content.substring(renderingStart, splitAtMainComponent);

let newComponentContent = `import React from 'react';\nimport { VisibleMetrics, ActionFlags } from '../../types/game';\nimport { useCustomerFlowSimulation, Token, StaffToken, BacklogTicket, Face, VB_W, VB_H, POS, STAGE_LABELS, TOKEN_R, STAFF_R, TICKET_SIZE } from '../../hooks/useCustomerFlowSimulation';\n\n${renderingHelpers}\n\n// ============================================================\n// MAIN COMPONENT\n// ============================================================\n\ninterface Props {\n  metrics: VisibleMetrics;\n  flags: ActionFlags;\n  triggerKey: number;\n}\n\nexport default function CustomerFlowSimulation({ metrics, flags, triggerKey }: Props) {\n  const { state } = useCustomerFlowSimulation(metrics, flags, triggerKey);\n\n` + mainComponentStr.substring(hookBodyEnd);

fs.writeFileSync(srcPath, newComponentContent);
console.log('Refactoring complete.');
