// ===== 圖片相關變數 =====
let bgImg; // 用來存放背景圖片（background.webp）
let sheetImg; // 用來存放整張角色圖片精靈（2_all.png，共 8 格）

// 每一格在精靈圖中的 [起點x, 寬度]（這張圖每格寬度不同，所以要一格一格指定）
const FRAMES = [
  [6, 43], // 第 0 格：站立（雙手放下）
  [67, 41], // 第 1 格：蹲下（雙手抱頭）
  [122, 51], // 第 2 格：蹲下（雙手張開）
  [187, 40], // 第 3 格：腳底噴火
  [245, 45], // 第 4 格：腳底噴火（小）
  [303, 49], // 第 5 格：蹲下（手向外）
  [360, 55], // 第 6 格：斜飛（噴火）
  [420, 55], // 第 7 格：斜飛（反向）
];
const SHEET_H = 63; // 整張精靈圖的高度（每一格高度都一樣）

// 「站立」與「走路」各自要循環播放哪幾格（填上面 FRAMES 的編號，可自行調整）
const STOP_SEQ = [0, 1, 2, 1]; // 站立動畫：依序播放第 0、1、2、1 格
const WALK_SEQ = [3, 4, 5, 4]; // 走路動畫：依序播放第 3、4、5、4 格

// ===== 角色狀態變數 =====
let x; // 角色目前的 x 座標（水平位置）
let speed = 6; // 角色每個畫面移動的像素數（走路速度）
let facing = 1; // 角色面向：1 代表朝右，-1 代表朝左
let isWalking = false; // 角色是否正在走路（false 代表站立）
const SCALE = 3; // 角色放大倍率（原圖很小，放大 3 倍比較清楚）
const FLOOR_RATIO = 0.88; // 角色腳底站的位置，佔畫面高度的比例（0.88 代表在畫面下方 88% 處，剛好在地板上）

let step = 0; // 目前播放到動畫序列的第幾步（從 0 開始）
const FRAME_DELAY = 8; // 每隔幾個畫面才換下一格（數字越大動畫越慢）

// preload() 會在 setup() 之前執行，專門用來載入圖片、聲音等檔案
function preload() {
  bgImg = loadImage("background.webp"); // 載入背景圖片（要和 index.html 放在同一個資料夾）
  sheetImg = loadImage("2_all.png"); // 載入角色圖片精靈
}

// setup() 只會在程式開始時執行一次，用來做初始設定
function setup() {
  createCanvas(windowWidth, windowHeight); // 建立與瀏覽器視窗一樣大的全螢幕畫布
  x = width / 2; // 角色一開始的 x 座標放在畫面水平中間
  imageMode(CENTER); // 設定圖片以「中心點」為基準來擺放（方便置中與翻轉）
  noSmooth(); // 關閉圖片平滑處理，放大後像素畫才不會變模糊
}

// 畫出背景：讓圖片填滿整個畫布，並保持原本的比例（超出的部分會被裁掉）
function drawBackground() {
  background("#edf2fb"); // 先塗上底色 edf2fb，萬一圖片還沒載入也不會是黑的
  let s = max(width / bgImg.width, height / bgImg.height); // 計算要放大幾倍才能同時蓋滿寬和高
  push(); // 儲存目前的繪圖設定
  imageMode(CENTER); // 背景也以中心點為基準
  smooth(); // 背景是照片，開啟平滑處理讓放大後不會有鋸齒
  image(bgImg, width / 2, height / 2, bgImg.width * s, bgImg.height * s); // 把背景畫在畫面正中間，大小為原圖 × 倍率
  pop(); // 還原繪圖設定（角色仍使用 noSmooth）
}

// draw() 會不斷重複執行（每秒約 60 次），用來畫出動畫
function draw() {
  drawBackground(); // 每個畫面都先畫背景，再畫角色在上面

  // ----- 1. 判斷鍵盤狀態，決定角色是走路還是站立 -----
  if (keyIsDown(RIGHT_ARROW)) { // 如果「右鍵」正被按住
    isWalking = true; // 角色進入走路狀態
    facing = 1; // 面向右邊
    x += speed; // x 座標增加，角色向右移動
  } else if (keyIsDown(LEFT_ARROW)) { // 否則如果「左鍵」正被按住
    isWalking = true; // 角色進入走路狀態
    facing = -1; // 面向左邊（等一下會把圖片左右翻轉）
    x -= speed; // x 座標減少，角色向左移動
  } else { // 如果左右鍵都沒有按
    isWalking = false; // 角色回到站立狀態
  }

  // ----- 2. 依照狀態選擇要播放的動畫序列 -----
  let seq = isWalking ? WALK_SEQ : STOP_SEQ; // 走路用 WALK_SEQ，否則用 STOP_SEQ

  // ----- 3. 控制動畫循環播放 -----
  if (frameCount % FRAME_DELAY === 0) { // 每經過 FRAME_DELAY 個畫面才進來一次
    step++; // 換成下一步
  }
  step = step % seq.length; // 超過最後一步就回到第 0 步（循環播放），也避免切換動畫時超出範圍

  // ----- 4. 取得目前這一格在精靈圖中的位置與寬度 -----
  let f = FRAMES[seq[step]]; // 依照序列取出目前要播放的那一格資料
  let sx = f[0]; // 這一格在精靈圖中的起點 x
  let sw = f[1]; // 這一格的寬度

  // ----- 5. 限制角色不要走出畫面 -----
  let halfW = (sw * SCALE) / 2; // 角色畫在畫面上的半個寬度
  x = constrain(x, halfW, width - halfW); // 把 x 限制在畫面左右邊界之內

  // ----- 6. 計算角色的 y 座標（讓腳底站在地板上）-----
  let y = height * FLOOR_RATIO - (SHEET_H * SCALE) / 2; // 腳底位置 − 角色高度的一半 = 角色中心點的 y

  // ----- 7. 畫出角色 -----
  push(); // 儲存目前的繪圖設定，避免翻轉影響到其他東西
  translate(x, y); // 把座標原點移到角色所在的位置
  scale(facing, 1); // 水平縮放：facing 為 -1 時圖片會左右翻轉，為 1 時維持原樣
  image(
    sheetImg, // 要畫的圖片精靈
    0, // 畫在原點的 x（因為已經 translate 到角色位置）
    0, // 畫在原點的 y
    sw * SCALE, // 畫出來的寬度（單格寬度 × 放大倍率）
    SHEET_H * SCALE, // 畫出來的高度（單格高度 × 放大倍率）
    sx, // 從精靈圖的哪個 x 位置開始裁切
    0, // 從精靈圖的哪個 y 位置開始裁切（橫向排列所以是 0）
    sw, // 裁切下來的寬度
    SHEET_H // 裁切下來的高度
  ); // 把精靈圖中目前這一格畫到畫布上
  pop(); // 還原剛才儲存的繪圖設定
}

// 當瀏覽器視窗大小改變時，p5.js 會自動呼叫這個函式
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // 讓畫布重新調整成新的視窗大小
}
