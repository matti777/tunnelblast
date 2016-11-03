/*
See:

 http://phaser.io
 http://www.html5rocks.com/en/tutorials/webaudio/intro/

 ios unlock: https://gist.github.com/laziel/7aefabe99ee57b16081c
 */

// Define namespace
var APP = APP || {};

APP.Audio = function() {
  var self = this;

  /**
   * Plays the "ball hit something" sound once.
   */
  this.playBallHitSound = function() {
    this.playBuffer(APP.Audio.BallHit);
  };

  /**
   * Creates and plays an audio source from a pre-loaded buffer.
   *
   * @param name
   * @param loop whether to loop the sound or not
   * @param volume value in range [0, 1]
   * @returns the created audio source
   */
  this.playBuffer = function(name, loop, volume) {
    var buffer = this.audioBuffers[name];
    if (!buffer) {
      console.log('** ERROR buffer not loaded: ', name);
      return;
    }

    var source = this.context.createBufferSource();
    source.buffer = buffer;

    if (volume !== undefined) {
      assert((volume >= 0) && (volume <= 1.0), 'Invalid volume value: ' + volume);
      var volumeNode = self.context.createGain();
      volumeNode.gain.value = volume;
      source.connect(volumeNode);
      volumeNode.connect(this.context.destination);
    } else {
      source.connect(this.context.destination);
    }

    source.loop = loop || false;
    source[source.start ? 'start' : 'noteOn'](0);

    return source;
  };

  /**
   * Asynchronously loads a sound file into an audio buffer.
   *
   * @param name name of the audio file to load
   * @param completionCb completion callback; will be called with a single
   * success param (true/false)
   */
  this.loadBuffer = function(name, completionCb) {
    var complete = function(success) {
      if (completionCb) {
        completionCb(success);
      }
    };

    var request = new XMLHttpRequest();
    request.open("GET", name, true);
    request.responseType = "arraybuffer";

    request.onload = function() {
      console.log('Audio file loaded; decoding it..');

      self.context.decodeAudioData(request.response,
        function(buffer) {
          self.audioBuffers[name] = buffer;
          complete(true);
        },
        function(error) {
          console.log('Failed to decode audio file', error);
          complete(false);
        });
    };

    request.onerror = function(error) {
      console.log('Failed to load sound file', name, error);
      complete(false);
    };

    request.send();
  };

  /**
   * Enables / disables playing of the audio. The choice is persisted into
   * the local storage.
   *
   * @param enable
   */
  this.enableAudio = function(enable) {
    console.log('enableAudio()', enable);

    APP.Model.audioEnabled = enable;

    localStorage.setItem('audioEnabled', enable);

    if (enable === true) {
      this.context.resume();
    } else {
      this.context.suspend();
    }
  };

  /**
   * Initializes the audio context and loads the audio files to buffers.
   */
  this.init = function() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();

    this.audioBuffers = {};

    console.log('Audio enabled at startup?', APP.Model.audioEnabled);
    this.enableAudio(APP.Model.audioEnabled);

    this.loadBuffer(APP.Audio.Music, function(success) {
      if (success) {
        console.log('Playing background music..');
        self.playBuffer(APP.Audio.Music, true, 0.5);
      }
    });

    this.loadBuffer(APP.Audio.BallHit);
  };

  this.init();
};

APP.Audio.constructor = APP.Audio;

// Sound filenames
APP.Audio.Music = 'audio/music.wav';
APP.Audio.BallHit = 'audio/ball_hit.wav';

