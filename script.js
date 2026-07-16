// Absurd vocabulary (Chinese words)
const ABSURD_WORDS = {
    noun: ["屁股", "放屁", "狗屁", "王八", "笨蛋", "傻瓜", "混蛋", "夜壶", "马桶", "拖鞋", "臭虫", "蟑螂", "腋窝", "挠痒痒"],
    verb: ["放屁", "拉屎", "撒尿", "打嗝", "吃屎", "喝尿", "放风", "扯淡", "挠痒痒"],
    exclamation: ["卧槽", "我靠", "天哪", "我的妈", "见鬼", "靠", "妈的", "哎呀", "哇塞"],
    adj: ["傻逼", "牛逼", "变态", "恶心", "臭", "脏", "丑", "奇葩"]
};

// Words to exclude from generation
const BLACKLIST = new Set([
    "副词", "名词", "动词", "形容词", "状语", "定语", "主语", "谓语", "宾语", "补语",
    "语法", "词性", "词类", "句子", "短语", "词汇", "语言", "文字", "汉字",
    "拼音", "注音", "音标", "声调", "语调", "方言", "普通话", "文言文",
    "概念", "理论", "定义", "原理", "规律", "法则", "公式", "方程",
    "意思", "含义", "解释", "说明", "描述", "表达", "表示",
    "程序", "代码", "算法", "函数", "变量", "参数", "接口", "模块",
    "老兄", "哥们", "家伙", "小子", "丫头", "婆娘",
    "将军", "司令", "政委", "元帅", "军事", "战略", "战术",
    "菩萨", "佛祖", "上帝", "天使", "魔鬼", "神仙"
]);

let lexicon = null;

// Fallback mini-dictionary in case cedict.txt is not found in the repo
const fallbackLexicon = {
    animate: ["人", "学生", "老师", "猫", "狗", "鸟"],
    inanimate: ["书", "东西", "水", "苹果", "车"],
    location: ["学校", "家", "中国", "北京", "商店"],
    verb: ["吃", "看", "去", "做", "喝", "买"],
    adj: ["好", "大", "小", "漂亮", "聪明"],
    adv: ["很", "都", "也", "经常", "已经"],
    question_word: ["什么", "谁", "哪里", "为什么", "怎么", "几", "多少"]
};

async function loadLexicon() {
    if (lexicon) return lexicon;
    
    // Try to fetch local cedict.txt from GitHub Pages root
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
    const data = { animate: [], inanimate: [], location: [], verb: [], adj: [], adv: [], question_word: [] };
    
    const animatePatterns = /\bperson\b|\bpeople\b|\bteacher\b|\bstudent\b|\bdoctor\b|\bchild\b|\bman\b|\bwoman\b|\banimal\b|\bbird\b|\bfish\b|\bdog\b|\bcat\b/i;
    const locationPatterns = /\bplace\b|\bcity\b|\bcountry\b|\broom\b|\bhouse\b|\bschool\b|\bstore\b|\bhospital\b|\bmountain\b|\briver\b/i;
    const questionPatterns = /\binterrogative\b|\bwhat\b|\bwho\b|\bwhere\b|\bhow\b|\bwhy\b|\bwhich\b|\bwhen\b/i;
    
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        const match = line.match(/^(.+?)\s+(.+?)\s+\[(.+?)\]\s+\/(.+)\//);
        if (!match) continue;
        
        const [, trad, simp, pinyin, defs] = match;
        const defsLower = defs.toLowerCase();
        
        if (simp.length > 4 || simp.length < 1) continue;
        if (!/^[\u4e00-\u9fff]+$/.test(simp)) continue;
        if (defsLower.includes('surname') || defsLower.includes('transliteration')) continue;
        if (BLACKLIST.has(simp)) continue;
        
        if (questionPatterns.test(defsLower)) data.question_word.push(simp);
        else if (animatePatterns.test(defsLower)) data.animate.push(simp);
        else if (locationPatterns.test(defsLower)) data.location.push(simp);
        else if (/\bverb\b|\bto \w+\b/.test(defsLower)) data.verb.push(simp);
        else if (/\badj\b|\badjective\b/.test(defsLower)) data.adj.push(simp);
        else if (/\badv\b|\badverb\b/.test(defsLower)) data.adv.push(simp);
        else data.inanimate.push(simp);
    }
    
    for (const key in data) data[key] = [...new Set(data[key])];
    
    if (!data.animate.length) data.animate = fallbackLexicon.animate;
    if (!data.inanimate.length) data.inanimate = fallbackLexicon.inanimate;
    if (!data.location.length) data.location = fallbackLexicon.location;
    if (!data.verb.length) data.verb = fallbackLexicon.verb;
    if (!data.adj.length) data.adj = fallbackLexicon.adj;
    if (!data.adv.length) data.adv = fallbackLexicon.adv;
    if (!data.question_word.length) data.question_word = fallbackLexicon.question_word;
    
    return data;
}

function generateNormalSentence(lex) {
    const templates = [
        ["{animate}{verb}{inanimate}。", ["animate", "verb", "inanimate"]],
        ["{animate}{verb}{location}。", ["animate", "verb", "location"]],
        ["{animate}{adv}{verb}{inanimate}。", ["animate", "adv", "verb", "inanimate"]],
        ["我{verb}{inanimate}。", ["verb", "inanimate"]],
        ["你{verb}{location}。", ["verb", "location"]],
        ["{animate}{verb}{adj}{inanimate}。", ["animate", "verb", "adj", "inanimate"]],
        ["{animate}{verb}{inanimate}吗？", ["animate", "verb", "inanimate"]],
        ["{animate}{verb}{location}吗？", ["animate", "verb", "location"]],
        ["你{verb}{inanimate}吗？", ["verb", "inanimate"]],
        ["你{verb}{location}吗？", ["verb", "location"]],
        ["{animate}在{verb}什么？", ["animate", "verb"]],
        ["{animate}{verb}什么{inanimate}？", ["animate", "verb", "inanimate"]],
        ["谁{verb}{inanimate}？", ["verb", "inanimate"]],
        ["谁{verb}{location}？", ["verb", "location"]],
        ["{animate}去{question_word}？", ["animate", "question_word"]],
        ["{animate}{question_word}{verb}{inanimate}？", ["animate", "question_word", "verb", "inanimate"]],
        ["{animate}{question_word}{verb}{location}？", ["animate", "question_word", "verb", "location"]],
        ["{animate}{question_word}去{location}？", ["animate", "question_word", "location"]],
        ["你{verb}{inanimate}还是{verb}{inanimate}？", ["verb", "inanimate", "verb", "inanimate"]]
    ];
    
    const [tmpl, slots] = templates[Math.floor(Math.random() * templates.length)];
    const parts = {};
    
    for (const slot of slots) {
        const list = lex[slot];
        parts[slot] = list && list.length ? list[Math.floor(Math.random() * list.length)] : "人";
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
        output.textContent = "Loading dictionary and generating...";
        
        const lex = await loadLexicon();
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const count = Math.min(parseInt(document.getElementById('count').value) || 5, 50);
        
        modeLabel.textContent = `(${mode})`;
        
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
            copyBtn.textContent = "✅ Copied!";
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        });
    });
});
