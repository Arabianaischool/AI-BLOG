let currentCategory = '1';
let apiKey = localStorage.getItem('gemini_api_key') || '';

document.addEventListener('DOMContentLoaded', () => {
    // إعداد أزرار التصنيفات
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            document.getElementById('customTopic').classList.toggle('hidden', currentCategory !== '4');
        });
    });
    
    if(apiKey) toggleMainUI();
});

function saveAPIKey() {
    apiKey = document.getElementById('apiKey').value.trim();
    if(!apiKey) {
        alert('الرجاء إدخال مفتاح API صحيح');
        return;
    }
    localStorage.setItem('gemini_api_key', apiKey);
    toggleMainUI();
}

function toggleMainUI() {
    document.getElementById('apiSection').classList.add('hidden');
    document.getElementById('mainUI').classList.remove('hidden');
}

function toggleAPIKey() {
    document.getElementById('apiSection').classList.remove('hidden');
    document.getElementById('mainUI').classList.add('hidden');
}

async function generateArticles() {
    const count = parseInt(document.getElementById('articleCount').value) || 1;
    const topic = currentCategory === '4' 
        ? document.getElementById('customTopic').value.trim()
        : getDefaultTopic();

    if(!validateInputs(topic, count)) return;

    try {
        updateStatus(`جاري إنشاء ${count} مقال... ⏳`);
        const zip = new JSZip();
        
        // إضافة مؤشر تقدم
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress++;
            updateStatus(`جاري إنشاء المقالات... ${progress}%`);
        }, 300);
        
        for(let i = 0; i < count; i++) {
            const content = await fetchArticle(topic);
            zip.file(`مقال_${i+1}.txt`, content);
            
            // تحديث المؤشر الحقيقي
            const realProgress = Math.floor(((i+1)/count)*100);
            progress = Math.min(progress, realProgress);
        }
        
        clearInterval(progressInterval);
        updateStatus(`جاري تحضير الملف للتحميل...`);
        
        const zipContent = await zip.generateAsync({type: 'blob'});
        downloadZip(zipContent);
        
        updateStatus(`تم إنشاء ${count} مقال بنجاح! ✅`);
    } catch(error) {
        updateStatus(`خطأ: ${error.message}`);
    }
}

function validateInputs(topic, count) {
    if(!apiKey) {
        alert('الرجاء إدخال مفتاح API أولاً');
        toggleAPIKey();
        return false;
    }
    if(count < 1 || count > 1000) {
        alert('الرجاء إدخال عدد بين 1 و 1000');
        return false;
    }
    if(!topic) {
        alert('الرجاء إدخال موضوع المقال');
        return false;
    }
    return true;
}

async function fetchArticle(topic) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: generatePrompt(topic)
                }]
            }]
        })
    });

    if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'فشل الاتصال بالخادم');
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function generatePrompt(topic) {
    const prompts = {
        '1': `اكتب مقالة رياضية متكاملة عن ${topic} تتضمن:
- معلومات تاريخية
- إحصائيات حديثة
- آراء الخبراء
- توقعات مستقبلية
استخدم لغة عربية فصحى ومنظمة`,
        
        '2': `اكتب وصفة طعام مفصلة عن ${topic} تتضمن:
- المكونات الدقيقة
- خطوات التحضير المرقمة
- الوقت المطلوب
- القيمة الغذائية
- نصائح التقديم
استخدم لغة عربية واضحة`,
        
        '3': `اكتب دليلاً سياحياً شاملاً عن ${topic} يتضمن:
- الموقع وأفضل أوقات الزيارة
- المعالم الرئيسية
- أماكن الإقامة
- المطاعم المحلية
- نصائح السفر
استخدم لغة عربية جذابة`,
        
        '4': `اكتب مقالة متكاملة عن ${topic} تتضمن:
- مقدمة واضحة
- محتوى منظم
- خاتمة مختصرة
- مراجع إن وجدت
استخدم لغة عربية فصحى واحترافية`
    };
    return prompts[currentCategory];
}

function downloadZip(content) {
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `المقالات_${new Date().toLocaleDateString('ar-EG')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // تحرير الذاكرة بعد ثانية
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
    }, 1000);
}

function getDefaultTopic() {
    const topics = {
        '1': 'أفضل الأندية الرياضية العربية',
        '2': 'وصفة كعك العيد التقليدي',
        '3': 'أجمل المدن السياحية في الخليج'
    };
    return topics[currentCategory];
}

function updateStatus(message) {
    document.getElementById('statusBar').textContent = message;
}