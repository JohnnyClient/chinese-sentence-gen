// Absurd vocabulary (Chinese words) - оставляем как было для веселья
const ABSURD_WORDS = {
    noun: ["屁股", "放屁", "狗屁", "王八", "笨蛋", "傻瓜", "混蛋", "夜壶", "马桶", "拖鞋", "臭虫", "蟑螂", "腋窝", "挠痒痒"],
    verb: ["放屁", "拉屎", "撒尿", "打嗝", "吃屎", "喝尿", "放风", "扯淡", "挠痒痒"],
    exclamation: ["卧槽", "我靠", "天哪", "我的妈", "见鬼", "靠", "妈的", "哎呀", "哇塞"],
    adj: ["傻逼", "牛逼", "变态", "恶心", "臭", "脏", "丑", "奇葩"]
};

let lexiconData = {
    animate: [],
    inanimate: [],
    location: [],
    verb: [],
    adj: [],
    adv: [],
    question_word: []
};

// Функция для взвешенного случайного выбора
function weightedRandom(items) {
    if (!items || items.length === 0) return null;
    
    // Считаем общую сумму весов (вероятностей)
    let totalWeight = 0;
    for (let item of items) {
        totalWeight += item.weight;
    }
    
    // Генерируем случайное число от 0 до totalWeight
    let randomNum = Math.random() * totalWeight;
    
    // Ищем, какому слову соответствует это число
    for (let item of items) {
        randomNum -= item.weight;
        if (randomNum <= 0) {
            return item.word;
        }
    }
    
    // Fallback (на всякий случай)
    return items[0].word;
}

async function loadLexicon() {
    try {
        const response = await fetch('lexicon.txt');
        if (!response.ok) throw new Error("Файл не найден");
        
        const text = await response.text();
        const lines = text.split('\n');
        
        // Очищаем старые данные
        for (let key in lexiconData) {
            lexiconData[key] = [];
        }

        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('#') || !line) continue;
            
            const parts = line.split('|');
            if (parts.length !== 3) continue;
            
            const [word, pos, probStr] = parts;
            const weight = parseFloat(probStr);
            
            if (lexiconData[pos]) {
                lexiconData[pos].push({ word, weight });
            }
        }
        console.log("Словарь успешно загружен!");
    } catch (error) {
        console.error("Ошибка загрузки словаря:", error);
        // Если файл не загрузился, используем минимальный набор для теста
        lexiconData = {
            animate: [{word: "人", weight: 1}, {word: "学生", weight: 0.5}],
            inanimate: [{word: "书", weight: 1}, {word: "水", weight: 0.8}],
            location: [{word: "学校", weight: 1}, {word: "家", weight: 0.9}],
            verb: [{word: "吃", weight: 1}, {word: "看", weight: 0.9}],
            adj: [{word: "好", weight: 1}, {word: "大", weight: 0.8}],
            adv: [{word: "很", weight: 1}, {word: "都", weight: 0.7}],
            question_word: [{word: "什么", weight: 1}, {word: "谁", weight: 0.8}]
        };
    }
}

function generateNormalSentence() {
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
        ["{animate}{question_word}{verb}{inanimate}？", ["animate", "question_word", "verb", "inanimate"]],
        ["{animate}{question_word}{verb}{location}？", ["animate", "question_word", "verb", "location"]],
        ["{animate}{question_word}去{location}？", ["animate", "question_word", "location"]],
        ["你{verb}{inanimate}还是{verb}{inanimate}？", ["verb", "inanimate", "verb", "inanimate"]]
    ];
    
    const [tmpl, slots] = templates[Math.floor(Math.random() * templates.length)];
    const parts = {};
    
    for (const slot of slots) {
        // Используем нашу новую функцию взвешенного выбора
        const selectedWord = weightedRandom(lexiconData[slot]);
        parts[slot] = selectedWord || "人"; // Fallback если вдруг список пуст
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
document.addEventListener('DOMContentLoaded', async () => {
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const output = document.getElementById('output');
    const modeLabel = document.getElementById('modeLabel');
    
    // Загружаем словарь при старте страницы
    generateBtn.textContent = "⏳ Loading Dictionary...";
    await loadLexicon();
    generateBtn.textContent = "🎲 Generate Sentences";
    
    generateBtn.addEventListener('click', () => {
        const mode = document.querySelector('input[name="mode"]:checked').value;
        const count = Math.min(parseInt(document.getElementById('count').value) || 5, 50);
        
        modeLabel.textContent = `(${mode})`;
        
        const sentences = [];
        for (let i = 0; i < count; i++) {
            let sentence = generateNormalSentence();
            if (mode === 'absurd') sentence = makeAbsurd(sentence);
            sentences.push(sentence);
        }
        
        output.textContent = sentences.join('\n');
    });
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(output.textContent).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "✅ Copied!";
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        });
    });
});
