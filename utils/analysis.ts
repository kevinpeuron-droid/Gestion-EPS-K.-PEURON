// Moteur d'analyse pédagogique Multi-APS

export interface StudentAnalysis {
  id: string;
  name: string;
  mastery: 'D1' | 'D2' | 'D3' | 'D4';
  profile: string;
  reliabilityIndex: string; 
  advice: string;
}

// Nettoyage des valeurs numériques (virgules, pourcentages, texte)
const parseMetric = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace(',', '.').replace('%', '').replace('s', '').replace('m', ''));
};

export const analyzeCSV = (csvContent: string, caType: 'CA1' | 'CA2' = 'CA2'): StudentAnalysis[] => {
  const lines = csvContent.split(/\r?\n/);
  const results: StudentAnalysis[] = [];

  // 1. DÉTECTION DES COLONNES
  let headerIndex = -1;
  const headers: Record<string, number> = {};
  
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const lineLower = lines[i].toLowerCase();
    // On cherche des mots clés selon le CA
    if (lineLower.includes('nom') || lineLower.includes('groupe')) {
      headerIndex = i;
      const parts = lines[i].split(/[;,]/).map(h => h.trim().toLowerCase());
      parts.forEach((h, idx) => {
        // Commun
        if (h.includes('nom') || h.includes('groupe') || h.includes('élève')) headers['name'] = idx;
        
        // CA2 Orientation
        if (h.includes('n1')) headers['n1'] = idx;
        if (h.includes('n2')) headers['n2'] = idx;
        if (h.includes('n3')) headers['n3'] = idx;
        if (h.includes('erreurs')) headers['errors'] = idx;
        if (h.includes('temps') && !h.includes('p1')) headers['time'] = idx;

        // CA1 Performance
        if (h.includes('moyenne 50m')) headers['avgPerf'] = idx;
        if (h.includes('moyenne séries') || h.includes('moyenne series')) headers['avgEffort'] = idx;
        if (h.includes('meilleur')) headers['best'] = idx;
        if (h.includes('p1')) headers['p1'] = idx;
        if (h.includes('p5')) headers['p5'] = idx;
      });
      break;
    }
  }

  if (headerIndex === -1) return [];

  // 2. ANALYSE PAR LIGNE
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(/[;,]/);

    const rawName = cols[headers['name']] || 'Inconnu';
    const names = rawName.split(/[,&]/).map(n => n.trim()).filter(n => n.length > 0);

    names.forEach(studentName => {
      let result: StudentAnalysis = {
        id: crypto.randomUUID(),
        name: studentName,
        mastery: 'D1',
        profile: 'Standard',
        reliabilityIndex: '-',
        advice: 'Continuer'
      };

      if (caType === 'CA2') {
         // --- LOGIQUE COURSE D'ORIENTATION (CA2) ---
         const n1 = parseMetric(cols[headers['n1']]);
         const n2 = parseMetric(cols[headers['n2']]);
         const n3 = parseMetric(cols[headers['n3']]);
         const errors = parseMetric(cols[headers['errors']]);
         const time = parseMetric(cols[headers['time']]);

         // Profil
         if (n3 >= 80 && errors < 2) result.profile = "Expert 🎯";
         else if ((n1 >= 90 || n2 >= 90) && n3 < 10) result.profile = "Prudent 🛡️";
         else if (time < 180 && errors > 2) result.profile = "Précipité ⚡";
         else if (errors === 0 && n3 === 0 && n2 === 0) result.profile = "En Réserve 💤";

         // Maîtrise
         if (errors === 0 && n3 > 0) result.mastery = 'D4';
         else if (errors <= 2 && n2 > 50) result.mastery = 'D3';
         else if (errors > 2 || (n1 > 0 && n2 === 0 && n3 === 0)) result.mastery = 'D2';
         else result.mastery = 'D1';

         // Conseil
         result.reliabilityIndex = `${errors} err.`;
         if (result.profile.includes("Expert")) result.advice = "Viser le 100% N3.";
         else if (result.profile.includes("Prudent")) result.advice = "Oser une balise N3.";
         else if (result.profile.includes("Précipité")) result.advice = "Stop carte obligatoire (30s).";
         else result.advice = "Stabiliser la lecture.";

      } else {
         // --- LOGIQUE PERFORMANCE / COURSE (CA1) ---
         const avgEffort = parseMetric(cols[headers['avgEffort']]); // Moyenne Réalisée
         const best = parseMetric(cols[headers['best']]); // Potentiel Max
         const p1 = parseMetric(cols[headers['p1']]); // Première pause (récup)
         const p5 = parseMetric(cols[headers['p5']]); // Dernière pause (fatigue)
         
         // Calcul Régularité ((Moy - Best) / Best) * 100
         const regularity = best > 0 ? ((avgEffort - best) / best) * 100 : 0;
         const drift = p5 - p1;

         // Profil
         if (Math.abs(regularity) < 5 && Math.abs(drift) < 5) result.profile = "Métronome ⏱️";
         else if (drift > 10) result.profile = "Explosif (Sature) 🧨";
         else if (Math.abs(regularity) > 15) result.profile = "Irrégulier 📉";
         else if (drift < -5) result.profile = "En Réserve (Accélère) 🐢";

         // Maîtrise
         if (Math.abs(regularity) < 5 && Math.abs(drift) < 5) result.mastery = 'D4';
         else if (Math.abs(regularity) < 10 && drift < 15) result.mastery = 'D3';
         else if (drift > 20 || Math.abs(regularity) > 20) result.mastery = 'D2'; // Fragile
         else result.mastery = 'D1';

         // Conseil
         result.reliabilityIndex = `Régul: ${regularity.toFixed(1)}%`;
         if (result.profile.includes("Explosif")) result.advice = "Partir moins vite, gérer le souffle.";
         else if (result.profile.includes("En Réserve")) result.advice = "Augmenter l'intensité dès le début.";
         else if (result.mastery === 'D4') result.advice = "Augmenter la distance de course.";
         else result.advice = "Maintenir l'allure.";
      }

      results.push(result);
    });
  }

  return results;
};

// Wrapper pour compatibilité existante
export const analyzeOrientationCSV = (csv: string) => analyzeCSV(csv, 'CA2');