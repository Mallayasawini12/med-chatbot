import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { expertSystem } from './expertSystem';

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IAiResponse {
  reply: string;
  summary?: {
    conditions: string[];
    recommendation: string;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    firstAid?: string;
    symptomsDetected: string[];
    recommendedSpecialist?: string;
    medications?: string[];
  };
}

const SYSTEM_PROMPT = `You are SymptomCare AI (or MediBot AI), an empathetic, professional, and helpful medical assistant.
Your goal is to converse with users about their symptoms, gather clinical context, and provide general medical advice.

Follow these strict guidelines:
1. ALWAYS begin with a warm, empathetic tone.
2. Ask clarifying questions one at a time if details are missing (e.g., duration, severity, onset, triggers, modifying factors).
3. If the user presents red flags (e.g., severe chest pain, extreme shortness of breath, sudden weakness/numbness, severe abdominal pain, difficulty speaking), IMMEDIATELY warn them to call emergency services (like 911 or your local equivalent) and mark the urgency as "emergency".
4. Recommend whether they should see a primary care physician, visit urgent care, or apply self-care measures.
5. Provide basic, safe self-care/first-aid tips (e.g., hydration, rest, ice/heat, elevation) but never prescribe specific prescription dosages.
6. MANDATORY DISCLAIMER: "I am an AI, not a doctor. This analysis is for educational purposes and does not replace professional medical diagnosis, advice, or treatment."

To help the system display structured information, you MUST append a JSON block at the very end of your response, starting with "[[[JSON_SUMMARY]]]" on a new line, followed by a valid JSON object matching this schema:
{
  "conditions": ["Condition A", "Condition B"],
  "recommendation": "Brief recommendation (e.g. Schedule a GP visit)",
  "urgency": "low" | "medium" | "high" | "emergency",
  "firstAid": "Brief self-care advice",
  "symptomsDetected": ["fever", "headache"],
  "recommendedSpecialist": "Specific physician specialty type to consult (e.g. Cardiologist, Neurologist, General Practitioner)",
  "medications": ["OTC Medicine A", "OTC Medicine B"]
}
Ensure the medications listed are strictly safe OTC or supportive options, never specify prescription dosages. Ensure the JSON is properly formatted and does not contain syntax errors.`;

// Rule-based Mock AI fallback for offline execution
const generateMockResponse = (messages: IMessage[]): IAiResponse => {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
  
  let reply = '';
  let conditions: string[] = [];
  let recommendation = 'Monitor symptoms at home.';
  let urgency: 'low' | 'medium' | 'high' | 'emergency' = 'low';
  let firstAid = 'Rest and drink plenty of fluids.';
  let symptomsDetected: string[] = [];
  let recommendedSpecialist = 'General Practitioner';
  let medications: string[] = [];

  // Emergency Red Flags
  if (
    lastUserMsg.includes('chest pain') || 
    lastUserMsg.includes('breathing') || 
    lastUserMsg.includes('shortness of breath') || 
    lastUserMsg.includes('stroke') ||
    lastUserMsg.includes('heart attack') ||
    lastUserMsg.includes('unconscious')
  ) {
    reply = "⚠️ **CRITICAL WARNING:** Your symptoms may indicate a medical emergency. Please contact emergency services (call 911 or your local emergency number) immediately. Do not drive yourself to the hospital.\n\nWhile waiting for assistance, remain calm, sit down, and avoid physical exertion.";
    conditions = ['Myocardial Infarction', 'Pulmonary Embolism', 'Acute Respiratory Distress'];
    recommendation = 'CALL 911 / EMERGENCY SERVICES IMMEDIATELY';
    urgency = 'emergency';
    firstAid = 'Call emergency services, sit comfortably, chew an aspirin if advised by dispatch and not allergic.';
    symptomsDetected.push(lastUserMsg.includes('chest') ? 'chest pain' : 'difficulty breathing');
    recommendedSpecialist = 'Emergency Medicine Physician / Cardiologist';
    medications = ['Aspirin (325mg chewed immediately - emergency supportive)'];
  } 
  // Fever (Jwaram)
  else if (lastUserMsg.includes('fever') || lastUserMsg.includes('temp') || lastUserMsg.includes('hot') || lastUserMsg.includes('jwaram') || lastUserMsg.includes('jvaram') || lastUserMsg.includes('kasam')) {
    reply = "I'm sorry you are dealing with a fever (Jwaram / జ్వరం). A fever is usually a sign that your body is fighting off an infection.\n\nTo help me understand better:\n- What is your current temperature reading?\n- How many days has it lasted?\n- Do you have a sore throat, cough, or body aches?";
    conditions = ['Common Cold', 'Influenza', 'Viral Infection'];
    recommendation = 'Consult a primary doctor if the fever exceeds 103°F (39.4°C) or lasts more than 3 days.';
    urgency = 'medium';
    firstAid = 'Stay hydrated, rest, and use cool compresses. Over-the-counter fever reducers (like acetaminophen or ibuprofen) can help if safe for you.';
    symptomsDetected.push('fever');
    recommendedSpecialist = 'General Practitioner / Family Physician';
    medications = ['Acetaminophen (OTC pain/fever reducer)', 'Ibuprofen (OTC NSAID)', 'Oral Rehydration Salts (ORS)'];
  } 
  // Cough / Cold (Daggu / Jalubu)
  else if (lastUserMsg.includes('cough') || lastUserMsg.includes('throat') || lastUserMsg.includes('cold') || lastUserMsg.includes('flu') || lastUserMsg.includes('daggu') || lastUserMsg.includes('daggara') || lastUserMsg.includes('jalubu') || lastUserMsg.includes('jalabu')) {
    reply = "Coughs (Daggu / దగ్గు) and cold/sore throats (Jalubu / జలుబు) are common symptoms of respiratory tract infections. \n\nCould you tell me:\n- Is the cough dry, or are you coughing up mucus?\n- Do you feel congestion, runny nose, or muscle fatigue?\n- How long have you felt like this?";
    conditions = ['Acute Bronchitis', 'Allergic Rhinitis', 'Upper Respiratory Infection'];
    recommendation = 'See a GP if symptoms persist for more than 10-14 days or if you experience wheezing.';
    urgency = 'low';
    firstAid = 'Drink warm liquids, use honey to soothe throat (for adults), and try steam inhalation.';
    symptomsDetected.push('cough & cold');
    recommendedSpecialist = 'General Practitioner / Pulmonologist';
    medications = ['Dextromethorphan (OTC cough suppressant)', 'Pseudoephedrine (OTC decongestant)', 'Saline nasal spray'];
  } 
  // Headache (Thala Noppi)
  else if (lastUserMsg.includes('head') || lastUserMsg.includes('headache') || lastUserMsg.includes('migraine') || lastUserMsg.includes('tala noppi') || lastUserMsg.includes('thala noppi') || lastUserMsg.includes('talanoppi') || lastUserMsg.includes('thalanoppi')) {
    reply = "Headaches (Thala Noppi / తలనొప్పి) can range from minor tension to severe migraines.\n\nTo narrow it down:\n- Where is the pain located (e.g., temples, back of head, one side)?\n- Is it throbbing or a dull ache?\n- Are you experiencing sensitivity to light or nausea?";
    conditions = ['Tension Headache', 'Migraine', 'Dehydration Headache'];
    recommendation = 'Consult a doctor if headaches are frequent or if this is the "worst headache of your life".';
    urgency = 'low';
    firstAid = 'Rest in a quiet, dark room. Apply a cool compress to your forehead. Stay hydrated.';
    symptomsDetected.push('headache');
    recommendedSpecialist = 'Neurologist / General Practitioner';
    medications = ['Ibuprofen (OTC NSAID)', 'Acetaminophen (OTC)', 'Naproxen'];
  } 
  // Stomach Pain (Potta Noppi / Kadupu Noppi)
  else if (lastUserMsg.includes('stomach') || lastUserMsg.includes('belly') || lastUserMsg.includes('abdominal') || lastUserMsg.includes('cramp') || lastUserMsg.includes('potta noppi') || lastUserMsg.includes('pottanoppi') || lastUserMsg.includes('kadupu noppi') || lastUserMsg.includes('kadupunoppi') || lastUserMsg.includes('noppi')) {
    reply = "Abdominal/Stomach pain (Potta Noppi / కడుపు నొప్పి) has many potential causes, from simple indigestion to appendicitis.\n\nTo assist you:\n- Where exactly is the pain located (e.g., upper, lower right, localized)?\n- Are you feeling nauseous, vomiting, or experiencing changes in bowel habits?";
    conditions = ['Gastroenteritis', 'Irritable Bowel Syndrome (IBS)', 'Indigestion'];
    recommendation = 'Visit urgent care if the pain is severe, constant, or localizes to the lower right abdomen.';
    urgency = 'medium';
    firstAid = 'Avoid solid foods for a few hours. Sip clear liquids. Avoid caffeine, alcohol, and spicy foods.';
    symptomsDetected.push('abdominal pain');
    recommendedSpecialist = 'Gastroenterologist / Family Physician';
    medications = ['Antacids (OTC)', 'Bismuth subsalicylate (OTC)', 'Oral Rehydration Salts (ORS)'];
  } 
  // Weight Fluctuations (Baruvu Changes / Lavu / Sanna)
  else if (lastUserMsg.includes('weight') || lastUserMsg.includes('gain') || lastUserMsg.includes('lose') || lastUserMsg.includes('lost') || lastUserMsg.includes('diet') || lastUserMsg.includes('fat') || lastUserMsg.includes('baruvu') || lastUserMsg.includes('lavu') || lastUserMsg.includes('sanna') || lastUserMsg.includes('perugutuna') || lastUserMsg.includes('taggutuna')) {
    reply = "Weight fluctuations (Baruvu / బరువు మార్పులు) over a 6-month period can be influenced by metabolic rates, dietary habits, activity levels, stress levels, or endocrine factors (such as thyroid function).\n\nTo help me evaluate:\n- Approximately how much has your weight changed?\n- Have you noticed other indicators like fatigue, changes in appetite, or mood changes?\n- Have there been changes in your diet, stress levels, or sleep patterns?";
    conditions = ['Hypothyroidism', 'Metabolic Syndrome', 'Lifestyle/Dietary Shifts', 'Hormonal Imbalance'];
    recommendation = 'Schedule a consultation with a General Practitioner to order thyroid panels (TSH, Free T4) and evaluate metabolic markers.';
    urgency = 'low';
    firstAid = 'Keep a food and exercise diary. Maintain structured sleep routines and focus on whole foods. Avoid drastic calorie restriction without clinical oversight.';
    symptomsDetected.push('weight change');
    recommendedSpecialist = 'Endocrinologist / Dietitian';
    medications = ['Vitamin D', 'Vitamin B-complex (supportive supplements)'];
  }
  // Sleep Problems (Nidra Lemi / Insomnia)
  else if (lastUserMsg.includes('sleep') || lastUserMsg.includes('insomnia') || lastUserMsg.includes('nidra') || lastUserMsg.includes('nidhar') || lastUserMsg.includes('kunuku') || lastUserMsg.includes('paduko') || lastUserMsg.includes('vundadam ledhu')) {
    reply = "I'm sorry you are experiencing sleep disturbances (Nidra Lemi / నిద్రలేమి). Proper sleep is essential for cellular recovery and general health. Ongoing sleep difficulties can be linked to stress, sleep apnea, or circadian shifts.\n\nTo narrow it down:\n- How long has your sleep pattern been disrupted?\n- Do you have trouble falling asleep, or do you wake up frequently during the night?\n- Do you feel extremely tired or fatigued during the day?";
    conditions = ['Insomnia', 'Sleep Apnea', 'Circadian Rhythm Disruption', 'Stress-Induced Sleep Disturbances'];
    recommendation = 'Keep a sleep log for 1-2 weeks. Consult a General Practitioner to evaluate underlying causes.';
    urgency = 'low';
    firstAid = 'Follow strict sleep hygiene: keep consistent sleep/wake times, avoid screens for 1 hour before bed, avoid caffeine after 2 PM, and keep your room cool and dark.';
    symptomsDetected.push('sleep disturbance');
    recommendedSpecialist = 'Sleep Specialist / General Practitioner';
    medications = ['Melatonin (OTC sleep aid)', 'Chamomile extract (supportive)'];
  }
  // Default welcome/clarifying response
  else {
    const cleanUserText = lastUserMsg.trim().slice(0, 60);
    const symptomContext = cleanUserText ? `regarding: "${cleanUserText}..."` : "about your symptoms";
    
    reply = `Thank you for sharing your concern ${symptomContext}. I want to help you evaluate this carefully.\n\nCould you tell me:\n- How long have you been experiencing these symptoms?\n- How severe is the discomfort or impact on your day-to-day life?\n- Are there other associated symptoms you are feeling?`;
    conditions = ['Unspecified Symptom Presentation'];
    recommendation = 'Consult a General Practitioner if symptoms persist or cause discomfort.';
    urgency = 'low';
    firstAid = 'Monitor symptom details, rest, and keep a log of changes.';
    recommendedSpecialist = 'General Practitioner';
    symptomsDetected.push(cleanUserText ? cleanUserText.split(' ').slice(0, 3).join(' ') : 'unspecified symptom');
    medications = ['Oral Rehydration Salts (ORS)', 'Multivitamins'];
  }

  // Append disclaimer
  reply += "\n\n*Disclaimer: I am an AI, not a doctor. This analysis is for informational purposes and does not replace professional medical advice.*";

  return {
    reply,
    summary: {
      conditions,
      recommendation,
      urgency,
      firstAid,
      symptomsDetected,
      recommendedSpecialist,
      medications
    }
  };
};

export const analyzeSymptoms = async (messages: IMessage[]): Promise<IAiResponse> => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try Gemini API
  if (geminiKey) {
    try {
      console.log('🤖 Running symptom analysis using Gemini API...');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const formattedHistory = messages.map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');

      const fullPrompt = `${SYSTEM_PROMPT}\n\nConversation History:\n${formattedHistory}\n\nAssistant Response:`;
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();

      return parseAiOutput(responseText);
    } catch (error) {
      console.error('❌ Gemini API Error:', (error as Error).message);
    }
  }

  // 2. Try OpenAI API
  if (openaiKey) {
    try {
      console.log('🤖 Running symptom analysis using OpenAI API...');
      const openai = new OpenAI({ apiKey: openaiKey });
      
      const apiMessages = [
        { role: 'system' as const, content: SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content
        }))
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: apiMessages,
      });

      const responseText = completion.choices[0].message?.content || '';
      return parseAiOutput(responseText);
    } catch (error) {
      console.error('❌ OpenAI API Error:', (error as Error).message);
    }
  }

  // 3. Fallback to expert system / mock rules
  console.log('⚠️ Running symptom analysis using Expert System CSV dataset...');
  const fullConversationText = messages.map(m => m.content).join(' ');
  const expertResult = expertSystem.evaluate(fullConversationText);
  
  if (expertResult) {
    return {
      reply: expertResult.reply,
      summary: {
        conditions: expertResult.conditions,
        recommendation: expertResult.recommendation,
        urgency: expertResult.urgency,
        firstAid: expertResult.firstAid,
        symptomsDetected: expertResult.symptomsDetected,
        recommendedSpecialist: expertResult.recommendedSpecialist
      }
    };
  }

  console.log('⚠️ No matching dataset symptoms. Falling back to default conversational mock response...');
  return generateMockResponse(messages);
};

// Parse raw AI text and extract structured JSON block
const parseAiOutput = (text: string): IAiResponse => {
  const delimiter = '[[[JSON_SUMMARY]]]';
  const parts = text.split(delimiter);

  if (parts.length < 2) {
    return {
      reply: text.trim(),
    };
  }

  const reply = parts[0].trim();
  const jsonStr = parts[1].trim();

  try {
    const summary = JSON.parse(jsonStr);
    return {
      reply,
      summary: {
        conditions: summary.conditions || [],
        recommendation: summary.recommendation || 'Consult your physician.',
        urgency: summary.urgency || 'low',
        firstAid: summary.firstAid,
        symptomsDetected: summary.symptomsDetected || [],
        recommendedSpecialist: summary.recommendedSpecialist || 'General Practitioner',
        medications: summary.medications || []
      }
    };
  } catch (err) {
    console.error('⚠️ Failed to parse AI JSON summary block:', err);
    return {
      reply: text.replace(delimiter, '').trim(),
    };
  }
};
