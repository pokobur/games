// local_appraiser.js - Client-side image color/light analysis & RPG appraisal (No API required)

const ITEM_CATALOG = {
    fire: [
        { name: "ほのおの けん", description: "あつく もえる ゆうしゃの けん！くらやみも ぱっと あかるく てらすよ。", baseRarity: 4 },
        { name: "メラメラ・スライム", description: "さわると ぽかぽか あたたかい！おこると ちょっとだけ けむりが でるよ。", baseRarity: 2 },
        { name: "ルビーの ゆびわ", description: "まっかな ほうせきが キラキラ！つけると げんきが 100ばいに なるかも？", baseRarity: 5 },
        { name: "たいようの シールド", description: "どんな さむい ふゆでも ぽかぽか！ひの パワーを ためこむ ふしぎな たて。", baseRarity: 4 },
        { name: "ファイアー・バッジ", description: "ぼうけんしゃの あかし！もっているだけで なんだか ゆうきが わいてくるよ。", baseRarity: 3 },
        { name: "ぽかぽか たまご", description: "もうすぐ ふしぎな トリが うまれそう！そっと あたためて あげてね。", baseRarity: 3 },
        { name: "マグマの カギ", description: "ひみつの とびらを あける カギ！ちょっと アツアツだから きをつけて。", baseRarity: 4 },
        { name: "レッド・ドラゴン", description: "ちいさな ほのおの ドラゴン！おいしい ものが だいすきな くいしんぼう。", baseRarity: 5 },
        { name: "イチゴの まほうつえ", description: "あまくて いいにおいが する つえ！ふると ハートの あわが とびだすよ。", baseRarity: 3 },
        { name: "もえる ぼうけんブーツ", description: "はくと すごく はやく はしれる！かけっこで いちばんに なれるかも？", baseRarity: 2 }
    ],
    nature: [
        { name: "もりの リーフソード", description: "はっぱで できた やさしい けん！しぜんの ちからで みんなを まもるよ。", baseRarity: 3 },
        { name: "いやしの ハーブ", description: "いい かおりが する ふしぎな くさ！つかれた ときに げんきを くれるよ。", baseRarity: 2 },
        { name: "エメラルドの たね", description: "うえると 1にちで おおきな きに なるかも？キラキラ ひかる すごい たね。", baseRarity: 5 },
        { name: "ピョンピョン・カエル", description: "どこまでも たかく ジャンプできる！あめの ひに うたうのが とくいだよ。", baseRarity: 2 },
        { name: "もりのかみさまの カンムリ", description: "かぶると どうぶつたちの ことばが わかるかも？もりの たからもの！", baseRarity: 5 },
        { name: "クローバーの おまもり", description: "もっていると いいことが いっぱい おきる！ラッキーを よぶ アイテム。", baseRarity: 4 },
        { name: "ミドリ・スライム", description: "ぷるぷる していて きもちいい！はっぱの うえで おひるねするのが すき。", baseRarity: 1 },
        { name: "かぜの オカリナ", description: "ふくと さわやかな かぜが ふいてくる！とりたちも いっしょに うたうよ。", baseRarity: 4 },
        { name: "ドングリの よろい", description: "かたくて じょうぶな まもりの どうぐ！リスたちが つかう たからもの。", baseRarity: 2 },
        { name: "しゃべる サボテン", description: "チクチク しているけど ほんとは やさしい！おはようって はなしかけてみて。", baseRarity: 3 }
    ],
    water: [
        { name: "うみの しずく", description: "なみの おとが きこえてくる ほうせき！みていると こころが すっきりするよ。", baseRarity: 4 },
        { name: "こおりの ほし", description: "ずっと とけない ふしぎな こおり！なつに もっていると ひんやり すずしい。", baseRarity: 4 },
        { name: "アクア・クリスタル", description: "みずの まほうが つまった すいしょう！おおきな にじを つくることも できるよ。", baseRarity: 5 },
        { name: "ぷかぷか・クラゲ", description: "うみの そこを およぐ ともだち！くらくなると やさしく ぽわっと ひかるよ。", baseRarity: 2 },
        { name: "ブルー・ドラゴン", description: "そらと うみを じゆうに とぶ ドラゴン！あめを ふらせる まほうが つかえる。", baseRarity: 5 },
        { name: "マーメイドの クシ", description: "とかすと かみが サラサラに なる！うみの おひめさまの だいじな たからもの。", baseRarity: 3 },
        { name: "しぶきの やり", description: "みずを ぴゅーっと とばせる どうぐ！みずあそびが もっと たのしくなるね。", baseRarity: 3 },
        { name: "あおい そらの マント", description: "はおると ふわっと うかぶかも？かぜに のって おさんぽしたくなる マント。", baseRarity: 4 },
        { name: "さかなの カギ", description: "うみの そこの たからばこを あける カギ！ちいさな あわが ぷくぷく でるよ。", baseRarity: 2 },
        { name: "クリスタル・ボトル", description: "どんな かわいた のども うるおす まほうの みず！のむと シャキッと するよ。", baseRarity: 1 }
    ],
    thunder: [
        { name: "いなずまの カギ", description: "ピカッと ひかる はやい カギ！あけると きっと すごい ものが でてくるよ。", baseRarity: 4 },
        { name: "おうごんの コイン", description: "ピッカピカに かがやく たから！おみせに もっていったら なにが かえるかな？", baseRarity: 3 },
        { name: "スター・ベル", description: "ならすと チリンチリンと すてきな おと！ほしたちが あつまって くるよ。", baseRarity: 4 },
        { name: "ピカピカ・スライム", description: "でんきで ちょっと ビリビリする スライム！くらい おへやの ライトに なるよ。", baseRarity: 2 },
        { name: "かみなり・シューズ", description: "はいた とたんに ビュンと ひとっとび！まるで いなずまみたいな スピード。", baseRarity: 5 },
        { name: "サンダー・ソード", description: "ふるたびに パチパチ ひばなが とぶ！てきを ビックリさせる かっこいい けん。", baseRarity: 5 },
        { name: "きんいろの コンパス", description: "たからものの ばしょを おしえてくれる！ハリが クルクル まわって ドキドキ。", baseRarity: 3 },
        { name: "たいようの バッジ", description: "みんなを えがおに する パワーがある！みているだけで げんきが でてくるね。", baseRarity: 2 },
        { name: "ハチミツの ツボ", description: "あまくて とろとろの すごい エネルギー！くまさんも ほしがる だいこうぶつ。", baseRarity: 1 },
        { name: "おほしさまの ランタン", description: "ながれぼしを とじこめた ランタン！よるみちでも ぜんぜん こわくないよ。", baseRarity: 4 }
    ],
    magic: [
        { name: "まほうの すいしょう", description: "みらいが ちょっとだけ みえるかも？クルクル もようが うごく ふしぎな たま。", baseRarity: 5 },
        { name: "ミステリー・ポーション", description: "のむと こえが かわったり おおきくなったり？どんな こうかか おたのしみ！", baseRarity: 3 },
        { name: "ゆめいろの リボン", description: "つけると とっても ステキな ゆめが みられる！まくらの そばに おいてね。", baseRarity: 2 },
        { name: "まじょの ぼうし", description: "かぶると まほうが つかえるように なるかも？ほしの もようが ポイント。", baseRarity: 4 },
        { name: "ピンク・フェアリー", description: "ちいさな はねで パタパタ とぶ ようせい！おねがいごとを きいてくれるよ。", baseRarity: 5 },
        { name: "おとぎの ほん", description: "ひらくと なかから モンスターや おしろが とびだす！よむたびに べつの おはなし。", baseRarity: 4 },
        { name: "むらさきの ほしのかけら", description: "うちゅうから おちてきた レアな いし！そっと さわると ぷるっと ゆれるよ。", baseRarity: 3 },
        { name: "キラキラ・ステッキ", description: "ひとふりで おへやが キラキラに！みんなを ハッピーに する まほうの どうぐ。", baseRarity: 4 },
        { name: "ねこみみ カチューシャ", description: "つけると ネコちゃんみたいに みみが よくきこえる！にゃーんと なきたくなる？", baseRarity: 2 },
        { name: "ふしぎな マカロンのいし", description: "おいしそうだけど かじっちゃ ダメ！たからばこに しまっておく イシだよ。", baseRarity: 1 }
    ],
    light: [
        { name: "てんしの はね", description: "ふわふわで とっても やわらかい！もっていると こころが ぽかぽか やさしくなる。", baseRarity: 4 },
        { name: "ひかりの かけら", description: "まぶしいくらい ピカピカ ひかる！わるい ものを どこかへ おいはらってくれるよ。", baseRarity: 5 },
        { name: "ゆきだるまの たまご", description: "つめたくて まんまるな たまご！なかに ちいさな ゆきの ようせいが いるかも。", baseRarity: 3 },
        { name: "しろい ペガサス", description: "おおぞらを かけぬける きれいな うま！せなかに のせて くもの うえへ つれていくよ。", baseRarity: 5 },
        { name: "クラウド・マシュマロ", description: "くもみたいに ふわっふわの アイテム！まくらに したら ぐっすり ねむれそう。", baseRarity: 2 },
        { name: "プラチナの けん", description: "まぶしく かがやく しろい けん！ゆうきある こどもだけが もちあげられるよ。", baseRarity: 5 },
        { name: "ミルキー・ストーン", description: "やさしい しろいいろの ほうせき！おやすみの まえに みると いいゆめ みられるよ。", baseRarity: 2 },
        { name: "ぎんいろの ホイッスル", description: "ふくと どこからともなく なかまが あつまる！だいピンチの ときの みかた。", baseRarity: 3 },
        { name: "パールの くびかざり", description: "うみの そこで みつけた きれいな たま！つけると たちまち おうじさま・おひめさま。", baseRarity: 4 },
        { name: "おつきさまの カガミ", description: "のぞくと ひみつの すがたが うつるかも？よるに パワーが アップする カガミ。", baseRarity: 3 }
    ],
    shadow: [
        { name: "しのびの マント", description: "きると すがたが みえなくなる！？かくれんぼで ぜったいに みつからない マント。", baseRarity: 4 },
        { name: "くろい いんせき", description: "とおい うちゅうから やってきた すごい いし！ずっしり おもくて つよそうな パワー。", baseRarity: 4 },
        { name: "ナイト・シャドウ", description: "よるの パトロールが とくいな かっこいい かげ！いつも キミを まもってくれる。", baseRarity: 5 },
        { name: "くろネコの おまもり", description: "よるでも めが よくみえるように なる！かるがる ジャンプできる ふしぎな パワー。", baseRarity: 3 },
        { name: "くらやみの コンパス", description: "まっくらな どうくつでも まよわない！ひみつの ちかみちを おしえてくれるよ。", baseRarity: 3 },
        { name: "ブラック・ダイヤ", description: "すごく かたくて ぜったいに われない ほうせき！ぼうけんかの あこがれの たから。", baseRarity: 5 },
        { name: "コウモリの つばさ", description: "パタパタ とんで よぞらを さんぽ！おそらの おほしさまを かぞえにいこう。", baseRarity: 2 },
        { name: "まものの メダル", description: "むかしの まおうが もっていたかも？なんだか ちょっと ミステリアスな メダル。", baseRarity: 3 },
        { name: "くろい ぼうけんバッグ", description: "どれだけ いれても かるくなる！たくさん たからものを つめこもう。", baseRarity: 2 },
        { name: "かげの ブーメラン", description: "なげると クルッと まわって かならず もどってくる！れんしゅうすれば めいじんに。", baseRarity: 1 }
    ],
    earth: [
        { name: "こだいの せきばん", description: "むかしの ひみつが かかれた いしの いた！なにが かいてあるか よんでみよう！", baseRarity: 4 },
        { name: "ぼうけんの ちず", description: "まだ だれも しらない しまへの ちず！これを もって たんけんに しゅっぱつだ！", baseRarity: 4 },
        { name: "がんせき ゴーレム", description: "おおきくて ちからもちの ともだち！どんな おもい いわも かるがる もちあげるよ。", baseRarity: 3 },
        { name: "トレジャー・ボックス", description: "なかに なにが はいっているか ドキドキ！あけるまで わからない ひみつの はこ。", baseRarity: 5 },
        { name: "ウッド・シールド", description: "あたたかみのある きの たて！もりの なかでも じょうぶで たよりに なるよ。", baseRarity: 2 },
        { name: "かせきの タマゴ", description: "きょうりゅうの あかちゃんが ねむっているかも？おおむかしの ロマンが いっぱい！", baseRarity: 5 },
        { name: "てつの ハンマー", description: "なんでも トントン つくれる どうぐ！ひみつきちを つくるときに だいかつやく。", baseRarity: 2 },
        { name: "ちゃいろの モグラさん", description: "つちの なかを ほるのが とくい！たまに おたからを みつけて きてくれるよ。", baseRarity: 3 },
        { name: "どきどき コンパス", description: "あたらしい はっけんが ある ほうこうへ むく！きょうは どこへ あそびに いく？", baseRarity: 2 },
        { name: "おやつの クッキー", description: "さくさく あまくて おいしい かいふくアイテム！たべると げんき まんたんに なるよ。", baseRarity: 1 }
    ],
    rainbow: [
        { name: "にじの かけはし", description: "7つの いろが キラキラ かがやく！みつけると とっても ハッピーに なれる たから。", baseRarity: 5 },
        { name: "レインボー・スライム", description: "いろが どんどん かわる すごい スライム！ぜんぶの いろの パワーを もっているよ。", baseRarity: 4 },
        { name: "ゆめの パレット", description: "どんな えでも ほんものみたいに かける！おえかきが もっと すきに なる どうぐ。", baseRarity: 3 },
        { name: "にじいろ ドラゴン", description: "せかいに なんびきも いない ちょうレアな ドラゴン！そらに にじを かけて とぶよ。", baseRarity: 5 },
        { name: "ハッピー・クリスタル", description: "みているだけで ワクワクする ほうせき！きみの たいせつな たからものに なるよ。", baseRarity: 4 },
        { name: "カラフル・キャンディ", description: "なめるたびに あじが かわる ふしぎな アメ！イチゴや ソーダの あじが するかも？", baseRarity: 2 },
        { name: "まほうの プリズム", description: "ひかりを あてると おへやじゅうが にじいろに！パーティーに ぴったりの アイテム。", baseRarity: 3 },
        { name: "ユニコーンの つの", description: "きれいな にじいろに ひかる つの！やさしくて ゆうきある ひとにしか みえないよ。", baseRarity: 5 }
    ]
};

const RARE_PREFIXES = [
    "でんせつの ",
    "まぼろしの ",
    "ちょうレアな ",
    "かがやく "
];

function rgbToHsv(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
        if (max === rn) h = ((gn - bn) / d) % 6;
        else if (max === gn) h = (bn - rn) / d + 2;
        else h = (rn - gn) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h, s, v };
}

function classifyPixel(r, g, b) {
    const { h, s, v } = rgbToHsv(r, g, b);
    if (v < 0.22) return "shadow";
    if (s < 0.18 && v > 0.78) return "light";
    if (s < 0.22) return "earth";
    if (h < 22 || h >= 340) return "fire";
    if (h >= 22 && h < 45) return v >= 0.5 && s >= 0.45 ? "fire" : "earth";
    if (h >= 45 && h < 72) return "thunder";
    if (h >= 72 && h < 165) return "nature";
    if (h >= 165 && h < 255) return "water";
    return "magic";
}

/**
 * Analyze dominant colors and visual energy directly in browser Canvas.
 */
function analyzeImageColors(dataUrl) {
    return new Promise((resolve) => {
        const fallback = {
            element: "earth",
            avgSaturation: 0.3,
            contrast: 0.3,
            imageHash: Date.now() % 1000
        };

        if (!dataUrl || typeof document === "undefined") {
            resolve(fallback);
            return;
        }

        const img = new Image();
        img.onload = () => {
            try {
                const size = 48;
                const canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, size, size);
                const data = ctx.getImageData(0, 0, size, size).data;

                const counts = {
                    fire: 0,
                    nature: 0,
                    water: 0,
                    thunder: 0,
                    magic: 0,
                    light: 0,
                    shadow: 0,
                    earth: 0
                };

                let totalSat = 0;
                let totalLum = 0;
                let totalLumSq = 0;
                let hash = 0;
                const pixelCount = size * size;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const bucket = classifyPixel(r, g, b);
                    counts[bucket]++;

                    const { s, v } = rgbToHsv(r, g, b);
                    totalSat += s;
                    totalLum += v;
                    totalLumSq += v * v;

                    if (i % 64 === 0) {
                        hash = (hash * 31 + r + g * 3 + b * 7) % 100000;
                    }
                }

                const avgSaturation = totalSat / pixelCount;
                const meanLum = totalLum / pixelCount;
                const variance = Math.max(0, totalLumSq / pixelCount - meanLum * meanLum);
                const contrast = Math.min(1, Math.sqrt(variance) * 2.5);

                const chromaticBuckets = ["fire", "nature", "water", "thunder", "magic"];
                const activeChromatic = chromaticBuckets.filter(
                    (b) => counts[b] > pixelCount * 0.1
                ).length;

                let element = "earth";
                if (activeChromatic >= 3 && avgSaturation > 0.32) {
                    element = "rainbow";
                } else {
                    // Prefer strong chromatic color if present over neutral background
                    const topChromatic = chromaticBuckets.reduce((best, cur) =>
                        counts[cur] > counts[best] ? cur : best
                    , chromaticBuckets[0]);

                    if (counts[topChromatic] >= pixelCount * 0.16) {
                        element = topChromatic;
                    } else {
                        element = Object.keys(counts).reduce((best, cur) =>
                            counts[cur] > counts[best] ? cur : best
                        , "earth");
                    }
                }

                resolve({
                    element,
                    avgSaturation,
                    contrast,
                    imageHash: hash
                });
            } catch (e) {
                console.warn("Canvas analysis fallback:", e);
                resolve(fallback);
            }
        };
        img.onerror = () => resolve(fallback);
        img.src = dataUrl;
    });
}

function computeRarity(baseRarity, avgSaturation, contrast) {
    const energy = avgSaturation * 0.6 + contrast * 0.4;
    const roll = Math.random();
    let delta = 0;

    if (roll > 0.86 || (energy > 0.55 && roll > 0.72)) {
        delta = 1;
    } else if (roll < 0.16) {
        delta = -1;
    }

    return Math.max(1, Math.min(5, baseRarity + delta));
}

/**
 * Appraise an image completely offline without Gemini API.
 * @param {string} dataUrl - Image data URL
 * @param {number} rerollOffset - Increment when re-rolling the same photo
 * @returns {Promise<{name: string, rarity: number, description: string, element: string}>}
 */
export async function appraiseImageLocally(dataUrl, rerollOffset = 0) {
    const analysis = await analyzeImageColors(dataUrl);
    const pool = ITEM_CATALOG[analysis.element] || ITEM_CATALOG.earth;

    let index;
    if (rerollOffset === 0) {
        index = analysis.imageHash % pool.length;
    } else {
        index = (analysis.imageHash + rerollOffset * 3 + Math.floor(Math.random() * (pool.length - 1)) + 1) % pool.length;
    }

    const picked = pool[index];
    const rarity = computeRarity(picked.baseRarity, analysis.avgSaturation, analysis.contrast);

    let name = picked.name;
    if (rarity === 5 && !RARE_PREFIXES.some((p) => name.startsWith(p))) {
        const prefix = RARE_PREFIXES[(analysis.imageHash + rerollOffset) % RARE_PREFIXES.length];
        if ((prefix + name).length <= 18) {
            name = prefix + name;
        }
    }

    return {
        name,
        rarity,
        description: picked.description,
        element: analysis.element
    };
}
