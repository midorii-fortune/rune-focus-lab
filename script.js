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

// ===== 音量設定 =====
// ここを変えると、音の大きさをまとめて調整できます。
// 0.0 が無音、1.0 が最大音量です。
const AUDIO_SETTINGS = {
  masterVolume: 0.45,
  bgmVolume: 0.22,
  correctVolume: 0.7,
  clearVolume: 0.78,
  wrongVolume: 0.52
};

// HTML要素を先に取得しておくと、後の処理が読みやすくなります。
const timerElement = document.getElementById("timer");
const progressElement = document.getElementById("progress");
const targetRuneElement = document.getElementById("targetRune");
const targetNameElement = document.getElementById("targetName");
const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const messageElement = document.getElementById("message");
const runeGrid = document.getElementById("runeGrid");
const soundButton = document.getElementById("soundButton");
const volumeSlider = document.getElementById("volumeSlider");

// 音声要素もHTMLから取得します。
// 音声ファイルは audio フォルダ内の mp3 を読み込みます。
const bgmAudio = document.getElementById("bgmAudio");
const correctAudio = document.getElementById("correctAudio");
const clearAudio = document.getElementById("clearAudio");
const wrongAudio = document.getElementById("wrongAudio");

// ゲームの状態をまとめて管理します。
let questionOrder = [];
let currentIndex = 0;
let startTime = 0;
let timerId = null;
let isPlaying = false;
let isSoundEnabled = true;

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

// 実際に各音声要素へ音量を反映します。
// masterVolume と個別音量を掛け合わせることで、全体調整と細かい調整の両方ができます。
function applyAudioVolumes() {
  const master = isSoundEnabled ? AUDIO_SETTINGS.masterVolume : 0;

  bgmAudio.volume = master * AUDIO_SETTINGS.bgmVolume;
  correctAudio.volume = master * AUDIO_SETTINGS.correctVolume;
  clearAudio.volume = master * AUDIO_SETTINGS.clearVolume;
  wrongAudio.volume = master * AUDIO_SETTINGS.wrongVolume;
}

// 効果音を頭から再生します。
// currentTime を 0 に戻すことで、連続クリック時にも音が鳴りやすくなります。
function playSound(audioElement) {
  if (!isSoundEnabled) {
    return;
  }

  audioElement.currentTime = 0;
  audioElement.play().catch(() => {
    // ブラウザが音声再生を止めた場合でもゲーム進行は止めません。
    // ほとんどの場合、スタートボタンなどのユーザー操作後なら再生できます。
  });
}

// BGMを停止します。
// resetToBeginning を true にすると、次に再生するとき最初から流れます。
function stopBgm(resetToBeginning = false) {
  bgmAudio.pause();

  if (resetToBeginning) {
    bgmAudio.currentTime = 0;
  }
}

// BGMをゲーム開始時に流します。
// startGame はボタンクリックから呼ばれるため、スマホの自動再生制限に対応しやすいです。
function startBgmFromBeginning() {
  if (!isSoundEnabled) {
    return;
  }

  // リトライ時に前回のBGM位置から続かないよう、一度止めて先頭へ戻します。
  // これで「新しい挑戦が始まった」感じを作れます。
  stopBgm(true);

  bgmAudio.play().catch(() => {
    setMessage("音声の再生がブラウザにブロックされました。もう一度スタートを押してください。", "miss");
  });
}

// クリア時の音演出をまとめます。
// BGMを先に止めてからクリア音を鳴らすことで、クリア音が綺麗に聞こえやすくなります。
function playClearSoundWithFinishFeeling() {
  stopBgm(true);

  // BGM停止直後に少しだけ間を置くと、一区切り感が出ます。
  // クリア音の頭がBGMに重なりにくくなる効果もあります。
  setTimeout(() => {
    playSound(clearAudio);
  }, 120);
}

// 音ON/OFFボタンの表示を更新します。
function updateSoundButton() {
  soundButton.textContent = isSoundEnabled ? "音ON" : "音OFF";
  soundButton.setAttribute("aria-pressed", String(isSoundEnabled));
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
// スタートでもリトライでもこの関数を使うので、BGMは毎回最初から再生します。
function startGame() {
  questionOrder = shuffleArray(RUNES);
  currentIndex = 0;
  startTime = Date.now();
  isPlaying = true;

  startButton.hidden = true;
  retryButton.hidden = false;
  timerElement.textContent = "00:00.00";
  setMessage("同じルーンを見つけてクリックしてください。");

  applyAudioVolumes();
  startBgmFromBeginning();
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
    playSound(wrongAudio);
    button.classList.add("wrong");
    setMessage("違うルーンです。もう一度探してみましょう。", "miss");

    // 少し待ってから色を戻します。
    setTimeout(() => {
      button.classList.remove("wrong");
    }, 260);

    return;
  }

  playSound(correctAudio);
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
  playClearSoundWithFinishFeeling();
}

// 音ON/OFFを切り替えます。
soundButton.addEventListener("click", () => {
  isSoundEnabled = !isSoundEnabled;
  updateSoundButton();
  applyAudioVolumes();

  if (!isSoundEnabled) {
    // OFFにした瞬間、BGMも止めます。
    // ここでは再度ONにした時に同じ地点から戻れるよう、先頭には戻しません。
    stopBgm(false);
    return;
  }

  if (isPlaying) {
    bgmAudio.play().catch(() => {});
  }
});

// 音量スライダーを動かした時に、全体音量を調整します。
volumeSlider.addEventListener("input", () => {
  AUDIO_SETTINGS.masterVolume = Number(volumeSlider.value) / 100;
  applyAudioVolumes();
});

// ページを開いた直後にも一覧を出しておきます。
// 遊び方を直感的に見せるためで、判定はスタート後だけ有効です。
renderRuneButtons();
progressElement.textContent = `0 / ${RUNES.length}`;
volumeSlider.value = String(Math.round(AUDIO_SETTINGS.masterVolume * 100));
applyAudioVolumes();
updateSoundButton();

startButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);