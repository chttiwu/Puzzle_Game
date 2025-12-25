const N = 3;
const puzzleBoard = document.getElementById('puzzle-board');
const startBtn = document.getElementById('start-button');
const timeDisplay = document.getElementById('time-display');
const scoreList = document.getElementById('score-list');
const nameModal = document.getElementById('name-modal');

let tiles = [];
let tileOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let isPlaying = false;
let startTime, timerInterval;

// 初始化顯示排行榜
displayLeaderboard();

startBtn.addEventListener('click', startGame);

function startGame() {
    if (isPlaying) return;
    isPlaying = true;
    document.getElementById('message-area').textContent = "";
    puzzleBoard.style.display = 'grid';
    
    shuffleArray();
    renderBoard();
    
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function shuffleArray() {
    // 簡單打亂，並確保右下角(9)是空白
    do {
        for (let i = 0; i < 8; i++) {
            const j = Math.floor(Math.random() * 8);
            [tileOrder[i], tileOrder[j]] = [tileOrder[j], tileOrder[i]];
        }
    } while (!isSolvable());
}

function isSolvable() {
    let inv = 0;
    for (let i = 0; i < 8; i++) 
        for (let j = i + 1; j < 8; j++)
            if (tileOrder[i] > tileOrder[j]) inv++;
    return inv % 2 === 0;
}

function renderBoard() {
    puzzleBoard.innerHTML = '';
    tileOrder.forEach((num, idx) => {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        if (num === 9) {
            tile.classList.add('hidden-tile');
        } else {
            const row = Math.floor((num - 1) / 3);
            const col = (num - 1) % 3;
            tile.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;
            tile.addEventListener('click', () => moveTile(idx));
        }
        puzzleBoard.appendChild(tile);
    });
}

function moveTile(idx) {
    const emptyIdx = tileOrder.indexOf(9);
    const diff = Math.abs(idx - emptyIdx);
    const isAdjacent = (diff === 1 && Math.floor(idx/3) === Math.floor(emptyIdx/3)) || diff === 3;

    if (isAdjacent) {
        [tileOrder[idx], tileOrder[emptyIdx]] = [tileOrder[emptyIdx], tileOrder[idx]];
        renderBoard();
        checkWin();
    }
}

function checkWin() {
    if (tileOrder.every((val, i) => val === i + 1)) {
        isPlaying = false;
        clearInterval(timerInterval);
        document.querySelector('.hidden-tile').classList.remove('hidden-tile');
        nameModal.style.display = 'block';
    }
}

function updateTimer() {
    const sec = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    timeDisplay.textContent = `${m}:${s}`;
}

// 排行榜邏輯
document.getElementById('submit-score').onclick = () => {
    const name = document.getElementById('player-name').value || "無名英雄";
    const time = timeDisplay.textContent;
    const scores = JSON.parse(localStorage.getItem('puzzleScores') || '[]');
    scores.push({ name, time, raw: Math.floor((Date.now()-startTime)/1000) });
    scores.sort((a, b) => a.raw - b.raw);
    localStorage.setItem('puzzleScores', JSON.stringify(scores.slice(0, 10)));
    nameModal.style.display = 'none';
    displayLeaderboard();
};

function displayLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('puzzleScores') || '[]');
    scoreList.innerHTML = scores.map(s => `<li>${s.time} - ${s.name}</li>`).join('');
}

document.getElementById('clear-scores').onclick = () => {
    localStorage.removeItem('puzzleScores');
    displayLeaderboard();
};
