/****** Constants ******/

const ALARM_SRC = "./alarm.wav";
const REFRESH_INTERVAL_MS = 1000;


/*.*.*.*.* Utilities *.*.*.*.*/

function time2str(time) {
  return `${("" + time.hour).padStart(2, "0")}:${("" + time.minute).padStart(2, "0")}`;
}

function str2time(str) {
  return {hour: Number(str.slice(0, 2)), minute: Number(str.slice(3, 5))};
}

function getNow() {
  const now = new Date();
  return {hour: now.getHours(), minute: now.getMinutes()};
}

function getTimeZone() {
  return new Date().toTimeString().match(/\((.+)\)/)[1];
}


/*^~-._.-~^*  Data  *^~-._.-~^*/

const components = {};
const timeDdl = {hour: 0, minute: 0};
const timeLeft = {hour: 0, minute: 0, isOver: function() { return this.hour == 0 && this.minute == 0; }};
let anyNum = 0;

function componentsSetup() {
  components.timeNow = $("#time-now");
  components.timeDdl = $("#time-ddl");
  components.timeLeft = $("#time-left");
  components.timeZone = $("#time-zone");
  components.btnStart = $("#btn-start-and-stop");
  components.btnPause = $("#btn-pause");
  components.labelText = $("#label-text");
  components.sub1 = $("#sub-1");
  components.add1 = $("#add-1");
  components.sub5 = $("#sub-5");
  components.add5 = $("#add-5");
  components.sub10 = $("#sub-10");
  components.add10 = $("#add-10");
  components.sub60 = $("#sub-60");
  components.add60 = $("#add-60");
  components.subAny = $("#sub-any");
  components.addAny = $("#add-any");
  components.inputAnyNum = $("#input-any-num");
  components.alarm = getAlarm();
}

function getAlarm() {
  let alarm = new Audio();
  alarm.src = ALARM_SRC;

  return alarm;
}

function saveData() {
  localStorage['timer:ddl'] = components.timeDdl.val();
  localStorage['timer:label-text'] = components.labelText.text();
  localStorage['timer:input-any'] = components.inputAnyNum.val();
}

function loadData(dataList) {
  if (localStorage['timer:ddl']) setDdl(str2time(localStorage['timer:ddl']));
  if (localStorage['timer:label-text']) components.labelText.text(localStorage['timer:label-text']);
  if (localStorage['timer:input-any']) {
    components.inputAnyNum.val(localStorage['timer:input-any']);
    syncInputAny();
  }
}


/****** Modes ******/

const MODE = {SETTING: {name: 'SETTING'}, RUNNING: {name: 'RUNNING'}, ALARMING: {name: 'ALARMING'}, PAUSING: {name: 'PAUSING'}};
MODE.SETTING.from = [MODE.RUNNING, MODE.ALARMING, MODE.PAUSING];
MODE.RUNNING.from = [MODE.SETTING, MODE.ALARMING, MODE.PAUSING];
MODE.ALARMING.from = [MODE.RUNNING];
MODE.PAUSING.from = [MODE.RUNNING];

let mode = null;

MODE.SETTING.satisfied = () => true;

MODE.RUNNING.satisfied = function() {
  syncTime();
  return !timeLeft.isOver();
}

MODE.ALARMING.satisfied = () => true;

MODE.PAUSING.satisfied = () => true;

function goInto(newMode) {
  if (newMode.from.includes(mode) && newMode.satisfied()) {
    mode = newMode;
    updateUIs();
  }
}


/******** View ********/

function updateUIs() {
  updateDdl();
  updateButtons();
  updateRealTimeUIs();
}

function updateRealTimeUIs() {
  updateNow();
  updateLeft();
  updateAlarm();
}

function updateButtons() {
  updateButtonStart();
  updateButtonPause();
}

function updateButtonStart() {
  const btn = components.btnStart;
  btn.attr('disabled', false);
  if (mode == MODE.SETTING) {
    btn.val('开始');
    btn.removeClass('btn-danger');
    btn.addClass('btn-primary');
    if (timeLeft.isOver()) {
      btn.attr('disabled', true);
    }
  } else if (mode == MODE.RUNNING || mode == MODE.ALARMING || mode == MODE.PAUSING) {
    btn.val('终止');
    btn.removeClass('btn-primary');
    btn.addClass('btn-danger');    
  }
}

function updateButtonPause() {  
  const btn = components.btnPause;
  if (mode == MODE.SETTING || mode == MODE.ALARMING) {
    btn.val('暂停');
    btn.removeClass('btn-success');
    btn.addClass('btn-secondary');
    btn.attr('disabled', true);
  } else if (mode == MODE.RUNNING) {
    btn.val('暂停');
    btn.removeClass('btn-success');
    btn.addClass('btn-secondary');    
    btn.attr('disabled', false);
  } else if (mode == MODE.PAUSING) {
    btn.val('继续');
    btn.removeClass('btn-secondary');
    btn.addClass('btn-success');
    btn.attr('disabled', false);    
  }
}

function updateTimeZone() {
  components.timeZone.text(getTimeZone());
}

function updateNow() {
  components.timeNow.val(time2str(getNow()));
}

function updateDdl() {
  components.timeDdl.val(time2str(timeDdl));
  if (mode == MODE.PAUSING) {
    components.timeDdl.attr('disabled', true);
  } else {
    components.timeDdl.attr('disabled', false);    
  }
}

function updateLeft() {
  components.timeLeft.val(time2str(timeLeft));
  if (mode == MODE.ALARMING) {
    components.timeLeft.addClass('blink');
  } else {
    components.timeLeft.removeClass('blink');
  }
}

function updateAlarm() {
  if (mode == MODE.ALARMING && components.alarm.paused) {
    components.alarm.currentTime = 0;
    components.alarm.play();
  } else if (mode != MODE.ALARMING && !components.alarm.paused) {
    components.alarm.pause();
  }
}


/****** Control ******/

function addEvents() {
  components.btnStart.click(switchTimer);
  components.btnPause.click(pauseOrResume);
  components.timeDdl.change(syncTime);
  components.timeDdl.dblclick(setDdlNow);
  components.add1.click(() => changeDdl(1));
  components.sub1.click(() => changeDdl(-1));
  components.add5.click(() => changeDdl(5));
  components.sub5.click(() => changeDdl(-5));
  components.add10.click(() => changeDdl(10));
  components.sub10.click(() => changeDdl(-10));
  components.add60.click(() => changeDdl(60));
  components.sub60.click(() => changeDdl(-60));
  components.addAny.click(() => changeDdl(anyNum));
  components.subAny.click(() => changeDdl(-anyNum));
  components.inputAnyNum.change(syncInputAny);
}

function syncTime() {
  setDdl(str2time(components.timeDdl.val()));
}

function syncInputAny() {
  const n = Number(components.inputAnyNum.val());
  if (n) anyNum = n;
}

/****** Main Logic ******/

function createInterval() {
  setInterval(refresh, REFRESH_INTERVAL_MS);
}

function switchTimer() {
  if (mode == MODE.SETTING) {    
    goInto(MODE.RUNNING);
  } else if (mode == MODE.RUNNING || mode == MODE.ALARMING || mode == MODE.PAUSING) {
    goInto(MODE.SETTING);
  }
}

function pauseOrResume() {
  if (mode == MODE.RUNNING) {
    goInto(MODE.PAUSING);
  } else if (mode == MODE.PAUSING) {
    goInto(MODE.RUNNING);
  }
}

function setDdl(time) {
  timeDdl.hour = time.hour;
  timeDdl.minute = time.minute;
  calcLeft();
  updateUIs();
}

function setDdlNow() {
  setDdl(getNow());
}

function changeDdl(diffMinute) {
  let hour = timeDdl.hour;
  let minute = timeDdl.minute + diffMinute;
  while (minute >= 60) {
    minute -= 60;
    hour += 1;
  }
  while (minute < 0) {
    minute += 60;
    hour -= 1;
  }
  
  if (hour >= 24) {
    hour = 23;
    minute = 59;
  }
  
  const now = getNow();
  if (hour < now.hour || hour == now.hour && minute < now.minute) {
    hour = now.hour;
    minute = now.minute;
  }
  
  setDdl({hour: hour, minute: minute});
  
  if (mode == MODE.ALARMING) {
    goInto(MODE.RUNNING);
  }
}

function calcLeft() {
  const now = getNow();
  timeLeft.hour = timeDdl.hour - now.hour;
  timeLeft.minute = timeDdl.minute - now.minute;
  if (timeLeft.minute < 0) {
    timeLeft.minute += 60;
    timeLeft.hour -= 1;
  }
  if (timeLeft.hour < 0) {
    timeLeft.hour = 0;
    timeLeft.minute = 0;
  }
}

function setDdlForLeft() {
  const now = getNow();
  let hour = now.hour + timeLeft.hour;
  let minute = now.minute + timeLeft.minute;

  while (minute >= 60) {
    minute -= 60;
    hour += 1;
  }
  
  if (hour >= 24) {
    hour = 23;
    minute = 59;
  }
  
  setDdl({hour: hour, minute: minute});
}

function refresh() {
  if (mode == MODE.PAUSING) {
    setDdlForLeft();
  }
  calcLeft();
  if (mode == MODE.RUNNING && timeLeft.isOver()) {
    goInto(MODE.ALARMING);
  }
  updateRealTimeUIs();
}


/****** Main ******/

function load() {
  componentsSetup();
  updateTimeZone();

  loadData();

  syncTime();
  
  mode = MODE.SETTING;

  updateUIs();
  
  addEvents();
  createInterval();  
}

function unload() {
  saveData();
}

$(load);

$(window).on("beforeunload", unload);