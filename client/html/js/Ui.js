// Define namespace
var APP = APP || {};

var FpsMeasurementInterval = 1000;
var LatencyMeasurementInterval = 3000;

APP.Ui = function() {
  var self = this;

  var fs = $('#full-screen');
  var menu = $('#menu-container');
  var audioToggleButton = $('#audio-toggle-button');
  var mainMenu = $('#main-menu');
  var findingGameMenu = $('#looking-for-game-menu');
  var buttons = $('div.button');
  var cancelGameButton = $('#cancel-game');
  var nicknameInput = $('#nickname-input');

  this.displayFadingLargeText = function(text, fadeOutDelay, useLarger) {
    // Delete existing large-text node(s)
    var largeTextContainer = $('#large-text-container');
    largeTextContainer.empty();

    // Create a new large-text node
    var largeText = $(document.createElement('div'));
    largeText.attr('id', 'large-text').text(text);
    if (useLarger) {
      largeText.addClass('larger');
    }
    largeTextContainer.append(largeText);

    // Animate it out
    fadeOutDelay = fadeOutDelay || 500;

    setTimeout(function() {
      largeText.addClass('animate');
    }, fadeOutDelay);
  };

  this.update = function() {
    var scores = $('#score-container');
    var text = APP.Model.myName + " " + APP.Model.score.me + " - " +
      APP.Model.score.opponent + " " + APP.Model.opponentName;
    scores.text(text);

    if (APP.Model.gameRunning) {
      scores.show();
    } else {
      scores.hide();
    }

    if (!APP.Model.connectedToServer && (mainMenu.css('display') === 'none')) {
      // Server disconnected while in Looking for game menu; restore main menu.
      this.showFindingGameMenu(false);
    }

    $('#multi-player').toggleClass('disabled', !APP.Model.connectedToServer);
    //TODO instead of this, check if we are editing the field and not change the value then.
    if (nicknameInput.val().trim().length === 0) {
      nicknameInput.val(APP.Model.myName);
    }
    audioToggleButton.toggleClass('nosound', !APP.Model.audioEnabled);
  };

  function showCountdownTimer(timerValue, completionCb) {
    if (timerValue === 0) {
      completionCb();
    } else {
      ui.displayFadingLargeText(timerValue, 100, true);
      setTimeout(function() {
        showCountdownTimer(timerValue - 1, completionCb);
      }, 1000);
    }
  }

  this.showFindingGameMenu = function(show) {
    if (show) {
      mainMenu.hide(400);
      findingGameMenu.show(400);

      cancelGameButton.on('click', function () {
        networking.quitGame();
        showFindingGameMenu(false);
      });
    } else {
      mainMenu.show(400);
      findingGameMenu.hide(400);
    }
  };

  this.doStartGameAnimations = function(callback) {
    self.showMenu(false);

    setTimeout(function() {
      showCountdownTimer(CountdownTimer, function () {
        callback();
      });
    }, 1000);
  };

  this.updateStats = function() {
    var now = moment().utc().valueOf();

    // Remove any FPS samples older than measurement interval
    while (this.fpsSamples.length > 0) {
      if ((now - this.fpsSamples[0].time) > FpsMeasurementInterval) {
        this.fpsSamples.shift();
      } else {
        break;
      }
    }

    // Remove any latency samples older than measurement interval
    while (this.latencySamples.length > 0) {
      if ((now - this.latencySamples[0].time) > LatencyMeasurementInterval) {
        this.latencySamples.shift();
      } else {
        break;
      }
    }

    // Calculate FPS to display as an average over the measurement interval
    var avgFps = 0;
    if (this.fpsSamples.length > 0) {
      for (var i = 0; i < this.fpsSamples.length; i++) {
        avgFps += this.fpsSamples[i].fps;
      }
      avgFps = Math.round(avgFps / this.fpsSamples.length);
    }

    // Calculate Latency to display as an average over the measurement interval
    var avgLatency = 0;
    if (this.latencySamples.length > 0) {
      for (var i = 0; i < this.latencySamples.length; i++) {
        avgLatency += this.latencySamples[i].latency;
      }
      avgLatency = Math.round(avgLatency / this.latencySamples.length);
    }

    var fpsString = (avgFps > 0) ? avgFps : '-';
    var latencyString = (APP.Model.connectedToServer) ? (avgLatency + ' ms') : '-';

    $('#stats-container').html('FPS: ' + fpsString + '<br>' +
      'Latency: ' + latencyString);
  };

  this.addFpsSample = function(fps) {
    this.fpsSamples.push({fps: fps, time: moment().utc().valueOf()});
  };

  this.addLatencySample = function(latency) {
    this.latencySamples.push({latency: latency, time: moment().utc().valueOf()});
  };

  this.showMenu = function(show) {
    var doStartSinglePlayerGame = function(difficulty) {
      self.doStartGameAnimations(function() {
        startGame(APP.GameMode.SinglePlayer, difficulty);
      });
    };

    if (show) {
      $('#single-player-easy').on('click', function() {
        doStartSinglePlayerGame(APP.Difficulty.Easy);
      });
      $('#single-player-hard').on('click', function() {
        doStartSinglePlayerGame(APP.Difficulty.Hard);
      });
      $('#multi-player').on('click', function () {
        console.log('Clicked multiplayer button - calling findGame()');
        networking.findGame();
        self.showFindingGameMenu(true);
      });
      $('#nickname-input-button').on('click', function() {
        var nickname = nicknameInput.val().trim();
        if (nickname.length > 0) {
          APP.Model.myName = nickname;
          localStorage.setItem('myNickname', APP.Model.myName);
        }
      });
      fs.removeClass('animate-reverse');
      fs.addClass('animate');
      menu.removeClass('animate-reverse');
      menu.addClass('animate');
      menu.css('pointer-events', 'auto');
    } else {
      fs.removeClass('animate');
      fs.addClass('animate-reverse');
      menu.removeClass('animate');
      menu.addClass('animate-reverse');
      menu.css('pointer-events', 'none');
    }
  };

  /**
   Initializes the UI hooks.
   */
  this.init = function() {
    buttons.on('touchstart', function() {
      console.log('Touch started on button!');
      $(this).addClass('active');
    });
    buttons.on('touchend', function(e) {
      console.log('Touch ended on button!', e);
      $(this).removeClass('active');
      //TODO check the touch is within the button!
      $(this).trigger('click');
    });

    findingGameMenu.hide();

    setInterval(this.updateStats.bind(this), 1000);
  };

  this.fpsSamples = [];
  this.latencySamples = [];

  this.update();

  audioToggleButton.on('click', function() {
    console.log('Clicked on audio toggle button');

    audio.enableAudio(!APP.Model.audioEnabled);

    self.update();
  });

  this.init();
};
APP.Ui.constructor = APP.Ui;
