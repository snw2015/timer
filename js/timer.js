started = false;

const alarm = new Audio();
alarm.src = "./alarm.wav";

function updateTime() {
  if (started) {
    ddl = $("#ddl").val();
    date = new Date();
    hourDdl = parseInt(ddl.split(":")[0]);
    minuteDdl = parseInt(ddl.split(":")[1]);
    hourNow = date.getHours();
    minuteNow = date.getMinutes();
    hourLeft = hourDdl - hourNow;
    minuteLeft = minuteDdl - minuteNow;
    if (minuteLeft < 0) {
      minuteLeft += 60;
      hourLeft--;
    }
    if (hourLeft < 0 || hourLeft == 0 && minuteLeft == 0) {
      $("#time-left").val("00:00");
      $("#time-left").addClass("blink");
      alarm.play();
    } else {
      $("#time-left").val(`${(""+hourLeft).padStart(2, "0")}:${(""+minuteLeft).padStart(2, "0")}`);
    }
  }
}

function start() {
  if ($("#ddl").val()) {
    started = true;
    $("#time-left").removeClass("blink");
    alarm.pause();
  }
}

function stop() {
  started = false;
  $("#time-left").val(null);
  $("#time-left").removeClass("blink");
  alarm.pause();
}

$(() => {
  $("#btn-start").click(start);
  $("#btn-stop").click(stop);
  $("#ddl").change(stop);

  setInterval(updateTime, 1000);
});
