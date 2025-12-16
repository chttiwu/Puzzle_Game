const N = 3; // 拼圖維度 N x N = 9
const TOTAL_TILES = N * N;
const TILE_SIZE = 100; // 每個拼圖塊的寬高 (需與 CSS 一致)

const puzzleBoard = document.getElementById('puzzle-board');
const startButton = document.getElementById('start-button');
const timeDisplay = document.getElementById('time-display');
const originalImage = document.getElementById('original-image-container');
const messageArea = document.getElementById('message-area');

let tiles = []; // 儲存所有拼圖塊的 DOM 元素
let tileOrder = []; // 儲存拼圖塊的目前順序 (1到8, 9為空白)
let emptyIndex = TOTAL_TILES; // 空白塊的位置 (初始為第 9 塊)
let isPlaying = false;
let startTime;
let timerInterval;

// 初始化：建立所有拼圖塊
function createTiles() {
    tiles = [];
    tileOrder = [];
    puzzleBoard.innerHTML = ''; // 清空舊的拼圖板

    for (let i = 1; i < TOTAL_TILES; i++) {
        // 建立第 i 塊拼圖
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.index = i; // 儲存正確的順序 (1~8)
        tile.style.backgroundPosition = getBackgroundPosition(i); // 設置圖片位置 (已在 CSS 中設定，但這裡可以做為備用或動態設定)
        tile.addEventListener('click', () => moveTile(tile));
        
        tiles.push(tile);
        tileOrder.push(i);
    }

    // 加上隱藏的空白塊 (第 9 塊)
    const emptyTile = document.createElement('div');
    emptyTile.classList.add('tile', 'hidden-tile');
    emptyTile.dataset.index = TOTAL_TILES; // 空白塊的正確順序是 9
    tiles.push(emptyTile);
    tileOrder.push(TOTAL_TILES); // 9 代表空白
}

// Helper: 根據索引計算背景圖片位置 (與 CSS 邏輯相同)
function getBackgroundPosition(index) {
    const i = index - 1; // 0-based index
    const col = i % N;
    const row = Math.floor(i / N);
    return `-${col * TILE_SIZE}px -${row * TILE_SIZE}px`;
}
// 開始遊戲
startButton.addEventListener('click', startGame);

function startGame() {
    if (isPlaying) return; // 避免重複點擊

    messageArea.textContent = '';
    originalImage.style.display = 'none'; // 隱藏原始圖片
    puzzleBoard.style.display = 'grid'; // 顯示拼圖板

    createTiles(); // 重新建立拼圖塊
    shuffleTiles(); // 打亂拼圖

    isPlaying = true;
    startTimer();
}

// 打亂拼圖塊
function shuffleTiles() {
    // 這裡使用 Fisher-Yates (Knuth) shuffle 演算法打亂 tileOrder
    for (let i = tileOrder.length - 2; i > 0; i--) { // 不打亂最後一塊 (空白塊)
        const j = Math.floor(Math.random() * i) + 1; // 1 到 i
        [tileOrder[i], tileOrder[j]] = [tileOrder[j], tileOrder[i]];
    }

    // 檢查打亂後的排列是否可解 (九宮格通常是看倒置數的奇偶性，但簡化起見，可以只做幾次打亂)
    if (!isSolvable(tileOrder)) {
        // 如果不可解，交換其中兩塊 (除了空白塊) 確保可解
        [tileOrder[0], tileOrder[1]] = [tileOrder[1], tileOrder[0]];
    }
    
    renderBoard(); // 將打亂後的順序渲染到畫面上
    // 空白塊永遠是第 9 塊 (在 tileOrder 中是最後一個元素)
    emptyIndex = tileOrder.findIndex(val => val === TOTAL_TILES);
}

// 將 tileOrder 陣列中的順序呈現在畫面上
function renderBoard() {
    puzzleBoard.innerHTML = '';
    tileOrder.forEach(originalIndex => {
        // 找到對應 originalIndex 的 tile 元素
        const tileElement = tiles.find(t => parseInt(t.dataset.index) === originalIndex);
        if (tileElement) {
             puzzleBoard.appendChild(tileElement);
        }
    });
}

// 簡易的可解性檢查 (僅作示範，複雜的九宮格需更精確的檢查)
function isSolvable(arr) {
    // 總倒置數 (Inversions) 必須是偶數 (對於 3x3 且空白在右下角的情況)
    let inversions = 0;
    const puzzle = arr.slice(0, TOTAL_TILES - 1); // 排除空白塊 (9)

    for (let i = 0; i < puzzle.length; i++) {
        for (let j = i + 1; j < puzzle.length; j++) {
            if (puzzle[i] > puzzle[j]) {
                inversions++;
            }
        }
    }
    return (inversions % 2 === 0);
}
// 處理拼圖塊點擊移動
function moveTile(clickedTile) {
    if (!isPlaying) return;

    const clickedOriginalIndex = parseInt(clickedTile.dataset.index);
    const clickedCurrentIndex = tileOrder.findIndex(val => val === clickedOriginalIndex);

    // 檢查點擊的拼圖塊是否在空白塊的上下左右
    const isAdjacent = 
        (Math.abs(clickedCurrentIndex - emptyIndex) === 1 && Math.floor(clickedCurrentIndex / N) === Math.floor(emptyIndex / N)) || // 左右相鄰且在同一行
        (Math.abs(clickedCurrentIndex - emptyIndex) === N); // 上下相鄰

    if (isAdjacent) {
        // 交換位置
        [tileOrder[clickedCurrentIndex], tileOrder[emptyIndex]] = [tileOrder[emptyIndex], tileOrder[clickedCurrentIndex]];
        
        // 更新空白塊的位置
        emptyIndex = clickedCurrentIndex;
        
        renderBoard(); // 重新渲染畫面
        
        // 檢查是否完成
        if (checkWin()) {
            endGame(true);
        }
    }
}

// 檢查勝利條件
function checkWin() {
    // 勝利條件： tileOrder 陣列內容為 [1, 2, 3, 4, 5, 6, 7, 8, 9]
    for (let i = 0; i < TOTAL_TILES; i++) {
        if (tileOrder[i] !== i + 1) {
            return false;
        }
    }
    return true;
}

// 遊戲結束
function endGame(isWin) {
    isPlaying = false;
    clearInterval(timerInterval);

    if (isWin) {
        // 補上最後一塊 (空白塊 9)
        const finalTile = tiles.find(t => parseInt(t.dataset.index) === TOTAL_TILES);
        finalTile.classList.remove('hidden-tile');
        
        renderBoard(); // 顯示完整的圖片
        
        const finalTime = timeDisplay.textContent;
        messageArea.textContent = `🎉 恭喜！您成功了！用時：${finalTime}`;
        // 這裡可以加入排名/分數儲存邏輯 (例如使用 localStorage)

        setTimeout(() => {
            puzzleBoard.style.display = 'none';
            originalImage.style.display = 'block';
            startButton.textContent = '重新開始';
        }, 3000); // 3 秒後顯示原始圖片
    }
}
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000); // 每秒更新一次
    updateTimer(); // 立即更新一次
}

function updateTimer() {
    const elapsed = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    
    timeDisplay.textContent = `${minutes}:${seconds}`;
}

// 初始化時先建立一次拼圖塊，確保 tiles 陣列有內容
createTiles();
// 讓空白塊一開始是隱藏的
const emptyTileStart = tiles.find(t => parseInt(t.dataset.index) === TOTAL_TILES);
if(emptyTileStart) {
    emptyTileStart.classList.add('hidden-tile');
}
// 在 endGame(true) 函式中呼叫
function saveScore(timeInSeconds) {
    const records = JSON.parse(localStorage.getItem('puzzleRecords') || '[]');
    
    // 將當前成績加入
    records.push({ time: timeInSeconds, date: new Date().toLocaleString() });
    
    // 排序並只保留前 5 名
    records.sort((a, b) => a.time - b.time); 
    
    localStorage.setItem('puzzleRecords', JSON.stringify(records.slice(0, 5)));
    
    // 顯示排名
    displayLeaderboard(records.slice(0, 5));
}

function displayLeaderboard(records) {
    // ... 建立一個 HTML 元素來顯示 records 陣列中的時間和日期 ...
}
