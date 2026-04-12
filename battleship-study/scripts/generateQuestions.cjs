const fs = require('fs');
const path = require('path');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate incorrect options based on the correct answer type
const generateWrongNumbers = (correct, count) => {
  const options = new Set([String(correct)]);
  while (options.size < count) {
    const offset = randomInt(-5, 5);
    const wrong = correct + offset;
    if (wrong !== correct && wrong > 0) {
      options.add(String(wrong));
    }
  }
  return Array.from(options).filter(c => c !== String(correct)).slice(0, count - 1);
};

const generateWrongStrings = (correct, pool, count) => {
  const options = new Set([correct]);
  while (options.size < count) {
    const wrong = pool[randomInt(0, pool.length - 1)];
    if (wrong !== correct) options.add(wrong);
  }
  return Array.from(options).filter(c => c !== correct).slice(0, count - 1);
};

const QUESTIONS = {};

// ===== SPACE STAGE (Math) =====
const genMath = (count, opName, min1, max1, min2, max2) => {
  const qs = [];
  for (let i=0; i<count; i++) {
    const a = randomInt(min1, max1);
    const b = randomInt(min2, max2);
    let qText, correct;
    if (opName === '+') { qText = `${a} + ${b} = ?`; correct = a + b; }
    if (opName === '-') { const n1 = Math.max(a,b); const n2 = Math.min(a,b); qText = `${n1} - ${n2} = ?`; correct = n1 - n2; }
    if (opName === '*') { qText = `${a} × ${b} = ?`; correct = a * b; }
    if (opName === '/') { const res = randomInt(1, 10); const n1 = res * a; qText = `${n1} ÷ ${a} = ?`; correct = res; }
    
    // We store the options containing the correct answer + 3 wrongs.
    // The shuffle logic will happen in useGameEngine.js, so here we just return the array with the correct one first.
    // However, the rule states to return `options` array and `correctAnswer` string.
    const wrong = generateWrongNumbers(correct, 4);
    qs.push({ id: `space_${Math.random().toString(36).substring(7)}`, text: qText, options: [String(correct), ...wrong], correctAnswer: String(correct) });
  }
  return qs;
};
QUESTIONS['m_space_1'] = genMath(25, '+', 1, 9, 1, 9);
QUESTIONS['m_space_2'] = genMath(25, '-', 5, 20, 1, 9);
QUESTIONS['m_space_3'] = genMath(25, '*', 2, 9, 2, 9);
QUESTIONS['m_space_4'] = genMath(25, '/', 2, 9, 1, 10);
QUESTIONS['b_space'] = [...genMath(10, '*', 10, 20, 2, 9), ...genMath(15, '+', 50, 100, 50, 100)];

// ===== NINJA STAGE (Japanese) =====
const ninjaKanji1 = [ ['木', 'き'], ['水', 'みず'], ['火', 'ひ'], ['山', 'やま'], ['川', 'かわ'], ['花', 'はな'], ['空', 'そら'], ['犬', 'いぬ'], ['虫', 'むし'], ['雨', 'あめ'] ];
const ninjaKanji2 = [ ['走る', 'はしる'], ['泳ぐ', 'およぐ'], ['飛ぶ', 'とぶ'], ['歌う', 'うたう'], ['作る', 'つくる'], ['読む', 'よむ'], ['書く', 'かく'], ['聞く', 'きく'] ];
const ninjaOpposites = [ ['上','下'], ['右','左'], ['前','後'], ['明','暗'], ['大','小'], ['長','短'], ['高','低'], ['広','狭'], ['早','遅'] ];
const ninjaKotowaza = [ ['犬も歩けば','棒にあたる'], ['猿も木から','落ちる'], ['鬼に','金棒'], ['石の上にも','三年'], ['花より','団子'] ];
const ninjaKanjiBoss = [ ['学校', 'がっこう'], ['時計', 'とけい'], ['勉強', 'べんきょう'], ['教室', 'きょうしつ'], ['先生', 'せんせい'], ['校庭', 'こうてい'], ['算数', 'さんすう'] ];

const genPairs = (pool, qFormat) => {
  const qs = [];
  // generate multiple rounds to reach ~25
  for(let i=0; i<25; i++) {
    const pair = pool[randomInt(0, pool.length-1)];
    const wrongs = generateWrongStrings(pair[1], pool.map(p=>p[1]), 4);
    qs.push({
      id: `ninja_${Math.random().toString(36).substring(7)}`,
      text: qFormat.replace('{0}', pair[0]),
      correctAnswer: pair[1],
      options: [pair[1], ...wrongs]
    });
  }
  return qs;
};
QUESTIONS['m_ninja_1'] = genPairs(ninjaKanji1, '「{0}」の読み方は？');
QUESTIONS['m_ninja_2'] = genPairs(ninjaKanji2, '「{0}」の読み方は？');
QUESTIONS['m_ninja_3'] = genPairs(ninjaOpposites, '「{0}」の反対は？');
QUESTIONS['m_ninja_4'] = genPairs(ninjaKotowaza, 'ことわざ：「{0}〇〇」？');
QUESTIONS['b_ninja'] = genPairs(ninjaKanjiBoss, '「{0}」の読みは？');

// ===== JUNGLE STAGE (Science) =====
const sciAnimals = [ ['イヌ', 'ほ乳類'], ['カラス', '鳥類'], ['カエル', '両生類'], ['ヘビ', 'は虫類'], ['メダカ', '魚類'], ['クジラ', 'ほ乳類'], ['ペンギン', '鳥類'] ];
const sciPlants = [ ['光合成', '太陽の光'], ['根', '水を吸う'], ['葉', '栄養を作る'], ['花', '種を作る'], ['茎', '水を運ぶ'] ];
const sciSpace = [ ['太陽', '東から昇る'], ['地球', '太陽の周りを回る'], ['月', '地球の周りを回る'], ['1日', '24時間'], ['1年', '365日'] ];
const sciPhysics = [ ['氷', '0℃で凍る'], ['お湯', '100℃で沸騰する'], ['N極とS極', 'くっつく'], ['N極とN極', 'しりぞけあう'] ];
const sciBoss = [ ['こん虫のあし', '6本'], ['クモのあし', '8本'], ['金星', '一番明るい星'], ['光合成の気体', '二酸化炭素'] ];

QUESTIONS['m_jungle_1'] = genPairs(sciAnimals, '「{0}」は何のなかま？');
QUESTIONS['m_jungle_2'] = genPairs(sciPlants, '「{0}」の役割は？');
QUESTIONS['m_jungle_3'] = genPairs(sciSpace, '「{0}」について正しいのは？');
QUESTIONS['m_jungle_4'] = genPairs(sciPhysics, '「{0}」について正しいのは？');
QUESTIONS['b_jungle'] = genPairs(sciBoss, '「{0}」について正しいのは？');

// ===== OCEAN STAGE (English) =====
const engAnimals = [ ['Dog', 'いぬ'], ['Cat', 'ねこ'], ['Bird', 'とり'], ['Fish', 'さかな'], ['Cow', 'うし'], ['Pig', 'ぶた'], ['Horse', 'うま'] ];
const engColors = [ ['Red', 'あか'], ['Blue', 'あお'], ['Green', 'みどり'], ['Yellow', 'きいろ'], ['Black', 'くろ'], ['White', 'しろ'] ];
const engNumbers = [ ['One', '1'], ['Two', '2'], ['Three', '3'], ['Four', '4'], ['Five', '5'], ['Ten', '10'] ];
const engGreetings = [ ['Good morning', 'おはよう'], ['Hello', 'こんにちは'], ['Thank you', 'ありがとう'], ['Goodbye', 'さようなら'] ];
const engBoss = [ ['I am ~', '私は～です'], ['You are ~', 'あなたは～です'], ['Apple', 'りんご'], ['Water', '水'], ['Sun', '太陽'] ];

QUESTIONS['m_ocean_1'] = genPairs(engAnimals, '「{0}」の意味は？');
QUESTIONS['m_ocean_2'] = genPairs(engColors, '「{0}」の意味は？');
QUESTIONS['m_ocean_3'] = genPairs(engNumbers, '「{0}」の意味は？');
QUESTIONS['m_ocean_4'] = genPairs(engGreetings, '「{0}」の意味は？');
QUESTIONS['b_ocean'] = genPairs(engBoss, '「{0}」の意味は？');

// ===== DESERT STAGE (Social Studies) =====
const socMap = [ ['北', '上'], ['南', '下'], ['東', '右'], ['西', '左'], ['島国', '海に囲まれた国'] ];
const socCity = [ ['東京', '日本の首都'], ['北海道', '一番大きい'], ['沖縄', '南の島'], ['京都', '昔の都'], ['富士山', '一番高い山'] ];
const socJobs = [ ['警察官', 'まちを守る'], ['消防士', '火を消す'], ['郵便配達員', '手紙を運ぶ'], ['先生', '勉強を教える'] ];
const socMoney = [ ['お店', '物を買う所'], ['銀行', 'お金を預ける所'], ['駅', '電車に乗る所'], ['病院', '病気を治す所'] ];
const socBoss = [ ['都道府県の数', '47'], ['日本の通貨', '円'], ['昔の日本', '米もお金の代わり'], ['国会', '法律を作る所'] ];

QUESTIONS['m_desert_1'] = genPairs(socMap, '「{0}」といえば？');
QUESTIONS['m_desert_2'] = genPairs(socCity, '「{0}」といえば？');
QUESTIONS['m_desert_3'] = genPairs(socJobs, '「{0}」の仕事は？');
QUESTIONS['m_desert_4'] = genPairs(socMoney, '「{0}」は何をする所？');
QUESTIONS['b_desert'] = genPairs(socBoss, '「{0}」といえば？');

// ===== FINAL BOSS STAGE (MIXED) =====
const finalMix1 = [ ['50×20', '1000'], ['100÷4', '25'], ['Dog', 'いぬ'], ['Water', '水'] ];
const finalMix2 = [ ['太陽', '東から昇る'], ['地球', '太陽の周りを回る'], ['日本で一番高い山', '富士山'], ['犬も歩けば', '棒にあたる'] ];
const finalBossUltimate = [ ['99×99', '9801'], ['1年は何日？', '365日'], ['Thank youの意味', 'ありがとう'], ['光合成で必要なもの', '太陽の光'] ];

QUESTIONS['m_final_1'] = genPairs(finalMix1, '「{0}」の答え・意味は？');
QUESTIONS['m_final_2'] = genPairs(finalMix2, '「{0}」といえば？');
QUESTIONS['b_final'] = genPairs(finalBossUltimate, '【超難問】「{0}」？');

const codeContent = `// AUTO-GENERATED BY generateQuestions.cjs\n\nexport const QUESTIONS_DATA = ${JSON.stringify(QUESTIONS, null, 2)};\n\nexport const getRandomQuestion = (monsterId) => {\n  const pool = QUESTIONS_DATA[monsterId];\n  if (!pool || pool.length === 0) return null;\n  const randomIndex = Math.floor(Math.random() * pool.length);\n  return pool[randomIndex];\n};\n`;

fs.writeFileSync(path.join(__dirname, '../src/data/questions.js'), codeContent);
console.log('Successfully generated questions.js with', Object.keys(QUESTIONS).length * 25, 'questions over', Object.keys(QUESTIONS).length, 'enemies.');
