import fs from 'fs';
import path from 'path';

interface IDiseaseData {
  name: string;
  symptoms: Set<string>;
  description: string;
  precautions: string[];
}

export interface IExpertSystemResult {
  reply: string;
  conditions: string[];
  recommendation: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  firstAid: string;
  symptomsDetected: string[];
  recommendedSpecialist: string;
  medications: string[];
}

const DISEASE_MEDICATIONS: Record<string, string[]> = {
  'fungal infection': ['Clotrimazole cream (OTC Antifungal)', 'Miconazole cream', 'Ketoconazole shampoo'],
  'allergy': ['Cetirizine (OTC Antihistamine)', 'Loratadine', 'Fexofenadine', 'Diphenhydramine'],
  'gerd': ['Antacids (like Mylanta, Tums)', 'Famotidine (H2 blocker)', 'Omeprazole (OTC PPI)'],
  'chronic cholestasis': ['Ursodeoxycholic Acid (Prescription)', 'Cholestyramine (Prescription)', 'Antihistamines (for itching)'],
  'drug reaction': ['Diphenhydramine (OTC Antihistamine)', 'Cetirizine', 'Hydrocortisone cream'],
  'peptic ulcer diseae': ['Famotidine (H2 blocker)', 'Omeprazole (OTC PPI)', 'Antacids'],
  'aids': ['Antiretroviral Therapy (ART - prescription only)', 'Multivitamin supplements'],
  'diabetes': ['Metformin (Prescription)', 'Insulin (Prescription)', 'Electrolytes & Vitamin B12'],
  'gastroenteritis': ['Oral Rehydration Salts (ORS)', 'Loperamide (OTC)', 'Bismuth subsalicylate'],
  'bronchial asthma': ['Albuterol inhaler (Prescription rescue)', 'Fluticasone inhaler (Prescription controller)'],
  'hypertension': ['Lisinopril (Prescription)', 'Amlodipine (Prescription)', 'Losartan (Prescription)'],
  'migraine': ['Ibuprofen (OTC pain reliever)', 'Acetaminophen', 'Naproxen', 'Sumatriptan (Prescription)'],
  'cervical spondylosis': ['Ibuprofen / Naproxen (NSAIDs)', 'Capsaicin cream (topical)', 'Acetaminophen'],
  'paralysis (brain hemorrhage)': ['Strict Emergency ICU Care Required - No self-medication'],
  'jaundice': ['Oral Rehydration Salts (ORS)', 'Vitamin B-complex supplements'],
  'malaria': ['Artemether-lumefantrine (Prescription)', 'Chloroquine (Prescription)', 'Acetaminophen (for fever)'],
  'chicken pox': ['Calamine lotion (for itching)', 'Acetaminophen (for fever - AVOID aspirin)', 'Acyclovir (Prescription antiviral)'],
  'dengue': ['Acetaminophen (for fever - STRICTLY AVOID ibuprofen, aspirin, naproxen)', 'Oral Rehydration Salts (ORS)'],
  'typhoid': ['Ciprofloxacin (Prescription antibiotic)', 'Ceftriaxone (Prescription)', 'Acetaminophen (for fever)', 'ORS'],
  'hepatitis a': ['Supportive Care: Oral Rehydration Salts (ORS)', 'Acetaminophen (low dose under supervision)', 'Anti-nausea medication'],
  'hepatitis b': ['Tenofovir (Prescription antiviral)', 'Entecavir (Prescription)', 'Supportive rest & hydration'],
  'hepatitis c': ['Sofosbuvir (Prescription antiviral)', 'Velpatasvir (Prescription)'],
  'hepatitis d': ['Pegylated Interferon-alpha (Prescription)'],
  'hepatitis e': ['Supportive Care: Hydration (ORS)', 'Rest', 'Avoid alcohol/hepatotoxic substances'],
  'alcoholic hepatitis': ['Vitamin B-complex', 'Thiamine supplements', 'Corticosteroids (Prescription in severe cases)'],
  'tuberculosis': ['Rifampin (Prescription)', 'Isoniazid (Prescription)', 'Pyrazinamide (Prescription)', 'Ethambutol (Prescription)'],
  'common cold': ['Acetaminophen (fever/pain)', 'Pseudoephedrine (nasal decongestant)', 'Dextromethorphan (cough suppressant)', 'Saline nasal spray'],
  'pneumonia': ['Amoxicillin (Prescription antibiotic)', 'Azithromycin (Prescription)', 'Acetaminophen (for fever)', 'Mucolytics'],
  'dimorphic hemmorhoids(piles)': ['Witch hazel pads', 'Hydrocortisone cream (OTC)', 'Docusate sodium (stool softener)', 'Psyllium husk'],
  'heart attack': ['Aspirin (325mg chewed immediately - emergency supportive)', 'Nitroglycerin (Prescription)'],
  'varicose veins': ['Compression stockings (supportive)', 'Topical soothing gels', 'Flavonoid supplements'],
  'hypothyroidism': ['Levothyroxine (Prescription thyroid hormone replacement)'],
  'hyperthyroidism': ['Methimazole (Prescription anti-thyroid)', 'Propylthiouracil (Prescription)', 'Propranolol (Prescription for symptoms)'],
  'hypoglycemia': ['Glucose tablets', 'Fruit juice / Sugar syrup', 'Honey', 'Glucagon injection (Prescription for severe episodes)'],
  'osteoarthristis': ['Acetaminophen (first-line pain relief)', 'Ibuprofen (NSAID)', 'Topical Diclofenac gel (OTC)', 'Glucosamine'],
  'arthritis': ['Ibuprofen / Naproxen (NSAIDs)', 'Acetaminophen', 'DMARDs like Methotrexate (Prescription)'],
  '(vertigo) paroymsal  positional vertigo': ['Meclizine (OTC vestibular suppressant)', 'Epley maneuver (physical therapy)'],
  'acne': ['Benzoyl Peroxide gel (OTC)', 'Salicylic acid cleanser', 'Adapalene gel (OTC retinoid)', 'Clindamycin topical (Prescription)'],
  'urinary tract infection': ['Phenazopyridine (OTC urinary pain relief)', 'Nitrofurantoin (Prescription antibiotic)', 'Bactrim (Prescription)', 'Cranberry extract (supportive)'],
  'psoriasis': ['Coal tar ointments', 'Hydrocortisone cream (OTC)', 'Salicylic acid ointment', 'Vitamin D analogues (Prescription)'],
  'impetigo': ['Mupirocin ointment (Prescription topical antibiotic)', 'Cephalexin (Prescription oral antibiotic)']
};

class ExpertSystem {
  private symptomSeverities: Map<string, number> = new Map();
  private diseaseData: Map<string, IDiseaseData> = new Map();
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private initialize() {
    if (this.initialized) return;
    try {
      console.log('📖 Expert System: Loading clinical dataset files...');
      
      const rootPath = path.join(__dirname, '../../../');
      const severityPath = path.join(rootPath, 'Symptom-severity.csv');
      const descriptionPath = path.join(rootPath, 'symptom_Description.csv');
      const precautionPath = path.join(rootPath, 'symptom_precaution.csv');
      const datasetPath = path.join(rootPath, 'dataset.csv');

      // 1. Load Symptom Severities
      if (fs.existsSync(severityPath)) {
        const lines = fs.readFileSync(severityPath, 'utf-8').split('\n').slice(1);
        for (const line of lines) {
          if (!line.trim()) continue;
          const [symptom, weightStr] = this.parseCSVLine(line);
          const weight = parseInt(weightStr || '1');
          if (symptom) {
            this.symptomSeverities.set(symptom.toLowerCase().trim(), weight);
          }
        }
      }

      // Helper map to build final data structure
      const descriptions = new Map<string, string>();
      const precautions = new Map<string, string[]>();
      const symptomsMap = new Map<string, Set<string>>();

      // 2. Load Descriptions
      if (fs.existsSync(descriptionPath)) {
        const lines = fs.readFileSync(descriptionPath, 'utf-8').split('\n').slice(1);
        for (const line of lines) {
          if (!line.trim()) continue;
          const [disease, desc] = this.parseCSVLine(line);
          if (disease) {
            descriptions.set(disease.toLowerCase().trim(), desc || '');
          }
        }
      }

      // 3. Load Precautions
      if (fs.existsSync(precautionPath)) {
        const lines = fs.readFileSync(precautionPath, 'utf-8').split('\n').slice(1);
        for (const line of lines) {
          if (!line.trim()) continue;
          const parts = this.parseCSVLine(line);
          const disease = parts[0];
          const steps = parts.slice(1).filter(p => p.trim() !== '');
          if (disease) {
            precautions.set(disease.toLowerCase().trim(), steps);
          }
        }
      }

      // 4. Load Dataset (Disease -> Symptoms mapping)
      if (fs.existsSync(datasetPath)) {
        const lines = fs.readFileSync(datasetPath, 'utf-8').split('\n').slice(1);
        for (const line of lines) {
          if (!line.trim()) continue;
          const parts = this.parseCSVLine(line);
          const disease = parts[0]?.toLowerCase().trim();
          if (!disease) continue;

          if (!symptomsMap.has(disease)) {
            symptomsMap.set(disease, new Set());
          }
          
          const symptomSet = symptomsMap.get(disease)!;
          // Add all non-empty symptoms listed in the columns
          parts.slice(1).forEach(s => {
            const cleanSymptom = s.toLowerCase().replace(/\s+/g, ' ').trim();
            if (cleanSymptom && cleanSymptom !== '') {
              symptomSet.add(cleanSymptom);
            }
          });
        }
      }

      // 5. Merge all sources into diseaseData Map
      for (const [diseaseName, symptomSet] of symptomsMap.entries()) {
        this.diseaseData.set(diseaseName, {
          name: diseaseName,
          symptoms: symptomSet,
          description: descriptions.get(diseaseName) || 'No description available in the clinical dataset.',
          precautions: precautions.get(diseaseName) || ['Consult a medical professional', 'Monitor symptoms', 'Rest and hydrate']
        });
      }

      console.log(`✅ Expert System Initialized: loaded ${this.symptomSeverities.size} symptoms and ${this.diseaseData.size} disease profiles.`);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Expert System:', error);
    }
  }

  // Maps natural language keywords (English & Telugu transliterations) to dataset symptom keys
  private getSymptomSynonyms(text: string): string[] {
    const synonyms: string[] = [];
    const lower = text.toLowerCase();

    // English & Telugu Natural Mappings
    if (lower.includes('fever') || lower.includes('temperature') || lower.includes('jwaram') || lower.includes('jvaram') || lower.includes('kasam')) {
      synonyms.push('high_fever');
    }
    if (lower.includes('headache') || lower.includes('head ache') || lower.includes('migraine') || lower.includes('tala noppi') || lower.includes('thala noppi') || lower.includes('talanoppi') || lower.includes('thalanoppi')) {
      synonyms.push('headache');
    }
    if (lower.includes('cough') || lower.includes('daggu') || lower.includes('daggara')) {
      synonyms.push('cough');
    }
    if (lower.includes('cold') || lower.includes('runny nose') || lower.includes('jalubu') || lower.includes('jalabu') || lower.includes('congestion')) {
      synonyms.push('runny_nose');
      synonyms.push('congestion');
    }
    if (lower.includes('stomach pain') || lower.includes('stomach ache') || lower.includes('potta noppi') || lower.includes('pottanoppi') || lower.includes('noppi')) {
      synonyms.push('stomach_pain');
    }
    if (lower.includes('abdominal pain') || lower.includes('belly pain') || lower.includes('kadupu noppi') || lower.includes('kadupunoppi')) {
      synonyms.push('abdominal_pain');
    }
    if (lower.includes('weight gain') || lower.includes('gaining weight') || lower.includes('lavu') || lower.includes('perugutuna')) {
      synonyms.push('weight_gain');
      synonyms.push('obesity');
    }
    if (lower.includes('weight loss') || lower.includes('losing weight') || lower.includes('sanna') || lower.includes('taggutuna')) {
      synonyms.push('weight_loss');
    }
    if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('nidra') || lower.includes('nidhar') || lower.includes('kunuku') || lower.includes('paduko') || lower.includes('vundadam ledhu') || lower.includes('fatigue') || lower.includes('tired') || lower.includes('weakness')) {
      synonyms.push('fatigue');
    }
    if (lower.includes('itching') || lower.includes('itch')) {
      synonyms.push('itching');
    }
    if (lower.includes('rash') || lower.includes('skin rash') || lower.includes('spots')) {
      synonyms.push('skin_rash');
    }
    if (lower.includes('chest pain')) {
      synonyms.push('chest_pain');
    }
    if (lower.includes('breathing') || lower.includes('breathless') || lower.includes('shortness of breath')) {
      synonyms.push('breathlessness');
    }
    if (lower.includes('shivering') || lower.includes('shiver')) {
      synonyms.push('shivering');
    }
    if (lower.includes('chills') || lower.includes('chill')) {
      synonyms.push('chills');
    }
    if (lower.includes('sneezing') || lower.includes('sneeze')) {
      synonyms.push('continuous_sneezing');
    }
    if (lower.includes('joint pain') || lower.includes('joint_pain')) {
      synonyms.push('joint_pain');
    }
    if (lower.includes('acidity') || lower.includes('heartburn') || lower.includes('chest burn')) {
      synonyms.push('acidity');
    }
    if (lower.includes('vomiting') || lower.includes('vomit')) {
      synonyms.push('vomiting');
    }
    if (lower.includes('anxiety') || lower.includes('anxious')) {
      synonyms.push('anxiety');
    }
    if (lower.includes('sweating') || lower.includes('sweat')) {
      synonyms.push('sweating');
    }
    if (lower.includes('dehydration') || lower.includes('dehydrated')) {
      synonyms.push('dehydration');
    }
    if (lower.includes('indigestion') || lower.includes('gas')) {
      synonyms.push('indigestion');
    }
    if (lower.includes('nausea') || lower.includes('nauseous')) {
      synonyms.push('nausea');
    }
    if (lower.includes('appetite') || lower.includes('hunger lost') || lower.includes('loss of appetite')) {
      synonyms.push('loss_of_appetite');
    }
    if (lower.includes('constipation')) {
      synonyms.push('constipation');
    }
    if (lower.includes('diarrhea') || lower.includes('diarrhoea') || lower.includes('loose stool')) {
      synonyms.push('diarrhoea');
    }
    if (lower.includes('dizziness') || lower.includes('dizzy')) {
      synonyms.push('dizziness');
    }
    if (lower.includes('muscle pain') || lower.includes('body pain') || lower.includes('body aches')) {
      synonyms.push('muscle_pain');
    }
    if (lower.includes('depression') || lower.includes('depressed')) {
      synonyms.push('depression');
    }
    if (lower.includes('watery eyes') || lower.includes('watering eyes') || lower.includes('watering from eyes')) {
      synonyms.push('watering_from_eyes');
    }

    return synonyms;
  }

  private mapDiseaseToSpecialist(disease: string): string {
    const d = disease.toLowerCase();
    if (d.includes('malaria') || d.includes('dengue') || d.includes('typhoid') || d.includes('hepatitis')) {
      return 'Infectious Disease Specialist';
    }
    if (d.includes('fungal') || d.includes('acne') || d.includes('psoriasis') || d.includes('impetigo') || d.includes('drug reaction')) {
      return 'Dermatologist';
    }
    if (d.includes('gerd') || d.includes('cholestasis') || d.includes('peptic ulcer') || d.includes('gastroenteritis')) {
      return 'Gastroenterologist';
    }
    if (d.includes('allergy') || d.includes('asthma') || d.includes('bronchitis')) {
      return 'Allergist / Pulmonologist';
    }
    if (d.includes('hypertension') || d.includes('heart') || d.includes('cardio')) {
      return 'Cardiologist';
    }
    if (d.includes('diabetes') || d.includes('hypothyroidism') || d.includes('hyperthyroidism') || d.includes('hypoglycemia')) {
      return 'Endocrinologist';
    }
    if (d.includes('migraine') || d.includes('paralysis') || d.includes('vertigo')) {
      return 'Neurologist';
    }
    if (d.includes('osteoarthristis') || d.includes('arthritis')) {
      return 'Rheumatologist / Orthopedician';
    }
    if (d.includes('urinary tract') || d.includes('uti')) {
      return 'Urologist';
    }
    return 'General Practitioner';
  }

  public evaluate(userText: string): IExpertSystemResult | null {
    this.initialize(); // Ensure data is loaded
    
    const lowerText = userText.toLowerCase();
    const detectedSet = new Set<string>();

    // 1. Gather synonyms from Telugu and English natural mappings
    this.getSymptomSynonyms(lowerText).forEach(s => detectedSet.add(s));

    // 2. Scan text for symptom strings (matching both standard and underscores as spaces)
    for (const symptomKey of this.symptomSeverities.keys()) {
      const normalizedSymptom = symptomKey.replace(/_/g, ' ');
      
      // Substring match for formatted space terms
      if (lowerText.includes(normalizedSymptom)) {
        detectedSet.add(symptomKey);
      }
      
      // Direct word match for specific keywords
      if (symptomKey.length > 4 && lowerText.includes(symptomKey)) {
        detectedSet.add(symptomKey);
      }
    }

    const detectedSymptoms = Array.from(detectedSet);
    if (detectedSymptoms.length === 0) {
      return null; // Let the caller fall back to default dynamic conversational text
    }

    // 3. Score diseases from dataset
    const scores: { disease: string; score: number; matches: string[] }[] = [];

    for (const [diseaseName, data] of this.diseaseData.entries()) {
      let matchCount = 0;
      let severitySum = 0;
      const matches: string[] = [];

      for (const sym of detectedSymptoms) {
        if (data.symptoms.has(sym)) {
          matchCount++;
          severitySum += this.symptomSeverities.get(sym) || 1;
          matches.push(sym);
        }
      }

      if (matchCount > 0) {
        // Clinical Heuristic: Prioritize common conditions ("horses") over rare/severe ones ("zebras")
        const COMMON_DISEASES = new Set([
          'common cold', 'malaria', 'typhoid', 'dengue', 'allergy', 
          'fungal infection', 'migraine', 'gastroenteritis', 'jaundice', 
          'urinary tract infection', 'acne', 'gerd', 'osteoarthristis',
          'peptic ulcer diseae'
        ]);

        let finalScore = matchCount * 10 + severitySum;
        if (COMMON_DISEASES.has(diseaseName)) {
          finalScore += 20; // 20-point boost ensures common diseases rank higher in case of low symptom tie-breakers
        }
        
        scores.push({ disease: diseaseName, score: finalScore, matches });
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Pick top 2 diseases
    const topMatches = scores.slice(0, 2);
    if (topMatches.length === 0) {
      return null;
    }

    const primaryDisease = this.diseaseData.get(topMatches[0].disease)!;
    const secondaryDisease = topMatches.length > 1 ? this.diseaseData.get(topMatches[1].disease) : null;

    // 4. Calculate Urgency Level
    let maxSeverity = 1;
    for (const sym of detectedSymptoms) {
      const s = this.symptomSeverities.get(sym) || 1;
      if (s > maxSeverity) maxSeverity = s;
    }

    // Check emergency red flags
    let urgency: 'low' | 'medium' | 'high' | 'emergency' = 'low';
    if (
      lowerText.includes('chest pain') || 
      lowerText.includes('breathing') || 
      lowerText.includes('shortness of breath') || 
      lowerText.includes('stroke')
    ) {
      urgency = 'emergency';
    } else if (maxSeverity >= 5) {
      urgency = 'high';
    } else if (maxSeverity >= 3) {
      urgency = 'medium';
    }

    // 5. Gather descriptions & precautions
    const conditions = [
      primaryDisease.name.charAt(0).toUpperCase() + primaryDisease.name.slice(1)
    ];
    if (secondaryDisease) {
      conditions.push(secondaryDisease.name.charAt(0).toUpperCase() + secondaryDisease.name.slice(1));
    }

    const firstAidList = primaryDisease.precautions;
    const firstAidText = firstAidList.map((p, i) => `${i + 1}. ${p.charAt(0).toUpperCase() + p.slice(1)}`).join(', ');

    // 6. Specialist
    const recommendedSpecialist = this.mapDiseaseToSpecialist(primaryDisease.name);

    // 7. Compose dynamic medical reply text
    const displaySymptoms = detectedSymptoms.map(s => s.replace(/_/g, ' ')).join(', ');
    
    let reply = `Based on your description, I identified symptoms that match indicators in our clinical dataset: **${displaySymptoms}**.\n\n`;
    
    reply += `### Primary Consideration: **${conditions[0]}**\n`;
    reply += `*${primaryDisease.description}*\n\n`;

    if (secondaryDisease) {
      reply += `### Secondary Consideration: **${conditions[1]}**\n`;
      reply += `*${secondaryDisease.description}*\n\n`;
    }

    reply += `### Recommended First-Aid / Precautions:\n`;
    firstAidList.forEach(p => {
      reply += `- ${p.charAt(0).toUpperCase() + p.slice(1)}\n`;
    });

    const primaryNameClean = primaryDisease.name.toLowerCase().trim();
    const primaryMedications = DISEASE_MEDICATIONS[primaryNameClean] || DISEASE_MEDICATIONS[primaryNameClean.replace(/\s+/g, ' ')] || ['Consult a physician for prescription details'];

    reply += `\n### Recommended Supportive Care & OTC Medications:\n`;
    primaryMedications.forEach(med => {
      reply += `- ${med}\n`;
    });
    reply += `\n*Note: The medications listed above are general, supportive or OTC options. Standard clinical protocols must be verified by a physician before initiating any treatment.*\n`;

    if (urgency === 'emergency') {
      reply += `\n⚠️ **WARNING:** These symptoms require emergency medical evaluation. Please call emergency services (like 911 or your local equivalent) immediately.\n`;
    } else {
      reply += `\n### Clinical Guidance:\nWe suggest consulting a **${recommendedSpecialist}** to verify these considerations and establish a diagnosis.\n`;
    }

    reply += `\n*Disclaimer: I am an AI Medical Assistant running a dataset-guided triage. This is not a replacement for professional clinical care.*`;

    return {
      reply,
      conditions,
      recommendation: urgency === 'emergency' ? 'CALL EMERGENCY SERVICES' : `Schedule a visit with a ${recommendedSpecialist}`,
      urgency,
      firstAid: firstAidText,
      symptomsDetected: detectedSymptoms.map(s => s.replace(/_/g, ' ')),
      recommendedSpecialist,
      medications: primaryMedications
    };
  }
}

export const expertSystem = new ExpertSystem();
