# Slack LED Strip control
Control LED strip lights from Slack

## Setup

1. Set up a bot user on your Slack instance.
2. Upload a Firmata sketch to your device e.g. https://github.com/firmata/arduino/tree/master/examples/StandardFirmataPlus
3. Attach a basic LED strip your device via Arduino with the positive terminal on pin 9 and the negative terminal on GND.
4. Install dependencies with `npm install` and then run slack-light-control with the Slack token, e.g. `SLACK_TOKEN=... node index.js`

## Usage

To issue a message to the bot, send it its name, then the command:

`@as_lightbot popo`

Valid commands are:
* christmas: blink the lights red and green and blue
* popo: flash half the light bar red and blue, in the pattern of police lights
* off: turn the lights off
* random: lots of random colors. Currently its quite bright and doesn't too good so working on tweaking it
* *colour* Send the bot a valid colour and the lightbar will display that colour on solid.

More to come

## Credit

Some code copied from Slack API documentation examples: http://slackapi.github.io/node-slack-sdk/rtm_api

Also thanks to Dave @nzdjb for the inspiration for this project.
