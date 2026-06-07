const OpenAI = require('openai');

const isDemoMode = !process.env.OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY.includes('placeholder') ||
  process.env.OPENAI_API_KEY.includes('your') ||
  process.env.OPENAI_API_KEY === 'sk-placeholder-add-your-real-key-here';

const openai = isDemoMode ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (isDemoMode) {
  console.log('ℹ️  AI running in DEMO mode. Set OPENAI_API_KEY in .env for real AI responses.');
}

const DEMO_RESPONSES = {
  arabic: `**شرح المفهوم:**\n\nهذا رد تجريبي من المنصة. لتفعيل الذكاء الاصطناعي الحقيقي، أضف مفتاح OpenAI API في ملف \`.env\`.\n\n**مثال على ما سيقدمه الذكاء الاصطناعي:**\n- شرح مفصّل للمفهوم المطلوب\n- أمثلة من الحياة اليومية\n- خطوات تعليمية واضحة\n- إجابة على أسئلتك بالعربية أو العامية اللبنانية`,
  lebanese: `**الشرح بالعامية:**\n\nهيدا جواب تجريبي. لتشغيل الذكاء الاصطناعي الحقيقي، ضيف مفتاح OpenAI API بالـ \`.env\`.\n\n**شو رح يعمل الذكاء الاصطناعي:**\n- بيشرح الدرس بطريقة بسيطة بالعامية اللبنانية\n- بيعطيك أمثلة من حياتنا اليومية\n- بيجاوب على أسئلتك بالطريقة اللبنانية`,
  english: `**Demo Response:**\n\nThis is a demo response. Add your OpenAI API key to \`.env\` to enable real AI.\n\n**What the AI will do:**\n- Provide detailed explanations of any concept\n- Give examples relevant to Lebanese students\n- Answer questions in Arabic, Lebanese dialect, or English\n- Help with all school subjects`
};

const SYSTEM_PROMPTS = {
  arabic: `أنت مساعد تعليمي متخصص للطلاب اللبنانيين. اشرح المفاهيم بطريقة واضحة وبسيطة باللغة العربية الفصحى.
استخدم أمثلة من الحياة اليومية. كن صبوراً ومشجعاً. إذا طُلب منك الشرح باللهجة اللبنانية، استخدمها.`,
  lebanese: `إنت مساعد تعليمي للطلاب اللبنانيين. اشرح المواضيع بطريقة بسيطة وواضحة بالعامية اللبنانية.
استخدم أمثلة من الحياة اليومية اللبنانية. كون صبور ومشجع. اكتب بأسلوب ودي وقريب من الطالب.`,
  english: `You are an expert educational assistant for Lebanese students. Explain concepts clearly and simply in English.
Use real-world examples, especially ones relevant to Lebanon. Be patient, encouraging, and thorough.`
};

const chatWithAI = async (messages, language = 'arabic', subject = 'general') => {
  if (isDemoMode) {
    await new Promise(r => setTimeout(r, 600));
    return DEMO_RESPONSES[language] || DEMO_RESPONSES.arabic;
  }
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.arabic;
  const subjectContext = subject !== 'general'
    ? `\nالمادة الدراسية: ${subject}\nركز على مفاهيم هذه المادة عند الشرح.`
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt + subjectContext }, ...messages],
    max_tokens: 2000,
    temperature: 0.7
  });
  return response.choices[0].message.content;
};

const generateQuizFromText = async (text, difficulty = 'medium', questionCount = 10, language = 'arabic') => {
  if (isDemoMode) {
    await new Promise(r => setTimeout(r, 800));
    return Array.from({ length: questionCount }, (_, i) => ({
      question: `سؤال تجريبي رقم ${i + 1}: ما هو المفهوم الأساسي في هذا الدرس؟`,
      type: i % 3 === 0 ? 'true_false' : 'mcq',
      options: i % 3 === 0 ? ['صح', 'خطأ'] : ['الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د'],
      correctAnswer: i % 3 === 0 ? 'صح' : 'الخيار أ',
      explanation: `هذا شرح تجريبي للإجابة. أضف مفتاح OpenAI API لأسئلة حقيقية من النص.`
    }));
  }

  const langInstruction = language === 'arabic' ? 'باللغة العربية' : language === 'english' ? 'in English' : 'بالعامية اللبنانية';
  const prompt = `أنت خبير في إنشاء الاختبارات التعليمية. بناءً على النص التالي، أنشئ ${questionCount} أسئلة ${langInstruction}.
مستوى الصعوبة: ${difficulty === 'easy' ? 'سهل' : difficulty === 'medium' ? 'متوسط' : 'صعب'}
النص: ${text.substring(0, 4000)}
أنشئ الأسئلة بصيغة JSON فقط:
{"questions":[{"question":"","type":"mcq","options":["","","",""],"correctAnswer":"","explanation":""}]}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.5,
    response_format: { type: 'json_object' }
  });
  const parsed = JSON.parse(response.choices[0].message.content);
  return parsed.questions || [];
};

const generateSummary = async (text, language = 'lebanese') => {
  if (isDemoMode) {
    await new Promise(r => setTimeout(r, 700));
    const demos = {
      lebanese: `**ملخص بالعامية اللبنانية (تجريبي):**\n\nهيدا ملخص تجريبي للنص. لتفعيل الملخص الحقيقي بالذكاء الاصطناعي، أضف مفتاح OpenAI API في ملف \`.env\`.\n\n• النص اللي رفعته تمّت معالجته بنجاح\n• الذكاء الاصطناعي رح يلخصه بالعامية اللبنانية\n• رح تحصل على النقاط الأساسية بطريقة سهلة`,
      arabic: `**ملخص بالعربية الفصحى (تجريبي):**\n\nهذا ملخص تجريبي. أضف مفتاح OpenAI API لتفعيل الملخص الحقيقي.\n\n• تمت معالجة المستند بنجاح\n• سيقدم الذكاء الاصطناعي ملخصاً شاملاً ومنظماً\n• ستحصل على النقاط الرئيسية والمفاهيم الأساسية`,
      english: `**Summary (Demo Mode):**\n\nThis is a demo summary. Add your OpenAI API key to enable real summaries.\n\n• Document was processed successfully\n• AI will provide a structured summary of all key points\n• Key concepts will be highlighted and explained`
    };
    return demos[language] || demos.arabic;
  }

  const prompts = {
    lebanese: `بالعامية اللبنانية، لخص هالنص بطريقة بسيطة ومفهومة. النص: ${text.substring(0, 5000)}`,
    arabic: `لخص النص التالي باللغة العربية الفصحى بطريقة واضحة ومنظمة. النص: ${text.substring(0, 5000)}`,
    english: `Summarize the following text clearly and concisely in English. Text: ${text.substring(0, 5000)}`
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert educational content summarizer.' },
      { role: 'user', content: prompts[language] || prompts.arabic }
    ],
    max_tokens: 1500,
    temperature: 0.5
  });
  return response.choices[0].message.content;
};

const explainInLebanese = async (concept, subject = 'general') => {
  if (isDemoMode) {
    await new Promise(r => setTimeout(r, 600));
    return `**الشرح بالعامية (تجريبي):**\n\nبدنا نشرح: "${concept}"\n\nهيدا رد تجريبي. لما تضيف مفتاح OpenAI API، الذكاء الاصطناعي رح يشرحلك هالمفهوم بالعامية اللبنانية بطريقة ممتعة ومفهومة مع أمثلة من حياتنا اليومية! 🇱🇧`;
  }

  const prompt = `كأنك أستاذ لبناني بتشرح لطالب بالمدرسة، اشرح هالمفهوم بالعامية اللبنانية:
المفهوم: ${concept}
المادة: ${subject}
اشرح خطوة خطوة، واستخدم أمثلة من الحياة اللبنانية اليومية.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.8
  });
  return response.choices[0].message.content;
};

const chatStream = async (messages, language = 'arabic') => {
  if (isDemoMode) {
    return null;
  }
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.arabic;
  return openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 2000,
    temperature: 0.7,
    stream: true
  });
};

module.exports = { chatWithAI, generateQuizFromText, generateSummary, explainInLebanese, chatStream, isDemoMode };
