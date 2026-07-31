// ACT Metaphors Game: World 1 - The Mind's Sushi Restaurant (1:1 Square Ratio)
let brainChef;
let customer;
let plates = [];
let restaurantDecor = [];
let trackProgressOffset = 0;

let flexibilityScore = 50;
let energyMeter = 40;

let modeSelectScreen = true;
let customThoughts = [];
let inputField, submitButton, randomModeButton;
let inGameInputField, inGameSubmitButton;

let btnInspect, btnFightPush, btnLetGo;
let lastSpawnTime = -300;

// Square dimensions (600x600)
let canvasSize = 600;
let trackCenterX;
let trackCenterY;
let trackRadiusX = 210;
let trackRadiusY = 100;
let maxThoughtsOnTrack = 4;

function setup() {
  createCanvas(canvasSize, canvasSize);
  
  trackCenterX = width / 2;
  trackCenterY = height / 2;

  // Brain Chef at top, Customer at bottom
  brainChef = new BrainChef(trackCenterX, trackCenterY - trackRadiusY - 45);
  customer = new Customer(trackCenterX, trackCenterY + trackRadiusY + 45);

  // Background decor props
  for (let i = 0; i < 5; i++) {
    restaurantDecor.push({
      x: random(50, width - 50),
      y: random(40, height - 50),
      type: random(['counterBar', 'boothBooth', 'lanternString'])
    });
  }

  createMenuUI();
  createInGameUI();
  createActionButtonsUI();
}

function draw() {
  if (modeSelectScreen) {
    drawModeSelectionScreen();
    return;
  }

  if (frameCount % 45 === 0) {
    energyMeter = min(100, energyMeter + 0.5);
  }

  drawRestaurantInterior();
  drawOvalTrack();
  drawUI();

  // Spawn new thought plates starting at the Brain Chef (progress 0.75)
  if (frameCount - lastSpawnTime > 320 && plates.length < maxThoughtsOnTrack) {
    plates.push(new ThoughtPlate(getRandomThought(), getRandomSushi(), 0.75)); 
    lastSpawnTime = frameCount;
  }

  brainChef.update();
  brainChef.show();

  customer.update();
  customer.show();

  for (let i = plates.length - 1; i >= 0; i--) {
    plates[i].update();
    plates[i].show();

    if (plates[i].isFinished()) {
      plates.splice(i, 1);
    }
  }
}

function mousePressed() {
  if (modeSelectScreen) return;
  
  for (let i = plates.length - 1; i >= 0; i--) {
    if (plates[i].isClicked()) {
      if (customer.selectedThought === null) {
        customer.pickThought(plates[i]);
        plates.splice(i, 1);
        break;
      }
    }
  }
}

function keyPressed() {
  if (modeSelectScreen) return;

  if (key === 'i' || key === 'I') {
    actionInspectNearest();
  } else if (key === 'f' || key === 'F' || key === 'p' || key === 'P') {
    actionFightPush();
  } else if (key === 'l' || key === 'L') {
    actionLetGo();
  }
}

function actionInspectNearest() {
  if (customer.selectedThought !== null) return;
  
  let closestPlate = null;
  let closestDist = 9999;
  
  for (let p of plates) {
    let d = dist(p.x, p.y, customer.x, customer.y);
    if (d < closestDist) {
      closestDist = d;
      closestPlate = p;
    }
  }

  if (closestPlate && closestDist < 160) {
    customer.pickThought(closestPlate);
    let index = plates.indexOf(closestPlate);
    if (index > -1) plates.splice(index, 1);
  }
}

function actionFightPush() {
  flexibilityScore = max(0, flexibilityScore - 8);
  energyMeter = max(0, energyMeter - 12);
  customer.triggerFightPushAnimation();
  
  if (customer.selectedThought !== null) {
    customer.selectedThought.reverseDirection();
    plates.push(customer.selectedThought);
    customer.selectedThought = null;
  } else if (plates.length > 0) {
    let closestIndex = 0;
    let closestDist = 9999;
    for (let i = 0; i < plates.length; i++) {
      let d = dist(plates[i].x, plates[i].y, customer.x, customer.y);
      if (d < closestDist) {
        closestDist = d;
        closestIndex = i;
      }
    }
    if (closestDist < 180) {
      plates[closestIndex].reverseDirection();
    }
  }
}

function actionLetGo() {
  flexibilityScore = min(100, flexibilityScore + 3);
  customer.triggerLetGoAnimation();

  if (customer.selectedThought !== null) {
    customer.selectedThought.resumeDirection();
    plates.push(customer.selectedThought);
    customer.selectedThought = null;
  }
}

function createMenuUI() {
  inputField = createInput('');
  inputField.attribute('placeholder', 'Type a thought...');
  inputField.size(260, 30);
  inputField.position(width / 2 - 130, height / 2 + 30);
  
  submitButton = createButton('Add to Menu');
  submitButton.size(130, 32);
  submitButton.position(width / 2 - 65, height / 2 + 70);
  submitButton.mousePressed(addCustomThought);

  randomModeButton = createButton('Use Default Thoughts');
  randomModeButton.size(200, 34);
  randomModeButton.position(width / 2 - 100, height / 2 + 112);
  randomModeButton.mousePressed(startRandomMode);

  inputField.show();
  submitButton.show();
  randomModeButton.show();
}

function createInGameUI() {
  inGameInputField = createInput('');
  inGameInputField.attribute('placeholder', 'New thought...');
  inGameInputField.size(110, 24);
  inGameInputField.position(12, height - 76);
  inGameInputField.hide();

  inGameSubmitButton = createButton('Add');
  inGameSubmitButton.size(45, 26);
  inGameSubmitButton.position(128, height - 76);
  inGameSubmitButton.mousePressed(addInGameThought);
  inGameSubmitButton.hide();
}

function createActionButtonsUI() {
  let btnY = height - 38;

  btnInspect = createButton('[I] Inspect');
  btnInspect.size(85, 28);
  btnInspect.position(15, btnY);
  btnInspect.mousePressed(actionInspectNearest);
  btnInspect.hide();

  btnFightPush = createButton('[F] Fight');
  btnFightPush.size(85, 28);
  btnFightPush.position(105, btnY);
  btnFightPush.mousePressed(actionFightPush);
  btnFightPush.hide();

  btnLetGo = createButton('[L] Let Go');
  btnLetGo.size(85, 28);
  btnLetGo.position(195, btnY);
  btnLetGo.mousePressed(actionLetGo);
  btnLetGo.hide();
}

function addCustomThought() {
  let val = inputField.value().trim();
  if (val.length > 0) {
    customThoughts.push(val);
    inputField.value('');
    modeSelectScreen = false;
    hideMenuUI();
  }
}

function startRandomMode() {
  modeSelectScreen = false;
  hideMenuUI();
}

function addInGameThought() {
  let val = inGameInputField.value().trim();
  if (val.length > 0) {
    customThoughts.push(val);
    inGameInputField.value('');
  }
}

function hideMenuUI() {
  if (inputField) inputField.hide();
  if (submitButton) submitButton.hide();
  if (randomModeButton) randomModeButton.hide();
  if (inGameInputField) inGameInputField.show();
  if (inGameSubmitButton) inGameSubmitButton.show();
  if (btnInspect) btnInspect.show();
  if (btnFightPush) btnFightPush.show();
  if (btnLetGo) btnLetGo.show();
}

function drawModeSelectionScreen() {
  background(22, 18, 24);

  fill(32, 26, 35, 240);
  stroke(75, 55, 70);
  strokeWeight(2);
  rect(width / 2 - 250, 40, 500, 520, 14);

  noStroke();
  fill(255, 230, 200);
  textSize(18);
  textAlign(CENTER, TOP);
  text("🍣 THE MIND'S SUSHI RESTAURANT 🍣", width / 2, 60);

  textSize(12);
  fill(195, 205, 225);
  text("Thoughts flow slowly from the Brain Chef.\nInspect, Fight [F], or Let Go [L].\nEnergy restores automatically.", width / 2, 100);

  textSize(12);
  fill(255, 195, 110);
  text("Enter a custom thought below:", width / 2, 180);
}

function drawRestaurantInterior() {
  background(28, 22, 26);

  noStroke();
  fill(38, 30, 36, 180);
  rect(0, 0, width, height);

  for (let d of restaurantDecor) {
    if (d.type === 'counterBar') {
      fill(52, 38, 44);
      rect(d.x - 40, d.y, 80, 14, 4);
    } else if (d.type === 'boothBooth') {
      fill(65, 45, 55);
      rect(d.x - 30, d.y, 60, 20, 6);
    } else {
      stroke(60, 45, 50);
      strokeWeight(1);
      line(d.x - 30, 0, d.x, d.y);
      noStroke();
      fill(255, 220, 140, 230);
      ellipse(d.x, d.y + 10, 24, 32);
    }
  }

  fill(34, 26, 32);
  stroke(55, 40, 48);
  strokeWeight(2);
  ellipse(trackCenterX, trackCenterY, trackRadiusX * 1.6, trackRadiusY * 1.6);
}

function drawOvalTrack() {
  noFill();
  stroke(18, 14, 18);
  strokeWeight(38);
  ellipse(trackCenterX, trackCenterY, trackRadiusX * 2, trackRadiusY * 2);

  noFill();
  stroke(50, 36, 43);
  strokeWeight(30);
  ellipse(trackCenterX, trackCenterY, trackRadiusX * 2, trackRadiusY * 2);

  noFill();
  stroke(26, 20, 24);
  strokeWeight(22);
  ellipse(trackCenterX, trackCenterY, trackRadiusX * 2, trackRadiusY * 2);

  trackProgressOffset += 0.0006;
  stroke(65, 48, 56);
  strokeWeight(2);
  for (let a = 0; a < TWO_PI; a += QUARTER_PI) {
    let t = a + trackProgressOffset;
    let x1 = trackCenterX + cos(t) * (trackRadiusX - 10);
    let y1 = trackCenterY + sin(t) * (trackRadiusY - 10);
    let x2 = trackCenterX + cos(t) * (trackRadiusX + 10);
    let y2 = trackCenterY + sin(t) * (trackRadiusY + 10);
    line(x1, y1, x2, y2);
  }
}

function drawUI() {
  // Top HUD Bar
  fill(16, 12, 16, 240);
  noStroke();
  rect(0, 0, width, 40);

  fill(255);
  textSize(11);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("🍣 SUSHI RESTAURANT", 15, 20);
  textStyle(NORMAL);

  text("Flex:", 210, 20);
  fill(40, 40, 48);
  rect(245, 13, 70, 14, 6);
  fill(90, 215, 150);
  rect(245, 13, map(flexibilityScore, 0, 100, 0, 70), 14, 6);

  fill(255);
  text("Energy:", 335, 20);
  fill(40, 40, 48);
  rect(385, 13, 70, 14, 6);
  fill(235, 175, 75);
  rect(385, 13, map(energyMeter, 0, 100, 0, 70), 14, 6);

  // Bottom HUD Bar
  fill(16, 12, 16, 240);
  stroke(60, 45, 55);
  strokeWeight(1);
  rect(8, height - 104, width - 16, 42, 6);
  
  noStroke();
  fill(210, 220, 235);
  textSize(10);
  textAlign(LEFT, CENTER);
  text("Add custom thought:", 15, height - 93);
}

class BrainChef {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.animTimer = 0;
  }

  update() {
    this.animTimer += 0.03;
  }

  show() {
    noStroke();
    fill(255);
    rectMode(CENTER);
    rect(this.x, this.y - 24, 32, 16, 4);
    rect(this.x, this.y - 34, 24, 10, 4);

    fill(255, 165, 185);
    ellipse(this.x, this.y - 4, 46, 34);
  }
}

class Customer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.selectedThought = null;
    this.timer = 0;
    this.actionAnimTimer = 0;
    this.actionType = "";
  }

  pickThought(plate) {
    this.selectedThought = plate;
    this.timer = 240;
  }

  triggerFightPushAnimation() {
    this.actionAnimTimer = 22;
    this.actionType = "FIGHT!";
  }

  triggerLetGoAnimation() {
    this.actionAnimTimer = 22;
    this.actionType = "LET GO";
  }

  update() {
    if (this.selectedThought !== null) {
      this.timer--;
      if (this.timer <= 0) {
        this.selectedThought = null;
      }
    }
    if (this.actionAnimTimer > 0) {
      this.actionAnimTimer--;
    }
  }

  show() {
    noStroke();
    
    if (this.actionAnimTimer > 0) {
      fill(255, 110, 130, 190);
      ellipse(this.x, this.y - 22, 45, 28);
      
      fill(255);
      textSize(9);
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text(this.actionType, this.x, this.y - 22);
      textStyle(NORMAL);
    }

    fill(235, 200, 175);
    ellipse(this.x, this.y - 6, 20, 20);
    fill(65, 100, 150);
    rectMode(CENTER);
    rect(this.x, this.y + 10, 26, 22, 4);

    if (this.selectedThought !== null) {
      fill(245, 248, 255);
      stroke(160, 180, 205);
      strokeWeight(1);
      rect(this.x, this.y - 40, 140, 24, 4);

      noStroke();
      fill(20, 25, 35);
      textSize(10);
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text(this.selectedThought.sushiType + " " + this.selectedThought.label, this.x, this.y - 40);
      textStyle(NORMAL);
    }
  }
}

class ThoughtPlate {
  constructor(label, sushiType, progress) {
    this.progress = progress;
    this.speed = 0.0012;
    this.label = label;
    this.sushiType = sushiType;
    this.w = 130;
    this.h = 24;
    this.updateCoordinates();
  }

  updateCoordinates() {
    let angle = this.progress * TWO_PI;
    this.x = trackCenterX + cos(angle) * trackRadiusX;
    this.y = trackCenterY + sin(angle) * trackRadiusY;
  }

  update() {
    this.progress += this.speed;
    this.updateCoordinates();
  }

  reverseDirection() {
    this.speed = -0.002;
  }

  resumeDirection() {
    this.speed = 0.0012;
  }

  show() {
    fill(245, 248, 255);
    stroke(155, 175, 200);
    strokeWeight(1);
    ellipse(this.x, this.y, this.w + 6, this.h + 3);

    fill(228, 236, 248);
    rectMode(CENTER);
    rect(this.x, this.y, this.w, this.h, 4);

    noStroke();
    fill(22, 28, 38);
    textSize(10);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(this.sushiType + " " + this.label, this.x, this.y);
    textStyle(NORMAL);
  }

  isClicked() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    return (d < this.w / 2);
  }

  isFinished() {
    return false;
  }
}

function getRandomThought() {
  if (customThoughts.length > 0 && random() < 0.5) {
    return "'" + random(customThoughts) + "'";
  } else {
    let allThoughtsPool = [
      "'I am falling behind'",
      "'Everyone is judging me'",
      "'I can't handle this'",
      "'What if I mess up?'",
      "'The floor is wooden'",
      "'It is 3 o clock'",
      "'I need water'",
      "'My chair is comfy'"
    ];
    return random(allThoughtsPool);
  }
}

function getRandomSushi() {
  return random(["🍣", "🍤", "🍱", "🍥", "🍙", "🍵", "🍡"]);
}
