import { Student } from '../types';

export const parseStudentCSV = (csvContent: string): Student[] => {
  const lines = csvContent.split(/\r?\n/);
  const students: Student[] = [];

  // Basic CSV parser assuming headers or fixed order: NOM, PRENOM, SEXE, GROUPE
  // Skipping header if detected
  const startIndex = lines[0].toLowerCase().includes('nom') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/[;,]/); // Handle both semicolon and comma
    if (parts.length >= 2) {
      students.push({
        id: crypto.randomUUID(), // Generate a temp ID
        lastName: parts[0]?.trim() || 'Inconnu',
        firstName: parts[1]?.trim() || '',
        gender: (parts[2]?.trim().toUpperCase() === 'F' ? 'F' : 'M'),
        group: parts[3]?.trim() || 'Classe Entière',
      });
    }
  }

  return students;
};