// Словарь для режима абсурда (оставляем как есть, пусть угарает)
const ABSURD_WORDS = {
    noun: ["屁股", "放屁", "狗屁", "王八", "笨蛋", "傻瓜", "混蛋", "夜壶", "马桶", "拖鞋", "臭虫", "蟑螂", "腋窝", "挠痒痒"],
    verb: ["放屁", "拉屎", "撒尿", "打嗝", "吃屎", "喝尿", "放风", "扯淡", "挠痒痒"],
    exclamation: ["卧槽", "我靠", "天哪", "我的妈", "见鬼", "靠", "妈的", "哎呀", "哇塞"],
    adj: ["傻逼", "牛逼", "变态", "恶心", "臭", "脏", "丑", "奇葩"]
};

let lexicon = null;

// Безопасный fallback (HSK 1-3)
const fallbackLexicon = {
    animate: ["学生", "老师", "医生", "朋友", "经理", "孩子", "先生", "小姐", "工人", "司机"],
    inanimate: ["电脑", "手机", "苹果", "电影", "问题", "天气", "衣服", "牛奶", "面包", "照片"],
    location: ["学校", "公司", "商店", "北京", "图书馆", "餐厅", "医院", "机场", "银行", "公园"],
    verb: ["吃", "看", "去", "做", "喝", "买", "学习", "讨论", "喜欢", "准备", "介绍", "打扫"],
    adj: ["漂亮", "聪明", "重要", "有趣", "困难", "方便", "干净", "便宜", "新鲜", "热闹"],
    adv: ["经常", "已经", "正在", "马上", "非常", "特别", "一起", "都", "也", "最"],
    time: ["今天", "昨天", "明天", "周末", "晚上", "早上", "现在", "上午", "下午", "去年"]
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
    
    // 1. ТОЛЬКО ЛЮДИ. Никаких животных, птиц и насекомых!
    const humanPatterns = /\bperson\b|\bpeople\b|\bteacher\b|\bstudent\b|\bdoctor\b|\bchild\b|\bman\b|\bwoman\b|\bfriend\b|\bdriver\b|\bworker\b|\bboy\b|\bgirl\b|\bbaby\b|\bmanager\b/i;
    
    // 2. Жесткий фильтр мусора (птицы, религия, расы, мифы, наука)
    const excludePatterns = /\bbird\b|\banimal\b|\bfish\b|\binsect\b|\bcat\b|\bdog\b|\bhorse\b|\bcow\b|\bsheep\b|\bpig\b|\bchicken\b|\bduck\b|\bgospel\b|\breligion\b|\brace\b|\bspecies\b|\bmyth\b|\btroposphere\b|\batmosphere\b/i;
    
    const locationPatterns = /\bplace\b|\bcity\b|\bcountry\b|\broom\b|\bhouse\b|\bschool\b|\bstore\b|\bhospital\b|\bmountain\b|\briver\b|\bcompany\b|\brestaurant\b|\blibrary\b|\bpark\b|\bairport\b|\bbank\b/i;
    const timePatterns = /\btime\b|\bday\b|\byear\b|\bmonth\b|\bweek\b|\bmorning\b|\bevening\b|\bnight\b|\btoday\b|\byesterday\b|\btomorrow\b|\bnow\b/i;

    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        const match = line.match(/^(.+?)\s+(.+?)\s+\[(.+?)\]\s+\/(.+)\//);
        if (!match) continue;
        
        const [, trad, simp, pinyin, defs] = match;
        const defsLower = defs.toLowerCase();
        
        // === ЖЕСТКИЙ ФИЛЬТР ДЛИНЫ ===
        // Максимум 3 иероглифа! Это убивает 99% идиом (成语) и сложных терминов.
        if (simp.length > 3 || simp.length < 1) continue;
        if (!/^[\u4e00-\u9fff]+$/.test(simp)) continue;
        if (defsLower.includes('surname') || defsLower.includes('transliteration') || defsLower.includes('abbr')) continue;

        // Отсекаем мусорные дефиниции (птиц, тропосферы и т.д.)
        if (excludePatterns.test(defsLower)) continue;

        // Распределяем по категориям
        if (timePatterns.test(defsLower)) {
            data.time.push(simp);
        } else if (humanPatterns.test(defsLower)) {
            data.animate.push(simp);
        } else if (locationPatterns.test(defsLower)) {
            data.location.push(simp);
        } else if (/\bverb\b|\bto \w+\b/.test(defsLower) && simp.length <= 2) {
            data.verb.push(simp);
        } else if (/\badj\b|\badjective\b/.test(defsLower) && simp.length <= 2) {
            data.adj.push(simp);
        } else if (/\badv\b|\badverb\b/.test(defsLower) && simp.length <= 2) {
            data.adv.push(simp);
        } else if (simp.length >= 2) {
            data.inanimate.push(simp);
        }
    }
    
    for (const key in data) data[key] = [...new Set(data[key])];
    
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
