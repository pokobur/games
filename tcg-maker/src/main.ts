import './style.css';
import { initNav } from './nav';
import { initHome } from './home';
import { initEditor } from './editor';
import { initCollection } from './collection';
import { initDeck } from './deck';
import { refreshCards, refreshDecks } from './store';
import { initModal, toast } from './utils';

async function main(): Promise<void> {
  initNav();
  initModal();
  initHome();
  initEditor();
  initCollection();
  initDeck();
  try {
    await Promise.all([refreshCards(), refreshDecks()]);
  } catch (err) {
    console.error(err);
    toast('データベースを開けませんでした（プライベートブラウズでは保存できない場合があります）', 'error');
  }
}

void main();
