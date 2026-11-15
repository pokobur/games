// gameManager.js - ミニゲームのスペックとクラスの登録

import { RaceGame } from './games/race.js';
import { RouletteGame } from './games/roulette.js';
import { TreasureGame } from './games/treasure.js';
import { BalloonGame } from './games/balloon.js';
import { AmidakujiGame } from './games/amidakuji.js';
import { BarrelGame } from './games/barrel.js';

export const gameSpecs = {
    race: {
        title: '<ruby>アニマルレース<rt>あにまるれーす</rt></ruby>',
        icon: '🏎️',
        rules: '参加メンバーが可愛い動物になってカーレースを走るよ！<br>だれが一番早くゴールできるかな？<br>「スタート」を押して、順位を見守ろう！',
        GameClass: RaceGame
    },
    roulette: {
        title: '<ruby>わくわくルーレット<rt>わくわくるーれっと</rt></ruby>',
        icon: '🎯',
        rules: 'みんなの名前が書かれたルーレットを回すよ！<br>矢印が止まった人が、次の順位になるよ。<br>全員の順番が決まるまで、何度も回してみよう！',
        GameClass: RouletteGame
    },
    treasure: {
        title: '<ruby>たからばこ選び<rt>たからばこえらび</rt></ruby>',
        icon: '📦',
        rules: '人数分の宝箱がならんでいるよ！<br>ひとりずつ、すきな宝箱をタップして開けよう。<br>中に入っている数字（順位）がキミの順番になるよ！',
        GameClass: TreasureGame
    },
    balloon: {
        title: '<ruby>風船ポップ<rt>ふうせんぽっぷ</rt></ruby>',
        icon: '🎈',
        rules: 'みんなで順番に風船をタップして膨らませよう！<br>風船を爆発させてしまった人が、次の順位になるよ。<br>ドキドキハラハラのスリルゲーム！',
        GameClass: BalloonGame
    },
    amidakuji: {
        title: '<ruby>デジタルあみだ<rt>でじたるあみだ</rt></ruby>',
        icon: '🪜',
        rules: '好きな場所にドラッグで横線を引くことができるよ！<br>準備ができたら「スタート」を押そう。<br>キャラクターが線をたどってゴールまで走るよ！',
        GameClass: AmidakujiGame
    },
    barrel: {
        title: '<ruby>タルききいっぱつ！<rt>たるききいっぱつ！</rt></ruby>',
        icon: '🛢️',
        rules: 'ハズレの穴に剣を刺すとどうぶつが飛び出すよ！<br>交代でタルの穴をタップしてね。<br>どうぶつを飛ばしてしまった人が、次の順位になるよ！',
        GameClass: BarrelGame
    }
};
