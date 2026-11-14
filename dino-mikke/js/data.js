/* ==========================================================
   data.js - きょうりゅう・アイテム・テーマ（絵本）の定義（全32種恐竜・全6章）
   ========================================================== */
(function () {
    'use strict';
    const DM = (window.DM = window.DM || {});

    /**
     * きょうりゅう図鑑データ（全32種類）
     * habitat: main=テーマの主エリア(陸 or 海中) / sky=空 / air=飛ぶ
     */
    const DINOS = {
        // ===== 第1章：みどりの だいジャングル =====
        trex: {
            name: 'ティラノサウルス', emoji: '🦖', theme: 'theme_jungle', habitat: 'main',
            colors: { m: '#7cb655', b: '#f1e6a6', a: '#4f8a33' },
            era: 'はくあき の おわり（やく6600まんねんまえ）', size: 'やく 12m', food: 'にく',
            look: 'みどりいろで、おおきな あたまと ちいさな てが めじるし',
            fact: 'かむ ちからが とっても つよい！ でも てはちいさくて ゆびは 2ほんだけ。',
        },
        tricera: {
            name: 'トリケラトプス', emoji: '🦕', theme: 'theme_jungle', habitat: 'main',
            colors: { m: '#e0a060', b: '#f6e2bc', a: '#c0663c' },
            era: 'はくあき の おわり', size: 'やく 9m', food: 'くさ',
            look: 'オレンジいろで、3ぼんの ツノと おおきな えりかざり',
            fact: 'あたまの 3ぼんの ツノと おおきな えりかざりで みを まもったよ。',
        },
        brachio: {
            name: 'ブラキオサウルス', emoji: '🦕', theme: 'theme_jungle', habitat: 'main',
            colors: { m: '#8fb7cc', b: '#e2f0f2', a: '#6a94ab' },
            era: 'ジュラき（やく1おく5000まんねんまえ）', size: 'やく 25m', food: 'くさ',
            look: 'みずいろで、くびが とっても ながい',
            fact: 'くびが ながくて、たかい きの はっぱも むしゃむしゃ たべられたよ。',
        },
        stego: {
            name: 'ステゴサウルス', emoji: '🦕', theme: 'theme_jungle', habitat: 'main',
            colors: { m: '#a9bc5c', b: '#f0e8b4', a: '#ee8a55' },
            era: 'ジュラき', size: 'やく 9m', food: 'くさ',
            look: 'せなかに オレンジの いたが ならんでいる',
            fact: 'せなかの いたは からだを あたためたり ひやしたり したと いわれているよ。',
        },
        parasau: {
            name: 'パラサウロロフス', emoji: '🦕', theme: 'theme_jungle', habitat: 'main',
            colors: { m: '#d4b26f', b: '#f7edd6', a: '#d9643b' },
            era: 'はくあき の おわり', size: 'やく 10m', food: 'くさ',
            look: 'あたまの うしろに ながーい トサカが のびている',
            fact: 'あたまの ながい トサカの なかは くだになっていて、ラッパのような おとを だしたよ。',
        },
        apato: {
            name: 'アパトサウルス', emoji: '🦕', theme: 'theme_jungle', habitat: 'main',
            colors: { m: '#78a892', b: '#e4f2eb', a: '#4f7d69' },
            era: 'ジュラき', size: 'やく 23m', food: 'くさ',
            look: 'エメラルドグリーンで、ムチのように ながい しっぽ',
            fact: 'とっても おもい きょうりゅう。しっぽを ムチのように バチン！と ならして てきをおいはらったよ。',
        },

        // ===== 第2章：かざんと あかい大地 =====
        spino: {
            name: 'スピノサウルス', emoji: '🦖', theme: 'theme_volcano', habitat: 'main',
            colors: { m: '#5f9fa8', b: '#e6eccb', a: '#ef7d57' },
            era: 'はくあき の なかごろ', size: 'やく 15m', food: 'さかな',
            look: 'せなかに おおきな ほ（セイル）が ある',
            fact: 'せなかに おおきな ほを もつ。みずべで さかなを とって たべていたよ。',
        },
        ankylo: {
            name: 'アンキロサウルス', emoji: '🦕', theme: 'theme_volcano', habitat: 'main',
            colors: { m: '#c49a68', b: '#ecdab6', a: '#8a6440' },
            era: 'はくあき の おわり', size: 'やく 7m', food: 'くさ',
            look: 'かたい よろいの せなかと、ハンマーみたいな しっぽ',
            fact: 'からだが かたい よろいで おおわれ、しっぽの さきは ハンマーみたい！',
        },
        allo: {
            name: 'アロサウルス', emoji: '🦖', theme: 'theme_volcano', habitat: 'main',
            colors: { m: '#e8a94c', b: '#f8e6b6', a: '#b5542e' },
            era: 'ジュラき', size: 'やく 9m', food: 'にく',
            look: 'きいろくて しまもよう、めの うえに あかい トサカ',
            fact: 'ジュラきの つよい にくしょく きょうりゅう。めの うえに ちいさな トサカが あるよ。',
        },
        pachy: {
            name: 'パキケファロサウルス', emoji: '🦕', theme: 'theme_volcano', habitat: 'main',
            colors: { m: '#9a84c4', b: '#eee4f4', a: '#f0c46c' },
            era: 'はくあき の おわり', size: 'やく 4.5m', food: 'くさ',
            look: 'むらさきいろで、あたまが まるい ドーム',
            fact: 'あたまの ほねが とっても あつい！ ドームみたいな いしあたま。',
        },
        carno: {
            name: 'カルノタウルス', emoji: '🦖', theme: 'theme_volcano', habitat: 'main',
            colors: { m: '#d95a53', b: '#fce4e1', a: '#3d2522' },
            era: 'はくあき の おわり', size: 'やく 8m', food: 'にく',
            look: 'あかい からだで、めの うえに ウシのような 2ほんの ツノ',
            fact: 'なまえの いみは「にくしょくの ウシ」。あしが とても はやい ハンターだったよ。',
        },
        deino: {
            name: 'ディノニクス', emoji: '🦖', theme: 'theme_volcano', habitat: 'main',
            colors: { m: '#bf7e4e', b: '#f3e5d8', a: '#6b3c20' },
            era: 'はくあき の はじめ', size: 'やく 3.4m', food: 'にく',
            look: 'あしの ゆびに おおきな カギヅメが ついている',
            fact: '「おそろしい ツメ」という なまえ。うしろあしの するどい ツメで えものを つかまえたよ。',
        },

        // ===== 第3章：うみと みずべの なかまたち =====
        mosa: {
            name: 'モササウルス', emoji: '🐊', theme: 'theme_ocean', habitat: 'main',
            colors: { m: '#5b86b8', b: '#dde9f2', a: '#3f6896' },
            era: 'はくあき の おわり', size: 'やく 15m', food: 'さかな・アンモナイト',
            look: 'あおくて ながい からだ、おおきな くちと ヒレ',
            fact: 'うみの おおきな はちゅうるい。きょうりゅうの じだいの うみの おうさまだよ。',
        },
        plesio: {
            name: 'プレシオサウルス', emoji: '🦕', theme: 'theme_ocean', habitat: 'main',
            colors: { m: '#6fbfa6', b: '#e2f3ea', a: '#4d9a84' },
            era: 'ジュラき', size: 'やく 3.5m', food: 'さかな',
            look: 'ながい くびと、4まいの ヒレ',
            fact: '4まいの ヒレで うみの なかを スイスイ およいだ くびながりゅう。',
        },
        ptera: {
            name: 'プテラノドン', emoji: '🦅', theme: 'theme_ocean', habitat: 'sky',
            colors: { m: '#d4895a', b: '#f5e0c4', a: '#f0b27e' },
            era: 'はくあき の おわり', size: 'つばさを ひろげて やく 7m', food: 'さかな',
            look: 'そらを とんでいて、あたまの うしろに ながい トサカ',
            fact: 'そらを とぶ はちゅうるい（よくりゅう）。くちばしには はが ないんだよ。',
        },
        ichthy: {
            name: 'イクチオサウルス', emoji: '🐬', theme: 'theme_ocean', habitat: 'main',
            colors: { m: '#8a9fd6', b: '#e6ebfa', a: '#6478b8' },
            era: 'ジュラき', size: 'やく 2m', food: 'さかな・イカ',
            look: 'イルカみたいな かたちで、めが おおきい',
            fact: 'イルカに そっくりな うみの はちゅうるい。くらい うみでも みえる おおきな めをもつよ。',
        },
        elasmo: {
            name: 'エラスモサウルス', emoji: '🦕', theme: 'theme_ocean', habitat: 'main',
            colors: { m: '#529ab8', b: '#dcf0f8', a: '#316982' },
            era: 'はくあき の おわり', size: 'やく 14m', food: 'さかな',
            look: 'からだの はんぶんいじょうが ながーい くび！',
            fact: 'くびの ほねが 70こも ある！ とっても ながいくびを クネクネうごかして さかなを パクリ。',
        },

        // ===== 第4章：ほしぞらと まよなかの もり =====
        ovi: {
            name: 'オヴィラプトル', emoji: '🦤', theme: 'theme_night', habitat: 'main',
            colors: { m: '#ee8e78', b: '#fde4d6', a: '#5a8fd0' },
            era: 'はくあき の おわり', size: 'やく 2m', food: 'なんでも',
            look: 'ピンクいろで、きいろい トサカと くちばし',
            fact: 'たまごを だいじに あたためて まもる、やさしい おやどりだったよ。',
        },
        raptor: {
            name: 'ヴェロキラプトル', emoji: '🦖', theme: 'theme_night', habitat: 'main',
            colors: { m: '#c9a46e', b: '#f2e6c8', a: '#7a5ba8' },
            era: 'はくあき の おわり', size: 'やく 2m', food: 'にく',
            look: 'ほそくて すばやそう、むらさきの はね',
            fact: 'うもうが はえていて、あしの カギヅメが じまん。すばしっこく はしったよ。',
        },
        maia: {
            name: 'マイアサウラ', emoji: '🦕', theme: 'theme_night', habitat: 'main',
            colors: { m: '#9cc47a', b: '#f2ecc8', a: '#6d9a54' },
            era: 'はくあき の おわり', size: 'やく 9m', food: 'くさ',
            look: 'カモみたいな くちばしの やさしい おかあさん',
            fact: 'なまえの いみは「よい おかあさん トカゲ」。すで あかちゃんを だいじに そだてたよ。',
        },
        troodon: {
            name: 'トロオドン', emoji: '🦖', theme: 'theme_night', habitat: 'main',
            colors: { m: '#e8bf5a', b: '#fdf2cf', a: '#c47a3a' },
            era: 'はくあき の おわり', size: 'やく 2m', food: 'なんでも',
            look: 'きいろくて、まんまるの おおきな め',
            fact: 'のうみそが おおきくて あたまが いい！ おおきな めで よるでも よく みえたよ。',
        },
        therizino: {
            name: 'テリジノサウルス', emoji: '🦖', theme: 'theme_night', habitat: 'main',
            colors: { m: '#7fa356', b: '#e9f2d5', a: '#a3503c' },
            era: 'はくあき の おわり', size: 'やく 10m', food: 'くさ',
            look: 'りょうてに 70cmもある きょだいな 3ぼんの カマヅメ！',
            fact: 'きょうりゅうの なかで いちばん ながい ツメを もつ！ えだを ひきよせて はっぱを たべたよ。',
        },

        // ===== 第5章：こおりの たに と ゆきのやま =====
        mammoth: {
            name: 'マンモス', emoji: '🦣', theme: 'theme_ice', habitat: 'main',
            colors: { m: '#8c6042', b: '#dfcfb9', a: '#4a2f1c' },
            era: 'ひょうがき（やく400まん〜1まんねんまえ）', size: 'やく 4m', food: 'くさ',
            look: 'ながく まがった キバと、モコモコの ながい け',
            fact: 'さむい こおりの せかいで くらしたよ。ながい キバで ゆきを かきわけて くさを たべたんだ。',
        },
        sabertooth: {
            name: 'スミロドン', emoji: '🐯', theme: 'theme_ice', habitat: 'main',
            colors: { m: '#e5ab59', b: '#fdf5e6', a: '#8c5929' },
            era: 'ひょうがき', size: 'やく 2m', food: 'にく',
            look: 'うえの あごから はえた 2ほんの ながーい サーベルキバ',
            fact: '「サーベルタイガー」とも よばれるよ。20cmも ある ながい キバで えものを つかまえた！',
        },
        woolly_rhino: {
            name: 'ケブカサイ', emoji: '🦏', theme: 'theme_ice', habitat: 'main',
            colors: { m: '#998170', b: '#eae1d8', a: '#5c4839' },
            era: 'ひょうがき', size: 'やく 3.7m', food: 'くさ',
            look: 'はなの うえに そびえたつ おおきな ツノと あたたかい け',
            fact: 'あたたかい け皮で まもられた サイの なかま。あたまの まえの ツノは 1mいじょうも あったよ。',
        },
        yutyrannus: {
            name: 'ユウティラヌス', emoji: '🦖', theme: 'theme_ice', habitat: 'main',
            colors: { m: '#a6c0d6', b: '#f0f5fa', a: '#587a99' },
            era: 'はくあき の はじめ', size: 'やく 9m', food: 'にく',
            look: 'しろと みずいろの うもうを まとった ゆきぐにの ティラノ',
            fact: 'からだじゅうに フサフサの うもうが はえていた、さむい ちいきの おおきな にくしょく きょうりゅう！',
        },
        cryolo: {
            name: 'クリオロフォサウルス', emoji: '🦖', theme: 'theme_ice', habitat: 'main',
            colors: { m: '#6b9dbf', b: '#e2eff7', a: '#e86252' },
            era: 'ジュラき の はじめ', size: 'やく 6.5m', food: 'にく',
            look: 'あたまの うえに おうぎのような あかい カンムリの トサカ',
            fact: 'なんきょくで はっけんされた きょうりゅう！ あたまの トサカが おうぎみたいで カッコイイ！',
        },

        // ===== 第6章：おうごんの だいきょうこく と すなばく =====
        giganoto: {
            name: 'ギガノトサウルス', emoji: '🦖', theme: 'theme_canyon', habitat: 'main',
            colors: { m: '#cc8447', b: '#faeedb', a: '#803c1b' },
            era: 'はくあき の なかごろ', size: 'やく 13m', food: 'にく',
            look: 'ちゃいろの からだで、ティラノサウルスより おおきい かも！',
            fact: 'みなみアメリカで はっけんされた ちょうきょだいな にくしょく きょうりゅう。するどい はで えものを かったよ。',
        },
        dreadnought: {
            name: 'ドレッドノータス', emoji: '🦕', theme: 'theme_canyon', habitat: 'main',
            colors: { m: '#8c7d6b', b: '#eae4dc', a: '#b39247' },
            era: 'はくあき の おわり', size: 'やく 26m', food: 'くさ',
            look: 'やまのように おおきくて、ごっつい からだ',
            fact: '「なにも おそれない」という なまえ。たいじゅうが 65トンも ある、ちじょう さいだい級の きょうりゅう！',
        },
        proto: {
            name: 'プロトケラトプス', emoji: '🦕', theme: 'theme_canyon', habitat: 'main',
            colors: { m: '#d9a05b', b: '#fbf0dc', a: '#995c24' },
            era: 'はくあき の おわり', size: 'やく 1.8m', food: 'くさ',
            look: 'ちいさくて まるい えりかざりと、オウムのような くちばし',
            fact: 'すなばくで たくさんの かせきが みつかったよ。たまごの すを つくって こどもを そだてたんだ。',
        },
        dimetro: {
            name: 'ディメトロドン', emoji: '🐊', theme: 'theme_canyon', habitat: 'main',
            colors: { m: '#ba6e43', b: '#f8e7d8', a: '#f0ad46' },
            era: 'ペルムき（やく2おく8000まんねんまえ）', size: 'やく 3.5m', food: 'にく',
            look: 'せなかに おおきな きいろと オレンジの ほが ある',
            fact: 'きょうりゅうより まえの じだいの はちゅうるい。せなかの ほで たいおんを ちょうせつしたよ。',
        },
        galli: {
            name: 'ガリミムス', emoji: '🦤', theme: 'theme_canyon', habitat: 'main',
            colors: { m: '#deb64e', b: '#fcf6db', a: '#4898a8' },
            era: 'はくあき の おわり', size: 'やく 6m', food: 'なんでも',
            look: 'ダチョウに そっくりで、ながい あしと くび',
            fact: 'じそく 60kmいじょうで はしることが できたよ！ あしが とっても はやい スピードランナー。',
        },
    };

    /** 探しものアイテム */
    const ITEMS = {
        fern: { name: 'こだいシダ', emoji: '🌿', habitat: 'main', look: 'くるくる まいた みどりの め' },
        egg: { name: 'きょうりゅうの たまご', emoji: '🥚', habitat: 'main', look: 'すの なかの もようつき たまご' },
        dragonfly: { name: 'おおきな トンボ', emoji: '🪰', habitat: 'air', look: 'すきとおった 4まいの はね' },
        bone: { name: 'ほねの かせき', emoji: '🦴', habitat: 'main', look: 'つちから でている しろい ほね' },
        ammonite: { name: 'アンモナイト', emoji: '🐚', habitat: 'main', look: 'ぐるぐる うずまきの かいがら' },
        amber: { name: 'こはく', emoji: '🔶', habitat: 'main', look: 'オレンジいろに ひかる いし' },
        fish: { name: 'シーラカンス', emoji: '🐟', habitat: 'main', look: 'あおくて しろい てんてんの おさかな' },
        shell: { name: 'まきがい', emoji: '🐚', habitat: 'main', look: 'とんがった ピンクの かいがら' },
        mushroom: { name: 'ひかる キノコ', emoji: '🍄', habitat: 'main', look: 'みずいろに ひかる キノコ' },
        firefly: { name: 'ホタル', emoji: '✨', habitat: 'air', look: 'おしりが きいろく ひかる むし' },
        // 新アイテム
        ice_crystal: { name: 'こおりの けっしょう', emoji: '❄️', habitat: 'air', look: 'きらきら ひかる みずいろの ほしがた' },
        frozen_leaf: { name: 'こおった はっぱ', emoji: '🍃', habitat: 'main', look: 'ツララが ついた あおじろい はっぱ' },
        cactus_flower: { name: 'サボテンの はな', emoji: '🌺', habitat: 'main', look: 'トゲトゲの うえに さく あかい はな' },
        golden_fossil: { name: 'きんの かせき', emoji: '⭐', habitat: 'main', look: 'すなの なかで きんいろに ひかる かせき' },
    };

    /** 全6章のテーマ構成 */
    const THEMES = [
        {
            id: 'theme_jungle', title: 'みどりの だいジャングル', short: 'ジャングル',
            concept: 'きょだいな シダ、たいぼく、ツタ、かわ',
            color: '#6fae4a', light: '#e4f3cf', icon: '🌴',
            dinos: ['trex', 'tricera', 'brachio', 'stego', 'parasau', 'apato'],
            items: ['fern', 'egg', 'dragonfly'],
        },
        {
            id: 'theme_volcano', title: 'かざんと あかい大地', short: 'かざん',
            concept: 'ようがん、ゴツゴツいわやま、どうくつ、かせき',
            color: '#d9663c', light: '#fbe0cc', icon: '🌋',
            dinos: ['spino', 'ankylo', 'allo', 'pachy', 'carno', 'deino'],
            items: ['bone', 'ammonite', 'amber'],
        },
        {
            id: 'theme_ocean', title: 'うみと みずべの なかまたち', short: 'うみ',
            concept: 'サンゴしょう、こだいぎょ、みずくさ、すなはま',
            color: '#3f8fc8', light: '#d7eefa', icon: '🌊',
            dinos: ['mosa', 'plesio', 'ptera', 'ichthy', 'elasmo'],
            items: ['fish', 'ammonite', 'shell'],
        },
        {
            id: 'theme_night', title: 'ほしぞらと まよなかの もり', short: 'よるの もり',
            concept: 'つきあかり、ひかるキノコ、ホタル、よぞら',
            color: '#4b5aa6', light: '#dfe3f6', icon: '🌙',
            dinos: ['ovi', 'raptor', 'maia', 'troodon', 'therizino'],
            items: ['mushroom', 'firefly', 'egg'],
        },
        {
            id: 'theme_ice', title: 'こおりの たにと ゆきのやま', short: 'こおりの たに',
            concept: 'ひょうざん、ツララ、こおったみずうみ、オーロラ',
            color: '#4fa3df', light: '#ddf0fc', icon: '❄️',
            dinos: ['mammoth', 'sabertooth', 'woolly_rhino', 'yutyrannus', 'cryolo'],
            items: ['ice_crystal', 'frozen_leaf', 'bone'],
        },
        {
            id: 'theme_canyon', title: 'だいきょうこくと おうごんのすなばく', short: 'だいきょうこく',
            concept: 'あかいがけ、キャニオン、サボテン、すなあらし',
            color: '#cc7d3b', light: '#faeedb', icon: '🏜️',
            dinos: ['giganoto', 'dreadnought', 'proto', 'dimetro', 'galli'],
            items: ['cactus_flower', 'golden_fossil', 'amber'],
        },
    ];

    const DIFFICULTIES = {
        easy: { id: 'easy', label: 'かんたん', stars: 1, desc: 'みつける かず 4', color: '#7cc46a' },
        normal: { id: 'normal', label: 'ふつう', stars: 2, desc: 'みつける かず 6', color: '#f2a93b' },
        hard: { id: 'hard', label: 'むずかしい', stars: 3, desc: 'みつける かず 8', color: '#e0645a' },
        very_hard: { id: 'very_hard', label: 'とてもむずかしい', stars: 4, desc: 'みつける かず 12 / 極限密度！', color: '#9b30d9' },
    };

    const PAGES_PER_BOOK = 5;

    DM.data = {
        DINOS,
        ITEMS,
        THEMES,
        DIFFICULTIES,
        PAGES_PER_BOOK,
        dinoOrder: THEMES.flatMap((t) => t.dinos),
        theme: (id) => THEMES.find((t) => t.id === id) || THEMES[0],
        kindInfo: (k) => DINOS[k] || ITEMS[k],
        isDino: (k) => !!DINOS[k],
    };
})();
