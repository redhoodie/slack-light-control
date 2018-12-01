
var pixel = require("node-pixel");
var firmata = require('firmata');
var pixel_mode;
var initalised;
var colour = "black";
var timer;
var interval = 200;
var strip_length = 56;
var strip;
var shutdown = false;
var brightness = 1; // 0...1 - ultra bright

function sleep(ms){
  return new Promise(resolve=>{
      setTimeout(resolve,ms)
  })
}

var pixel_control_loop = function() {
  var rgb_brightness = Math.round(250 * brightness);
  if (pixel_mode == "flashy") {
    if (!initalised) {
      for(var i = 0; i < strip_length; i++) {
        colour =  i % 2 == 1 ? "rgb(0, 0, " + rgb_brightness + ")" : "rgb(" + rgb_brightness + ", 0, 0)";
        strip.pixel(i).color(colour);
      }
      initalised = true;
    }
    strip.shift(1, pixel.FORWARD, true);
    strip.show();
  }
  else if (pixel_mode == "popo") {
    initalised = true;
    for (var i = 0; i < strip_length; i++) {
      // left
      if (i <= (strip_length / 2)) {
        // Red
        if (phase == 0 || phase == 5) {
          colour = "rgb(" + rgb_brightness + ", 0, 0)";
        }
        else {
          color = "black";
        }
      // Right
      } else {
        // Blue
        if (phase == 2 || phase == 4) {
          colour = "rgb(0, 0, " + rgb_brightness + ")";
        }
        else {
          color = "black";
        }
      }

      strip.pixel(i).color(colour);
    }

    phase = (phase + 1) % 6;
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
  set_interval(interval);
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

      set_mode('popo');
    });
});


// const five = require('johnny-five');
// const board = new five.Board({ 'repl':  false });
// const { RTMClient } = require('@slack/client');

// const token = process.env.SLACK_TOKEN;

// const rtm = new RTMClient(token);
// rtm.start();

// var led;

// const slow = 2000;
// const normal = 1000;
// const fast = 100;

// board.on('ready', function() {
//   led = new five.Led(9);

//   led.blink(normal);
// });

// rtm.on('message', (message) => {
//   // Skip messages that are from a bot or my own user ID
//   if ( (message.subtype && message.subtype === 'bot_message') ||
//       (!message.subtype && message.user === rtm.activeUserId) ) {
//     return;
//   }

//   // Check that the message is a real message and addresses me
//   regex = RegExp('^<@' + rtm.activeUserId + '> ');
//   if(message.subtype == null && regex.test(message.text)){
//     var body = message.text.replace(regex, '');
//   } else {
//     return;
//   }

//   console.log(`(channel:${message.channel}) ${message.user} says: ${message.text}`);

//   // Carry out the action
//   switch (body) {
//     case 'fast':
//       led.blink(fast);
//       break;
//     case 'normal':
//       led.blink(normal);
//       break;
//     case 'slow':
//       led.blink(slow);
//       break;
//     case 'on':
//       led.stop();
//       led.on();
//       break;
//     case 'off':
//       led.stop();
//       led.off();
//       break;
//   }
// });