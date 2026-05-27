// Elder Futhark の基本24ルーン。
// symbol: 画面に表示する文字
// name: 学習用に表示する一般的な名前
const RUNES = [
  { symbol: "ᚠ", name: "Fehu" },
  { symbol: "ᚢ", name: "Uruz" },
  { symbol: "ᚦ", name: "Thurisaz" },
  { symbol: "ᚨ", name: "Ansuz" },
  { symbol: "ᚱ", name: "Raidho" },
  { symbol: "ᚲ", name: "Kenaz" },
  { symbol: "ᚷ", name: "Gebo" },
  { symbol: "ᚹ", name: "Wunjo" },
  { symbol: "ᚺ", name: "Hagalaz" },
  { symbol: "ᚾ", name: "Nauthiz" },
  { symbol: "ᛁ", name: "Isa" },
  { symbol: "ᛃ", name: "Jera" },
  { symbol: "ᛇ", name: "Eihwaz" },
  { symbol: "ᛈ", name: "Perthro" },
  { symbol: "ᛉ", name: "Algiz" },
  { symbol: "ᛊ", name: "Sowilo" },
  { symbol: "ᛏ", name: "Tiwaz" },
  { symbol: "ᛒ", name: "Berkano" },
  { symbol: "ᛖ", name: "Ehwaz" },
  { symbol: "ᛗ", name: "Mannaz" },
  { symbol: "ᛚ", name: "Laguz" },
  { symbol: "ᛜ", name: "Ingwaz" },
  { symbol: "ᛞ", name: "Dagaz" },
  { symbol: "ᛟ", name: "Othala" }
];

// HTML要素を先に取得しておくと、後の処理が読みやすくなります。
const timerElement = document.getElementById("timer");
const progressElement = document.getElementById("progress");
const targetRuneElement = document.getElementById("targetRune");
const targetNameElement = document.getElementById("targetName");
const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const messageElement = document.getElementById("message");
const runeGrid = document.getElementById("runeGrid");

// ゲームの状態をまとめて管理します。
let questionOrder = [];
let currentIndex = 0;
let startTime = 0;
let timerId = null;
let isPlaying = false;

// 配列をランダムに並べ替える関数です。
// 元の配列を直接変えないように、コピーしてからシャッフルします。
function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

// ミリ秒を 00:00.00 の形に変換します。
function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const centiseconds = String(Math.floor((milliseconds % 1000) / 10)).padStart(2, "0");

  return `${minutes}:${seconds}.${centiseconds}`;
}

// タイマー表示を更新します。
function updateTimer() {
  const elapsed = Date.now() - startTime;
  timerElement.textContent = formatTime(elapsed);
}

// メッセージの色を状態に合わせて変えるための補助関数です。
function setMessage(text, type = "") {
  messageElement.textContent = text;
  messageElement.className = `message ${type}`.trim();
}

// 下部のルーン一覧を作ります。
function renderRuneButtons() {
  runeGrid.innerHTML = "";

  const runeButtons = shuffleArray(RUNES);

  runeButtons.forEach((rune) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rune-button";
    button.textContent = rune.symbol;
    button.setAttribute("aria-label", `${rune.name} ${rune.symbol}`);
    button.dataset.rune = rune.symbol;

    // クリックされたら、現在の正解と照合します。
    button.addEventListener("click", () => handleRuneClick(button, rune));

    runeGrid.appendChild(button);
  });
}

// ルーン一覧のボタンを一時的に無効化・有効化します。
// 正解直後の短い演出中に連打されるのを防ぐ目的です。
function setRuneButtonsDisabled(disabled) {
  const buttons = runeGrid.querySelectorAll(".rune-button");
  buttons.forEach((button) => {
    button.disabled = disabled;
  });
}

// 現在の問題を画面に表示します。
function showCurrentQuestion() {
  const currentRune = questionOrder[currentIndex];

  targetRuneElement.textContent = currentRune.symbol;
  targetNameElement.textContent = currentRune.name;
  progressElement.textContent = `${currentIndex + 1} / ${questionOrder.length}`;
}

// ゲーム開始時に状態を初期化します。
function startGame() {
  questionOrder = shuffleArray(RUNES);
  currentIndex = 0;
  startTime = Date.now();
  isPlaying = true;

  startButton.hidden = true;
  retryButton.hidden = false;
  timerElement.textContent = "00:00.00";
  setMessage("同じルーンを見つけてクリックしてください。");

  renderRuneButtons();
  showCurrentQuestion();

  clearInterval(timerId);
  timerId = setInterval(updateTimer, 30);
}

// ルーンがクリックされた時の判定です。
function handleRuneClick(button, selectedRune) {
  if (!isPlaying) {
    setMessage("まずはスタートを押してください。");
    return;
  }

  const correctRune = questionOrder[currentIndex];
  const isCorrect = selectedRune.symbol === correctRune.symbol;

  if (!isCorrect) {
    button.classList.add("wrong");
    setMessage("違うルーンです。もう一度探してみましょう。", "miss");

    // 少し待ってから色を戻します。
    setTimeout(() => {
      button.classList.remove("wrong");
    }, 260);

    return;
  }

  button.classList.add("correct");
  setMessage("正解です。次のルーンへ進みます。", "success");
  setRuneButtonsDisabled(true);

  // 正解の光り方を少し見せてから次の問題へ進みます。
  setTimeout(() => {
    currentIndex += 1;

    if (currentIndex >= questionOrder.length) {
      finishGame();
      return;
    }

    renderRuneButtons();
    showCurrentQuestion();
    setRuneButtonsDisabled(false);
    setMessage("次のルーンを探してください。");
  }, 300);
}

// 全問クリアした時の処理です。
function finishGame() {
  const clearTime = Date.now() - startTime;

  isPlaying = false;
  clearInterval(timerId);
  timerElement.textContent = formatTime(clearTime);
  progressElement.textContent = `${questionOrder.length} / ${questionOrder.length}`;
  setMessage(`全問クリア！ 記録は ${formatTime(clearTime)} です。`, "success");
  setRuneButtonsDisabled(true);
}

// ページを開いた直後にも一覧を出しておきます。
// 遊び方を直感的に見せるためで、判定はスタート後だけ有効です。
renderRuneButtons();
progressElement.textContent = `0 / ${RUNES.length}`;

startButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);