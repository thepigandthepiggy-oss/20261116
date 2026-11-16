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

// ===== 其他設定 =====
const SCALE = 3; // 角色放大倍率（原圖很小，放大 3 倍比較清楚）
const FLOOR_RATIO = 0.88; // 角色腳底站的位置，佔畫面高度的比例（剛好在地板上）
const FRAME_DELAY = 8; // 每隔幾個畫面才換下一格（數字越大動畫越慢）

let players = []; // 用來存放所有角色的陣列（這裡會放 2 個角色）

// ===== 角色類別：把「一個角色」需要的資料和動作包在一起，這樣複製角色就很簡單 =====
class Player {
  // constructor 是建立角色時會自動執行的函式，參數為：起始位置比例、向右鍵、向左鍵、起始面向
  constructor(xRatio, rightKey, leftKey, facing) {
    this.x = width * xRatio; // 角色的 x 座標，依畫面寬度的比例決定起始位置
    this.rightKey = rightKey; // 控制向右走的按鍵代碼
    this.leftKey = leftKey; // 控制向左走的按鍵代碼
    this.facing = facing; // 面向：1 代表朝右，-1 代表朝左
    this.speed = 6; // 每個畫面移動的像素數（走路速度）
    this.isWalking = false; // 是否正在走路（false 代表站立）
    this.step = 0; // 目前播放到動畫序列的第幾步
  }

  // update() 負責更新角色的狀態（按鍵、移動、動畫步驟）
  update() {
    if (keyIsDown(this.rightKey)) { // 如果這個角色的「向右鍵」正被按住
      this.isWalking = true; // 進入走路狀態
      this.facing = 1; // 面向右邊
      this.x += this.speed; // x 增加，向右移動
    } else if (keyIsDown(this.leftKey)) { // 否則如果「向左鍵」正被按住
      this.isWalking = true; // 進入走路狀態
      this.facing = -1; // 面向左邊（畫的時候會左右翻轉）
      this.x -= this.speed; // x 減少，向左移動
    } else { // 兩個鍵都沒按
      this.isWalking = false; // 回到站立狀態
    }

    let seq = this.isWalking ? WALK_SEQ : STOP_SEQ; // 走路用 WALK_SEQ，否則用 STOP_SEQ
    if (frameCount % FRAME_DELAY === 0) { // 每經過 FRAME_DELAY 個畫面才進來一次
      this.step++; // 換成下一步
    }
    this.step = this.step % seq.length; // 超過最後一步就回到第 0 步（循環播放）
  }

  // display() 負責把角色畫到畫布上
  display() {
    let seq = this.isWalking ? WALK_SEQ : STOP_SEQ; // 選擇目前要播放的動畫序列
    let f = FRAMES[seq[this.step]]; // 取出目前要播放的那一格資料
    let sx = f[0]; // 這一格在精靈圖中的起點 x
    let sw = f[1]; // 這一格的寬度

    let halfW = (sw * SCALE) / 2; // 角色畫在畫面上的半個寬度
    this.x = constrain(this.x, halfW, width - halfW); // 限制角色不要走出畫面左右邊界

    let y = height * FLOOR_RATIO - (SHEET_H * SCALE) / 2; // 腳底位置 − 角色高度的一半 = 角色中心點的 y

    push(); // 儲存目前的繪圖設定，避免翻轉影響到其他東西
    translate(this.x, y); // 把座標原點移到角色所在的位置
    scale(this.facing, 1); // 水平縮放：facing 為 -1 時圖片會左右翻轉
    image(
      sheetImg, // 要畫的圖片精靈
      0, // 畫在原點的 x
      0, // 畫在原點的 y
      sw * SCALE, // 畫出來的寬度（單格寬度 × 放大倍率）
      SHEET_H * SCALE, // 畫出來的高度（單格高度 × 放大倍率）
      sx, // 從精靈圖的哪個 x 位置開始裁切
      0, // 從精靈圖的哪個 y 位置開始裁切
      sw, // 裁切下來的寬度
      SHEET_H // 裁切下來的高度
    ); // 把精靈圖中目前這一格畫到畫布上
    pop(); // 還原剛才儲存的繪圖設定
  }
}

// preload() 會在 setup() 之前執行，專門用來載入圖片、聲音等檔案
function preload() {
  bgImg = loadImage("background.webp"); // 載入背景圖片（要和 index.html 放在同一個資料夾）
  sheetImg = loadImage("2_all.png"); // 載入角色圖片精靈
}

// setup() 只會在程式開始時執行一次，用來做初始設定
function setup() {
  createCanvas(windowWidth, windowHeight); // 建立與瀏覽器視窗一樣大的全螢幕畫布
  imageMode(CENTER); // 設定圖片以「中心點」為基準來擺放（方便置中與翻轉）
  noSmooth(); // 關閉圖片平滑處理，放大後像素畫才不會變模糊
  players.push(new Player(1 / 3, RIGHT_ARROW, LEFT_ARROW, 1)); // 角色 1：在畫面 1/3 處，用方向鍵 → ← 控制
  players.push(new Player(2 / 3, 68, 65, -1)); // 角色 2：在畫面 2/3 處，用 D（向右）和 A（向左）控制，一開始面向左
}

// 畫出背景：讓圖片填滿整個畫布，並保持原本的比例（超出的部分會被裁掉）
function drawBackground() {
  background("#edf2fb"); // 先塗上底色 edf2fb，萬一圖片還沒載入也不會是黑的
  let s = max(width / bgImg.width, height / bgImg.height); // 計算要放大幾倍才能同時蓋滿寬和高
  push(); // 儲存目前的繪圖設定
  smooth(); // 背景是照片，開啟平滑處理讓放大後不會有鋸齒
  image(bgImg, width / 2, height / 2, bgImg.width * s, bgImg.height * s); // 把背景畫在畫面正中間，大小為原圖 × 倍率
  pop(); // 還原繪圖設定（角色仍使用 noSmooth）
}

// draw() 會不斷重複執行（每秒約 60 次），用來畫出動畫
function draw() {
  drawBackground(); // 每個畫面都先畫背景，再畫角色在上面
  for (let p of players) { // 對陣列裡的每一個角色依序處理
    p.update(); // 更新這個角色的按鍵、位置與動畫
    p.display(); // 把這個角色畫出來
  }
}

// 當瀏覽器視窗大小改變時，p5.js 會自動呼叫這個函式
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // 讓畫布重新調整成新的視窗大小
}
