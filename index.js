// var five = require("johnny-five");
var validcolors = require("./validcolors.json")
var request = require("request")
var pixel = require("node-pixel");
const https = require("https");
var firmata = require("firmata");
var pixel_mode;
var initalised;
var colour = "black";
var phase = 0;
var timer;
var gradientcolors = null;
var interval = 100;
var realname;
var strip_length = 110;
var strip;
var Rainbow = require('rainbowvis.js');
var shutdown = false;
var brightness = 0.5; // 0...1 - ultra bright

const {
  RTMClient
} = require('@slack/client');

const token = process.env.SLACK_TOKEN;
const thetoken = process.env.SEND_SLACK_TOKEN

const rtm = new RTMClient(token);
rtm.start();


function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function spectrum(wheelpos) {
  var r, g, b;
  wheelpos = 255 - wheelpos;

  if (wheelpos < 85) {
    r = 255 - wheelpos * 3;
    g = 0;
    b = wheelpos * 3;
  } else if (wheelpos < 170) {
    wheelpos -= 85;
    r = 0;
    g = wheelpos * 3;
    b = 255 - wheelpos * 3;
  } else {
    wheelpos -= 170;
    r = wheelpos * 3;
    g = 255 - wheelpos * 3;
    b = 0;
  }
  // returns a string with the rgb value to be used as the parameter
  return "rgb(" + r + "," + g + "," + b + ")";
}

var pixel_control_loop = function() {
  var rgb_brightness = Math.round(250 * brightness);
  if (pixel_mode == "christmas") {
    if (!initalised) {
      for (var i = 0; i < strip_length; i++) {
        if (i % 2 == 0) {
          colour = "rgb(0," + rgb_brightness + ",0)";
        } else {
          colour = "rgb(" + rgb_brightness + ", 0, 0)"
        }
        strip.pixel(i).color(colour);
      }
      initalised = true;
    }
    strip.shift(1, pixel.FORWARD, true);
    strip.show();
  } else if (pixel_mode == "popo") {
    if (!initalised) {
      for (var i = 0; i < strip_length; i++) {
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
        } else {
          colour = "black";
        }
        // Right
      } else {
        // Blue
        if (phase == 1 || phase == 3) {
          colour = "rgb(0, 0, " + rgb_brightness + ")";
        } else {
          colour = "black";
        }
      }

      strip.pixel(i).color(colour);
    }

    phase = (phase + 1) % 6;
    strip.show();
  } else if (pixel_mode == "random") {
    for (var i = 0; i < strip_length; i++) {
      var red, green, blue;
      red = Math.round(Math.random() * Math.floor(85) * brightness);
      green = Math.round(Math.random() * Math.floor(85) * brightness);
      blue = Math.round(Math.random() * Math.floor(85) * brightness);

      strip.pixel(i).color("rgb(" + red + ", " + green + ", " + blue + ")");
    }
    strip.show();
  } else if (pixel_mode == "steady") {
    for (var i = 0; i < strip_length; i++) {
      strip.pixel(i).color(colour);
    }
    strip.show();
  } else if (pixel_mode == "spinna") {
    strip.shift(1, pixel.FORWARD, true);
    strip.show();
  } else if (pixel_mode == "strobe") {
    if (!initalised) {
      for (var i = 0; i < strip_length; i++) {
        colour = "black";
        strip.pixel(i).color(colour);
      }
      strip.show();
      initalised = true;
    }
    for (var i = 0; i < strip_length; i++) {
      if (i <= (strip_length)) {
        if (phase == 0 || phase == 2) {
          if (current_mode != "rainbow") {
            colour = currentcolor;
          } else {

            colour = spectrum(((i + 10) * 256 / strip.length) & 255);

          }
        } else {
          colour = "black";
        }
      }
      strip.pixel(i).color(colour);
    }

    phase = (phase + 1) % 2;
    strip.show();
  } else if (pixel_mode == "gradient") {
    if (!initalised) {
      var rainbow = new Rainbow();
      rainbow.setNumberRange(0, strip_length);
      if (gradientcolors.length == 1) {
        rainbow.setSpectrum(gradientcolors[0]);
      } else if (gradientcolors.length == 2) {
        rainbow.setSpectrum(gradientcolors[0], gradientcolors[1]);
      } else if (gradientcolors.length == 3) {
        rainbow.setSpectrum(gradientcolors[0], gradientcolors[1], gradientcolors[2]);
      } else if (gradientcolors.length == 4) {
        rainbow.setSpectrum(gradientcolors[0], gradientcolors[1], gradientcolors[2], gradientcolors[3]);
      } else if (gradientcolors.length == 5) {
        rainbow.setSpectrum(gradientcolors[0], gradientcolors[1], gradientcolors[2], gradientcolors[3], gradientcolors[4]);
      }
      console.log(gradientcolors);
      var s = '';
      for (var i = 0; i <= strip_length; i++) {
        var hexColour = rainbow.colourAt(i);
        s += '#' + hexColour + ', ';
      }
      colour = s.split(", ", strip_length);
      for (var i = 0; i <= strip_length - 1; i++) {
        strip.pixel(i).color(colour[i]);
      }
      strip.show();
      initalised = true;
    }
  } else if (pixel_mode == "rainbow") {
    for (var i = 0; i < strip.length; i++) {
      colour = spectrum(((i + 10) * 256 / strip.length) & 255);
      strip.pixel(i).color(colour);
    }
    strip.show();
  } else if (pixel_mode == "sick_fade") {
    if (gradientcolors == null && gradientcolors.length == 0) {
      return;
    }

    var length = gradientcolors.length * 16;
    phase = phase % (length * 2);
    var rainbow = new Rainbow();
    rainbow.setNumberRange(0, length);
    if (gradientcolors.length == 1) {
      rainbow.setSpectrum(gradientcolors[0]);
    } else if (gradientcolors.length == 2) {
      rainbow.setSpectrum(gradientcolors[0], gradientcolors[1]);
    } else if (gradientcolors.length == 3) {
      rainbow.setSpectrum(gradientcolors[0], gradientcolors[1], gradientcolors[2]);
    } else if (gradientcolors.length == 4) {
      rainbow.setSpectrum(gradientcolors[0], gradientcolors[1], gradientcolors[2], gradientcolors[3]);
    } else if (gradientcolors.length == 5) {
      rainbow.setSpectrum(gradientcolors[0], gradientcolors[1], gradientcolors[2], gradientcolors[3], gradientcolors[4]);
    }
    var colours = [];
    for (var i = 0; i <= strip_length; i++) {
      var hexColour = rainbow.colourAt(i);
      colours.push('#' + hexColour);
    }

    if (phase < length) {
      j = phase;
    } else {
      j = (length * 2) - phase;
    }

    for (var i = 0; i <= strip_length - 1; i++) {
      strip.pixel(i).color(colours[j]);
    }
    strip.show();
    phase = (phase + 1) % (length * 2);
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

function set_mode(mode) {
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

var board = new firmata.Board('/dev/tty.usbserial-A6008do8', function() {

  strip = new pixel.Strip({
    pin: 6, // this is still supported as a shorthand
    length: strip_length,
    firmata: board,
    // gamma: 2,
    controller: "FIRMATA",
  });

  strip.on("ready", function() {
    // do stuff with the strip here.
    console.log("ready");
  });
});

rtm.on('message', (message) => {
  // Skip messages that are from a bot or my own user ID
  if ((message.subtype && message.subtype === 'bot_message') ||
    (!message.subtype && message.user === rtm.activeUserId)) {
    return;
  }

  // Check that the message is a real message and addresses me
  regex = RegExp('^<@' + rtm.activeUserId + '> ');
  if (message.subtype == null && regex.test(message.text)) {
    var body = message.text.replace(regex, '');
  } else {
    return;
  }



  current_mode = pixel_mode;

  console.log('old mode is: ' + current_mode);

  var url = "https://slack.com/api/users.profile.get?token=" + thetoken + "&user=" + message.user + "&pretty=1"

  request({
      url: url,
      json: true
    },
    function(error, response, body) {
      if (!error && response.statusCode === 200) {
        realname = body.profile.real_name
      }

      console.log("In the #" + message.channel + " channel, " + realname + " sent " + message.text.replace(RegExp('^<@' + rtm.activeUserId + '> '), ''));
    })
  // Carry out the action
  var params = body.split(' ');

  command = params.shift().toLowerCase();

  console.log('new command is: ' + command);

  switch (command) {
    // Speed
    case 'fast':
      set_interval(50);
      break;
    case 'normal':
      set_interval(100);
      break;
    case 'slow':
      set_interval(500);
      break;
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
    case 'speed':
      interval = parseInt(params[0]) || 200;
      if (interval < 50) {
        interval = 50;
      }
      if (interval > 5000) {
        interval = 5000;
      }
      set_interval(interval);
      break


    // Brightness
    case 'bright':
      brightness = 1;
      break;
    case 'dim':
      brightness = 0.5;
      break;
    case 'dark':
      brightness = 0.05;
      break;
    case 'brighter':
      brightness = brightness + 0.1;
      if (brightness > 1) {
        brightness = 1;
      }
      break
    case 'darker':
      brightness = brightness - 0.1;
      if (brightness < 0) {
        brightness = 0.05;
      }
      break
    case 'brightness':
      brightness = parseFloat(params[0]) || 0.5;
      if (brightness < 0) {
        brightness = 0.05;
      }
      if (brightness > 1) {
        brightness = 1;
      }
      break

    // Modes
    case 'christmas':
      set_mode('christmas');
      set_interval(200);
      break
    case 'goal':
    case 'strobe':
      if (command == "strobe" && current_mode != "steady" && current_mode != "rainbow") //can't flash something already flashing i.e police lights
      {
        https.get('https://slack.com/api/chat.postEphemeral?token=' + token + '&channel=' + message.channel + '&text=Cannot%20flash%20an%20already%20dynamic%20pattern.&user=' + message.user + '&pretty=1');
        break;
      } else {
        set_mode('strobe');
        set_interval(100);
      }
      break
      case 'spinna':
      if (command == "spinna" && current_mode != "steady" && current_mode != "rainbow" && current_mode != "christmas" && current_mode != "gradient") //can't flash something already flashing i.e police lights
      {
        https.get('https://slack.com/api/chat.postEphemeral?token=' + token + '&channel=' + message.channel + '&text=Cannot%20flash%20an%20already%20dynamic%20pattern.&user=' + message.user + '&pretty=1');
        break;
      } else {
        set_mode('spinna');
        set_interval(20);
      }
      break
    case 'police':
    case 'popo':
      set_mode('popo');
      set_interval(100);
      break
    case String(command.match(/^gradient.*/)):
      set_mode('gradient');
      break
    case 'random':
      set_mode('random');
      set_interval(100);
      break
    case 'steady':
      set_mode('steady');
      console.error(colour);
      set_interval(100);
      break
    case 'rainbow':
      set_mode('rainbow');
      break
    case 'sick_fade':
      set_mode('sick_fade');
      set_interval(100);
      break
    case 'on':
      start();
      break;
    case 'off':
      stop();
      break;
    default:
      console.log("Colour sent: " + command);
      if (params.length > 0) {
        gradientcolors = [command].concat(params);
        if (current_mode == 'sick_fade') {
          set_mode('sick_fade');
        } else {
          set_mode('gradient');
        }
        break;
      }

      if (command in validcolors) {
        colour = command;
        if (current_mode == "strobe") {
          set_mode('strobe');
        } else {
          set_mode('steady');
        }
        currentcolor = colour;
        console.log(currentcolor);
      } else {
        https.get('https://slack.com/api/chat.postEphemeral?token=' + token + '&channel=' + message.channel + '&text=Not%20a%20valid%20command.&user=' + message.user + '&pretty=1');
      }
      break;
  }
});