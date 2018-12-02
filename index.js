
var pixel = require("node-pixel");
var firmata = require('firmata');
var pixel_mode;
var initalised;
var colour = "black";
var phase = 0;
var timer;
var interval = 100;
var strip_length = 56;
var strip;
var shutdown = false;
var brightness = 1; // 0...1 - ultra bright

const { RTMClient } = require('@slack/client');

const token = process.env.SLACK_TOKEN;

const rtm = new RTMClient(token);
rtm.start();

function sleep(ms){
  return new Promise(resolve=>{
      setTimeout(resolve,ms)
  })
}

var pixel_control_loop = function() {
  var rgb_brightness = Math.round(250 * brightness);
  if (pixel_mode == "christmas") {
    if (!initalised) {
      for(var i = 0; i < strip_length; i++) {
        if (i % 3 == 0) {
          colour = "rgb(0," + rgb_brightness  + ",0)";
        } else if (i % 3 == 1) {
          colour = "rgb(" + rgb_brightness + ", 0, 0)"
        } else {
          colour = "rgb(" + "0" + ", " + "0" + ", 255)"
        }
        strip.pixel(i).color(colour);
      }
      initalised = true;
    }
    strip.shift(1, pixel.FORWARD, true);
    strip.show();
  }
  else if (pixel_mode == "popo") {
    if (!initalised) {
      for(var i = 0; i < strip_length; i++) {
        colour = "black";
        strip.pixel(i).color(colour);
      }
      strip.show();
      initalised = true;
    }
    for (var i = 0; i < strip_length; i++) {
      // left
      if (i <= (strip_length / 2)) {
        // Red
        if (phase == 0 || phase == 4) {
          colour = "rgb(" + rgb_brightness + ", 0, 0)";
        }
        else {
          colour = "black";
        }
      // Right
      } else {
        // Blue
        if (phase == 1 || phase == 3) {
          colour = "rgb(0, 0, " + rgb_brightness + ")";
        }
        else {
          colour = "black";
        }
      }

      strip.pixel(i).color(colour);
    }

    phase = (phase + 1) % 6;
    strip.show();
  }
  else if (pixel_mode == "rainbow") {
    if (!initalised) {

      var max = (255*255*255);

      for(var i = 0; i < strip_length; i++) {
        var red, green, blue;
        var rgb = i * (max / strip_length);
        red   = Math.round(((rgb >> 16) & 0xFF) * brightness);
        green = Math.round(((rgb >> 8) & 0xFF) * brightness);
        blue  = Math.round(((rgb) & 0xFF) * brightness);

        strip.pixel(i).color("rgb(" + red + ", " + green + ", " + blue + ")");
      }
      strip.show();
      initalised = true;
    }
    strip.shift(1, pixel.FORWARD, true);
    strip.show();
  }


  else if (pixel_mode == "steady") {
    if (!initalised) {
      for(var i = 0; i < strip_length; i++) {
        colour =  "rgb(255,255,255)";
        strip.pixel(i).color(colour);
      }
    initalised = true;
    }
    strip.shift(1, pixel.FORWARD, true);
    strip.show();
    
  }

  if (shutdown) {
    strip.off();
    strip.show();
  }
}


function set_interval(timeout) {
  clearInterval(timer);
  timer = setInterval(pixel_control_loop, timeout);
}

function set_mode(mode){
  initalised = false;
  pixel_mode = mode;
  start();
}

function start() {
  initalised = false;
  set_interval(interval);
}

function stop() {
  initalised = false; 
  clearInterval(timer);
  strip.color("black");
  strip.off();
  strip.show();
}

var board = new firmata.Board('/dev/tty.usbserial-A6008do8',function(){

    strip = new pixel.Strip({
        pin: 6, // this is still supported as a shorthand
        length: strip_length,
        firmata: board,
        controller: "FIRMATA",
    });

    strip.on("ready", function() {
      // do stuff with the strip here.
      console.log("ready");
    });
});

rtm.on('message', (message) => {
  // Skip messages that are from a bot or my own user ID
  if ( (message.subtype && message.subtype === 'bot_message') ||
      (!message.subtype && message.user === rtm.activeUserId) ) {
    return;
  }

  // Check that the message is a real message and addresses me
  regex = RegExp('^<@' + rtm.activeUserId + '> ');
  if(message.subtype == null && regex.test(message.text)){
    var body = message.text.replace(regex, '');
  } else {
    return;
  }

  console.log(`(channel:${message.channel}) ${message.user} says: ${message.text}`);
  console.log(pixel_mode);

  // Carry out the action
  switch (body) {
    case 'fast':
      set_interval(50);
      break;
    case 'normal':
      set_interval(100);
      break;
    case 'slow':
      set_interval(500);
      break;
    case 'christmas':
      set_mode('christmas');
      set_interval(200);
      break
    case 'popo':
      set_mode('popo');
      set_interval(50);
      break
    case 'rainbow':
      set_mode('rainbow');
      set_interval(50);
      break
    case 'steady':
      set_mode('steady');
      break
    case 'faster':
      interval = interval - 50;
      if (interval < 50) {
        interval = 50;
      }
      set_interval(interval);
      break
    case 'slower':
      interval = interval + 50;
      if (interval > 5000) {
        interval = 5000;
      }
      set_interval(interval);
      break
    case 'on':
      start();
      break;
    case 'off':
      stop();
      break;
  }
});
