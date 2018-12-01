
var pixel = require("node-pixel");
var firmata = require('firmata');
var pixel_mode;
var initalised;
var timer;
var interval = 200;
var strip_length = 56;
var strip;
var shutdown = false;
var brightness = 1; // 0...1 - ultrabright

function sleep(ms){
  return new Promise(resolve=>{
      setTimeout(resolve,ms)
  })
}

var pixel_control = function() {
  if (pixel_mode == "flashy") {
    if (!initalised) {
      for(var i = 0; i < strip_length; i++) {
        var colour =  i % 2 == 1 ? "rgb(0, 0, " + Math.round(250 * brightness) + ")" : "rgb(" + Math.round(250 * brightness) + ", 0, 0)";
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
  setInterval(pixel_control,timeout);
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

      set_mode('flashy');
    });
});
