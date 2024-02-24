// ==UserScript==
// @name        Floating Timer
// @namespace   Violentmonkey Scripts
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand
// @version     1.0
// @author      -
// @description Adds a floating timer to websites
// ==/UserScript==

const RunningBackgroundColor = "#1a5fb4";
const PausedBackgroundColor = "#e5a50a";
const TimeOutBackgroundColor = "#a51d2d";

// Example rules
//
// const RULES = {
//   // set a max timer of 10 minutes for twitter and turn the timer red when expired
//   "twitter.com": { maxLength: 10 * 60 * 1000, callback: timeout },
//
//   // set a max timer of 30 minutes for bluesky and redirect the page,
//   // preventing the site from being accessed for the rest of the day
//   "bsky.app": { maxLength: 30 * 60 * 1000, callback: () => location.href = "https://google.com" }
// }

const RULES = {
}


/**
 * Gets today at midnight
 * @return {Date}
 */
function MidnightTodayLocal() {
  const d = new Date();
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);

  return d.getTime();
}

/**
 * Clears all saved timers
 * @return {void}
 */
function resetAll() {
  GM_listValues().forEach(val => GM_deleteValue(val));
}

/**
 * Resets the timer to 0
 * @return {void}
 */
function resetTimer() {
  floatingDiv.style.backgroundColor = RunningBackgroundColor;
  expired = false;
  timer = 0;
}

/**
 * Resets the timer to the top left of the page
 * @return {void}
 */
function resetPosition() {
  floatingDiv.style.top = "0px";
  floatingDiv.style.left = "0px";
}

/**
 * Default values for the settings object
 * Timer is the default value in milliseconds for the timer to use
 * elX is the default position from the left of the screen for the timer to appear (pixels)
 * exY is the default position from the top of the screen for the timer to appear (pixels)
 * lastUpdate is a number representing when the time was last saved
 */
const defaultSettings = {
  timer: 0,
  elX: 0,
  elY: 0,
  lastUpdate: 0
}

let paused = false;
let expired = false;

/** Working copy of settings object */
let settings = {};

/**
 * ID for timer interval
 * @type {number}
 */
let timerId;

/**
 * Working copy of last update
 * @type {Date}
 */
let lastUpdate;

/**
 * If the last update is from a different day than the current time, reset the timer
 * @return {void}
 */
function resetAtMidnight() {
  if (lastUpdate.getTime() < MidnightTodayLocal()) {
    timer = 0;
    lastUpdate = new Date();
  }
}

/**
 * Increments the timer in the floating element
 * @return {void}
 */
function incrementTimer() {
  timer += 1000;
  const d = new Date(timer);
  floatingDiv.innerText = d.getUTCHours().toString().padStart(2, "0") + ":" + d.getUTCMinutes().toString().padStart(2, "0") + ":" + d.getUTCSeconds().toString().padStart(2, "0");

  resetAtMidnight();

  // Example for a special action when the timer hits a specific value (in this case, 10 minutes)
  if (!expired && Object.prototype.hasOwnProperty.call(RULES, location.hostname)) {
    const { maxLength, callback } = RULES[location.hostname];
    console.log(maxLength, callback);
    if (timer >= maxLength) callback();
  }
}

/**
 * Runs on page startup and focus
 * Grabs the stored settings value for this hostname and restores it
 * Starts the timer
 * @return {void}
 */
function startup() {
  paused = false;

  if (!expired) floatingDiv.style.backgroundColor = RunningBackgroundColor;

  settings = GM_getValue(location.hostname, defaultSettings);

  timer = settings.timer;

  lastUpdate = new Date(settings.lastUpdate);
  resetAtMidnight();

  floatingDiv.style.top = settings.elY.toString() + "px";
  floatingDiv.style.left = settings.elX.toString() + "px";

  timerId = setInterval(incrementTimer, 1000);
}

/**
 * Runs on page close and hidden
 * Stores the position and current timer value
 * Stops timer while page is in background
 * @return {void}
 */
function shutdown () {
  paused = true;

  if (!expired) floatingDiv.style.backgroundColor = PausedBackgroundColor;

  settings.elY = floatingDiv.offsetTop;
  settings.elX = floatingDiv.offsetLeft;

  settings.timer = timer;
  lastUpdate = new Date();
  settings.lastUpdate = lastUpdate.getTime();

  clearInterval(timerId);

  GM_setValue(location.hostname, settings);
}

/**
 * Marks the timer as expired and changes the background color
 */
function timeout() {
  expired = true;

  floatingDiv.style.backgroundColor = TimeOutBackgroundColor;
}

// this part largely based on https://www.w3schools.com/howto/howto_js_draggable.asp

let timer = 0;
const elePosition = { x: 0, y: 0 };
const mousePosition = { x: 0, y: 0 };

// styling for timer element
/** @type {HTMLDivElement} */
const floatingDiv = document.createElement("div");
floatingDiv.style.backgroundColor = RunningBackgroundColor;
floatingDiv.style.color = "white";
floatingDiv.style.fontFamily = "sans-serif";
floatingDiv.style.width = "120px";
floatingDiv.style.height = "70px";
floatingDiv.style.opacity = "90%";

floatingDiv.style.borderRadius = "10px";

floatingDiv.style.fontSize = "16pt";

floatingDiv.style.cursor = "pointer";

floatingDiv.style.display = "flex";
floatingDiv.style.justifyContent = "center";
floatingDiv.style.alignItems = "center";

floatingDiv.style.zIndex = 1000;
floatingDiv.style.position = "fixed";

let dragged = false;

function moveElement(e) {
  e.preventDefault();

  dragged = true;

  elePosition.x = mousePosition.x - e.clientX;
  elePosition.y = mousePosition.y - e.clientY;

  mousePosition.x = e.clientX;
  mousePosition.y = e.clientY;

  floatingDiv.style.top = (floatingDiv.offsetTop - elePosition.y).toString() + "px";
  floatingDiv.style.left = (floatingDiv.offsetLeft - elePosition.x).toString() + "px";
}

function stopMoveElement() {
  document.removeEventListener("mousemove", moveElement);
  document.removeEventListener("mouseup", stopMoveElement);

  // keep element marked as dragged for 5ms after dropping
  setTimeout(() => dragged = false, 5);
}

floatingDiv.addEventListener("mousedown", (e) => {
  e.preventDefault();

  mousePosition.x = e.clientX;
  mousePosition.y = e.clientY;

  document.addEventListener("mousemove", moveElement);
  document.addEventListener("mouseup", stopMoveElement);
});

document.body.appendChild(floatingDiv);

// save settings on page unload
window.addEventListener("beforeunload", shutdown);

// save settings on page hidden
// load settings on page shown
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    shutdown();
  } else {
    startup();
  }
});

startup();

floatingDiv.addEventListener("click", () => {
  // don't trigger click if element is being dragged
  if (!dragged) {
    paused ? startup() : shutdown();
  }
});

GM_registerMenuCommand("Reset timer", resetTimer);
GM_registerMenuCommand("Reset timer position", resetPosition);
GM_registerMenuCommand("Reset all timers", resetAll);

