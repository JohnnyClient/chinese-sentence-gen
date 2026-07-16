// 🚫 Blacklist: Exclude grammar terms, proper nouns, and junk
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

// 🛑 Complex/Intransitive Verbs: NEVER let these combine with random nouns!
// (e.g., "下锅" requires a specific object, "挥舞" is intransitive, "解辣" is specific)
const complexVerbs = new Set([
    "下锅", "挥舞", "解辣", "游泳", "洗澡", "睡觉", "起床", "毕业", "辞职", 
    "道歉", "帮忙", "散步", "聊天", "见面", "分手", "结婚", "离婚", "生病", 
    "感冒", "咳嗽", "发烧", "呕吐", "晕倒", "死亡", "出生", "存在", "属于", 
    "变成", "成为", "显得", "好像", "仿佛", "犹如", "等于", "意味着", "包含", "包括"
]);

// 🤪 Absurd vocabulary for the Absurd Mode
const ABSURD_WORDS = {
    noun: ["屁股", "放屁", "狗屁", "王八", "笨蛋", "傻瓜", "混蛋", "夜壶", "马桶", "拖鞋", "臭虫", "蟑螂", "腋窝", "挠痒痒"],
    verb: ["放屁", "拉屎", "撒尿", "打嗝", "吃屎", "喝尿", "放风", "扯淡", "挠痒痒"],
    exclamation: ["卧槽", "我靠", "天哪", "我的妈", "见鬼", "靠", "妈的", "哎呀", "哇塞"],
    adj: ["傻逼", "牛逼", "变态", "恶心", "臭", "脏", "丑", "奇葩"]
};

// 🛡️ Fallback lexicon in case cedict.txt fails to load
const fallbackLexicon = {
    person: ["人", "学生", "老师", "医生", "朋友", "孩子", "男人", "女人"],
    animal: ["猫", "狗", "鸟", "鱼", "马", "猪"],
    food: ["饭", "水", "苹果", "肉", "面条", "面包", "茶", "咖啡"],
    media: ["书", "报纸", "电视", "音乐", "新闻", "信"],
    transport: ["车", "公交车", "火车", "飞机", "自行车"],
    location: ["学校", "家", "中国", "北京", "商店", "医院", "公园"],
    verb_food: ["吃", "喝", "煮", "尝"],
    verb_media: ["看", "读", "听", "写", "学习"],
    verb_transport: ["开", "骑", "坐", "驾驶"],
    verb_motion: ["去", "走", "跑", "跳", "旅行", "到达", "离开", "回", "进", "出"],
    vo_phrase: ["吃饭", "喝水", "看书", "看电视", "听音乐", "睡觉", "洗澡", "开车", "回家", "上学", "上班", "打球", "唱歌", "跳舞", "跑步", "游泳"],
    adj: ["好", "大", "小", "漂亮", "聪明", "开心"],
    adv: ["很", "都", "也", "经常", "已经", "正在", "马上"],
    question_word: ["什么", "谁", "哪里", "为什么", "怎么", "几", "多少"]
};

let lexicon = null;

// 🧠 Load and parse the dictionary with SEMANTIC TAGGING & STRICT FILTERING
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
    const data = {
        person: [], animal: [], food: [], media: [], transport: [], location: [],
        verb_food: [], verb_media: [], verb_transport: [], verb_motion: [],
        vo_phrase: [], adj: [], adv: [], question_word: []
    };

    // 🎯 Semantic tags for nouns (matching English definitions in CEDICT)
    const semanticTags = {
        food: /food|fruit|vegetable|meat|rice|noodle|bread|apple|water|tea|coffee|milk|meal|dish|soup|egg|cheese/i,
        media: /book|newspaper|tv|movie|music|song|news|article|letter|magazine|story/i,
        transport: /car|bus|train|plane|boat|bike|bicycle|motorcycle|taxi|ship|vehicle/i,
        person: /person|people|man|woman|child|student|teacher|doctor|worker|friend|mother|father|boy|girl/i,
        animal: /animal|dog|cat|bird|fish|horse|pig|cow|sheep|monkey|tiger|lion|mouse|rabbit/i,
        location: /city|country|school|home|room|building|street|park|hospital|store|shop|office|classroom|restaurant|market/i
    };

    // 🎯 Semantic tags for verbs
    const verbTags = {
        verb_food: /to eat|to drink|to cook|to boil|to fry|to taste|to chew|to swallow/i,
        verb_media: /to read|to watch|to listen|to look|to write|to study|to learn/i,
        verb_transport: /to drive|to ride|to fly|to sail|to park|to board|to take \(a/i,
        verb_motion: /to go|to walk|to run|to jump|to travel|to arrive|to leave|to return|to enter|to exit|to come/i
    };

    // 🎯 Pattern for ready-made Verb-Object (VO) phrases in CEDICT
    // Matches definitions like "to eat a meal", "to read a book", "to go home"
    const voPattern = /to (?:eat|drink|read|watch|listen|play|drive|ride|take|go|do|make|buy|sell|cook|wash|wear|sleep|run|swim|sing|dance|work|study) (?:a |the )?(?:meal|water|book|tv|music|ball|car|bus|work|school|home|bath|hair|face|clothes|food|tea|coffee|rice|fruit|door|window|computer|phone|table|chair|bed|room|house|street|road|tree|flower|vegetable|meat|fish|egg|milk|bread|cake|soup|apple|banana|orange|grape|nut|soap|towel|paper|bottle|cup|bowl|plate|pan|pot|oven|sink|shower|toilet)/i;

    const questionPatterns = /\binterrogative\b|\bwhat\b|\bwho\b|\bwhere\b|\bhow\b|\bwhy\b|\bwhich\b|\bwhen\b/i;

    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        
        // Parse CEDICT line: 傳統 传统 [chuan2 tong3] /traditional/
        const match = line.match(/^(.+?)\s+(.+?)\s+\[(.+?)\]\s+\/(.+)\//);
        if (!match) continue;
        
        const [, trad, simp, pinyin, defs] = match;
        const defsLower = defs.toLowerCase();

        // 🧹 STRICT FILTERING to keep Normal mode "Normal"
        if (simp.length > 3 || simp.length < 1) continue; // Only 1-3 characters for natural feel
        if (!/^[\u4e00-\u9fff]+$/.test(simp)) continue;   // Only Chinese characters
        if (defsLower.includes('surname') || defsLower.includes('transliteration')) continue;
        if (BLACKLIST.has(simp)) continue;
        
        // 🛑 KILL COMPLEX/INTRANSITIVE VERBS (The "下锅/挥舞" killers)
        if (complexVerbs.has(simp)) continue;

        // 🚫 KILL THE WEIRD STUFF: Idioms, proverbs, rare species, archaic/literary words, variants
        if (/\(idiom\)|\(proverb\)|\(literary\)|\(archaic\)|bird species|animal species|plant species|fish species|insect species|zoology|botany|anatomy|pathology|chemistry|physics|mathematics|variant of|see also|abbr\. for/i.test(defsLower)) continue;

        // 1️⃣ Populate semantic categories
        for (const tag in semanticTags) {
            if (semanticTags[tag].test(defsLower)) {
                data[tag].push(simp);
            }
        }

        // 2️⃣ Populate verb categories
        for (const tag in verbTags) {
            if (verbTags[tag].test(defsLower)) {
                data[tag].push(simp);
            }
        }

        // 3️⃣ Extract ready-made VO phrases (Verb + Object) of length 2
        if (voPattern.test(defsLower) && simp.length === 2) {
            data.vo_phrase.push(simp);
        }

        // 4️⃣ Fallback basic categories
        if (questionPatterns.test(defsLower)) {
            data.question_word.push(simp);
        } else if (/\badj\b|\badjective\b/.test(defsLower)) {
            data.adj.push(simp);
        } else if (/\badv\b|\badverb\b/.test(defsLower)) {
            data.adv.push(simp);
        }
    }

    // 🛡️ Remove duplicates and apply fallback if a category is empty
    for (const key in data) {
        data[key] = [...new Set(data[key])];
        if (data[key].length === 0 && fallbackLexicon[key]) {
            data[key] = fallbackLexicon[key];
        }
    }

    return data;
}

// 🏗️ Generate conscious sentences based on semantic templates
function generateNormalSentence(lex) {
    // Templates strictly bind verbs to their correct semantic objects!
    const templates = [
        ["{person}{verb_food}{food}。", ["person", "verb_food", "food"]],
        ["{person}{verb_media}{media}。", ["person", "verb_media", "media"]],
        ["{person}{verb_transport}{transport}。", ["person", "verb_transport", "transport"]],
        ["{animal}{verb_food}{food}。", ["animal", "verb_food", "food"]],
        ["{person}{verb_motion}{location}。", ["person", "verb_motion", "location"]],
        ["{animal}{verb_motion}{location}。", ["animal", "verb_motion", "location"]],
        ["{person}{adv}{verb_food}{food}。", ["person", "adv", "verb_food", "food"]],
        ["{person}{adv}{verb_media}{media}。", ["person", "adv", "verb_media", "media"]],
        ["{person}{adv}{verb_motion}{location}。", ["person", "adv", "verb_motion", "location"]],
        
        // 🌟 SUPER-CATEGORY: Ready-made VO phrases (100% natural)
        ["{person}{vo_phrase}。", ["person", "vo_phrase"]],
        ["{animal}{vo_phrase}。", ["animal", "vo_phrase"]],
        ["{person}{adv}{vo_phrase}。", ["person", "adv", "vo_phrase"]],
        
        // Questions for variety
        ["{person}{verb_motion}{question_word}？", ["person", "verb_motion", "question_word"]],
        ["{person}{verb_media}什么{media}？", ["person", "verb_media", "media"]]
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

// 🤪 Generate absurdity (for fun)
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

// 🎮 UI Event Listeners
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
