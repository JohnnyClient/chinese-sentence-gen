// Absurd vocabulary (остается для режима абсурда)
const ABSURD_WORDS = {
    noun: ["屁股", "放屁", "狗屁", "王八", "笨蛋", "傻瓜", "混蛋", "夜壶", "马桶", "拖鞋", "臭虫", "蟑螂", "腋窝", "挠痒痒"],
    verb: ["放屁", "拉屎", "撒尿", "打嗝", "吃屎", "喝尿", "放风", "扯淡", "挠痒痒"],
    exclamation: ["卧槽", "我靠", "天哪", "我的妈", "见鬼", "靠", "妈的", "哎呀", "哇塞"],
    adj: ["傻逼", "牛逼", "变态", "恶心", "臭", "脏", "丑", "奇葩"]
};

let lexicon = null;

// Базовый набор, если cedict.txt не загрузится
const fallbackLexicon = {
    animate: ["学生", "老师", "医生", "朋友", "经理"], // Только 2+ символа
    inanimate: ["电脑", "手机", "苹果", "电影", "问题", "天气"],
    location: ["学校", "公司", "商店", "北京", "图书馆", "餐厅"],
    verb: ["吃", "看", "去", "做", "喝", "买", "学习", "讨论", "喜欢"],
    adj: ["漂亮", "聪明", "重要", "有趣", "困难", "方便"],
    adv: ["经常", "已经", "正在", "马上", "非常", "特别"],
    time: ["今天", "昨天", "明天", "周末", "晚上", "早上"]
};

async function loadLexicon() {
    if (lexicon) return lexicon;
    try {
        const response = await fetch('cedict.txt');
        if (response.ok) {
            const text = await response.text();
            lexicon = parseCedict(text);
            return lexicon;
        }
    } catch (e) {
        console.warn("Could not load cedict.txt, using fallback lexicon.");
    }
    lexicon = fallbackLexicon;
    return lexicon;
}

function parseCedict(text) {
    const data = { animate: [], inanimate: [], location: [], verb: [], adj: [], adv: [], time: [] };
    
    const animatePatterns = /\bperson\b|\bpeople\b|\bteacher\b|\bstudent\b|\bdoctor\b|\bchild\b|\bman\b|\bwoman\b|\banimal\b|\bbird\b|\bfish\b|\bdog\b|\bcat\b|\bfriend\b|\bmanager\b/i;
    const locationPatterns = /\bplace\b|\bcity\b|\bcountry\b|\broom\b|\bhouse\b|\bschool\b|\bstore\b|\bhospital\b|\bmountain\b|\briver\b|\bcompany\b|\brestaurant\b|\blibrary\b/i;
    const timePatterns = /\btime\b|\bday\b|\byear\b|\bmonth\b|\bweek\b|\bmorning\b|\bevening\b|\bnight\b|\btoday\b|\byesterday\b|\btomorrow\b/i;

    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        const match = line.match(/^(.+?)\s+(.+?)\s+\[(.+?)\]\s+\/(.+)\//);
        if (!match) continue;
        
        const [, trad, simp, pinyin, defs] = match;
        const defsLower = defs.toLowerCase();
        
        // Фильтр: только иероглифы, без фамилий и транслитераций
        if (simp.length < 1 || simp.length > 6) continue;
        if (!/^[\u4e00-\u9fff]+$/.test(simp)) continue;
        if (defsLower.includes('surname') || defsLower.includes('transliteration') || defsLower.includes('abbr')) continue;
        
        // === КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Для существительных и прилагательных требуем минимум 2 иероглифа ===
        // Это убивает спам из слов типа "人", "书", "好" и делает предложения взрослее.
        
        if (timePatterns.test(defsLower) && simp.length >= 2) {
            data.time.push(simp);
        } else if (animatePatterns.test(defsLower) && simp.length >= 2) {
            data.animate.push(simp);
        } else if (locationPatterns.test(defsLower) && simp.length >= 2) {
            data.location.push(simp);
        } else if (/\badj\b|\badjective\b/.test(defsLower) && simp.length >= 2) {
            data.adj.push(simp);
        } else if (/\badv\b|\badverb\b/.test(defsLower)) {
            data.adv.push(simp); // Наречия могут быть и 1-символьными (很, 都)
        } else if (/\bverb\b|\bto \w+\b/.test(defsLower)) {
            data.verb.push(simp); // Глаголы тоже могут быть 1-символьными (吃, 去)
        } else if (simp.length >= 2) {
            // Все остальные подходящие слова длиной 2+ символа идут в неодушевленные
            data.inanimate.push(simp);
        }
    }
    
    // Очистка от дубликатов
    for (const key in data) data[key] = [...new Set(data[key])];
    
    // Fallback, если какие-то категории пусты
    if (!data.animate.length) data.animate = fallbackLexicon.animate;
    if (!data.inanimate.length) data.inanimate = fallbackLexicon.inanimate;
    if (!data.location.length) data.location = fallbackLexicon.location;
    if (!data.verb.length) data.verb = fallbackLexicon.verb;
    if (!data.adj.length) data.adj = fallbackLexicon.adj;
    if (!data.adv.length) data.adv = fallbackLexicon.adv;
    if (!data.time.length) data.time = fallbackLexicon.time;
    
    return data;
}

function generateNormalSentence(lex) {
    // Умные шаблоны с грамматическим "клеем" (времени, наречий, частиц)
    const templates = [
        ["{time}，{animate} 在 {location} {verb}。", ["time", "animate", "location", "verb"]],
        ["{animate} 经常 {verb} {inanimate}。", ["animate", "verb", "inanimate"]],
        ["我觉得 {inanimate} 非常 {adj}。", ["inanimate", "adj"]],
        ["{time} {animate} 打算去 {location} {verb}。", ["time", "animate", "location", "verb"]],
        ["{animate} 已经 {verb} 了 {inanimate}。", ["animate", "verb", "inanimate"]],
        ["{location} 的 {inanimate} 很 {adj}。", ["location", "inanimate", "adj"]],
        ["{animate} 正在 {location} {verb} {inanimate}。", ["animate", "location", "verb", "inanimate"]],
        ["你 {time} 想 {verb} 什么 {inanimate}？", ["time", "verb", "inanimate"]],
        ["{animate} 觉得 {location} 怎么样？", ["animate", "location"]],
        ["{time}，{animate} 和 朋友 一起 {verb}。", ["time", "animate", "verb"]]
    ];
    
    const [tmpl, slots] = templates[Math.floor(Math.random() * templates.length)];
    const parts = {};
    
    for (const slot of slots) {
        const list = lex[slot];
        // Если список пуст, берем запасной вариант
        parts[slot] = (list && list.length) ? list[Math.floor(Math.random() * list.length)] : fallbackLexicon[slot][0];
    }
    
    let result = tmpl;
    for (const key in parts) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, parts[key]);
    }
    return result;
}

function makeAbsurd(sentence) {
    let words = Array.from(sentence);
    const insertions = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < insertions; i++) {
        const categories = Object.keys(ABSURD_WORDS);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const absurdWord = ABSURD_WORDS[category][Math.floor(Math.random() * ABSURD_WORDS[category].length)];
        
        const positions = ["start", "middle", "end"];
        const position = positions[Math.floor(Math.random() * positions.length)];
        
        if (position === "start") {
            if (category === "exclamation") words.unshift(absurdWord + "，");
            else words.unshift(absurdWord);
        } else if (position === "end") {
            const lastChar = words[words.length - 1];
            if (lastChar === "。" || lastChar === "？") words.splice(words.length - 1, 0, absurdWord);
            else words.push(absurdWord);
        } else {
            if (words.length > 2) {
                const insertPos = Math.floor(Math.random() * (words.length - 1)) + 1;
                words.splice(insertPos, 0, absurdWord);
            }
        }
    }
    return words.join("");
}

// UI Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const output = document.getElementById('output');
    const modeLabel = document.getElementById('modeLabel');
    
    generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        output.textContent = "Загрузка словаря и генерация...";
        
        const lex = await loadLexicon();
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const count = Math.min(parseInt(document.getElementById('count').value) || 5, 50);
        
        modeLabel.textContent = `(${mode === 'normal' ? 'normal' : 'absurd'})`;
        
        const sentences = [];
        for (let i = 0; i < count; i++) {
            let sentence = generateNormalSentence(lex);
            if (mode === 'absurd') sentence = makeAbsurd(sentence);
            sentences.push(sentence);
        }
        
        output.textContent = sentences.join('\n');
        generateBtn.disabled = false;
    });
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(output.textContent).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "✅ Скопировано!";
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        });
    });
});
