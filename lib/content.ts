import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'content');

export interface Bookmaker {
  name: string;
  website: string;
  rating: number;
  description: string;
  license: string;
  founded: number;
  minDeposit: string;
  minBet: string;
  company: string;
  pros: string[];
  cons: string[];
}

export interface MarginType {
  marketType: string;
  avgMargin: number;
  minMargin: number;
  maxMargin: number;
  sampleSize: number;
}

export interface Sport {
  name: string;
  icon: string;
  eventsCount: number;
  marketsCount: number;
  avgMargin: number;
  order: number;
}

export interface SiteContent {
  bookmaker: Bookmaker;
  margins: MarginType[];
  sports: Sport[];
}

export function getBookmaker(): Bookmaker {
  const filePath = path.join(contentDir, 'settings', 'bookmaker.json');
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function getMargins(): MarginType[] {
  const filePath = path.join(contentDir, 'settings', 'margins.json');
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  return data.types;
}

export function getSports(): Sport[] {
  const sportsDir = path.join(contentDir, 'sports');
  const files = fs.readdirSync(sportsDir).filter(f => f.endsWith('.json'));

  const sports: Sport[] = files.map(file => {
    const filePath = path.join(sportsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  });

  return sports.sort((a, b) => a.order - b.order);
}

export function getAllContent(): SiteContent {
  return {
    bookmaker: getBookmaker(),
    margins: getMargins(),
    sports: getSports(),
  };
}
