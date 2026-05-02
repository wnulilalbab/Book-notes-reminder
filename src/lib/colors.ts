export interface BookColor {
  value: string;
  name: string;
  text: string;
  badge: string;
}

export const BOOK_COLORS: BookColor[] = [
  { value: '#E8D5B7', name: 'Sand',       text: '#3D2B1F', badge: '#7A5C3A' },
  { value: '#B5D5C5', name: 'Sage',       text: '#1C3829', badge: '#3A7A5C' },
  { value: '#C9B8E8', name: 'Lavender',   text: '#2D1B5E', badge: '#5C3A9E' },
  { value: '#F5C6A0', name: 'Peach',      text: '#5C2E00', badge: '#A05020' },
  { value: '#A8D8EA', name: 'Sky',        text: '#0A3040', badge: '#2060A0' },
  { value: '#F9E4B7', name: 'Butter',     text: '#5C4000', badge: '#A07000' },
  { value: '#E8B4B8', name: 'Rose',       text: '#5C1020', badge: '#A02040' },
  { value: '#B8E4C9', name: 'Mint',       text: '#0A3020', badge: '#206040' },
  { value: '#D4B483', name: 'Caramel',    text: '#2D1800', badge: '#6B3A00' },
  { value: '#C5D5E8', name: 'Steel',      text: '#1A2C3D', badge: '#2A5070' },
  { value: '#E8C4A0', name: 'Terracotta', text: '#4A1F00', badge: '#8C3A00' },
  { value: '#D5C5E8', name: 'Lilac',      text: '#2D1859', badge: '#5C3A90' },
];

export function getNextColor(usedColors: string[]): string {
  const unused = BOOK_COLORS.find(c => !usedColors.includes(c.value));
  return unused?.value ?? BOOK_COLORS[usedColors.length % BOOK_COLORS.length].value;
}

export function getColorMeta(hex: string): BookColor {
  return BOOK_COLORS.find(c => c.value === hex) ?? { value: hex, name: 'Custom', text: '#1a1a1a', badge: '#444444' };
}
