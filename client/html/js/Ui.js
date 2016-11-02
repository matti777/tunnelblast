// Define namespace
var APP = APP || {};

var FpsMeasurementInterval = 1000;
var LatencyMeasurementInterval = 3000;

APP.Ui = function(networking) {
  var self = this;

  this.audioToggleButton = $('#audio-toggle-button');
  this.mainMenu = $('#main-menu');
  this.findingGameMenu = $('#looking-for-game-menu');
  this.findingGameMenu.hide();

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

    if (!APP.Model.connectedToServer && (this.mainMenu.css('display') === 'none')) {
      // Server disconnected while in Looking for game menu; restore main menu.
      this.showFindingGameMenu(false);
    }

    $('#multi-player').toggleClass('disabled', !APP.Model.connectedToServer);

    $('#nickname-input').val(APP.Model.myName);
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
      self.mainMenu.hide(400);
      self.findingGameMenu.show(400);

      $('#cancel-game').bind('click', function () {
        networking.quitGame();
        self.showFindingGameMenu(false);
      });
    } else {
      self.mainMenu.show(400);
      self.findingGameMenu.hide(400);
      $('#cancel-game').unbind();
    }
  };

  this.doStartGameAnimations = function(callback) {
    self.showMenu(false);

    setTimeout(function() {
      showCountdownTimer(1, function () {
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

    var fs = $('#full-screen');
    var menu = $('#menu-container');

    if (show) {
      $('#single-player-easy').bind('click', function() {
        doStartSinglePlayerGame(APP.Difficulty.Easy);
      });
      $('#single-player-hard').bind('click', function() {
        doStartSinglePlayerGame(APP.Difficulty.Hard);
      });
      $('#multi-player').bind('click', function() {
        networking.findGame();
        self.showFindingGameMenu(true);
      });
      $('#nickname-input-button').bind('click', function() {
        var nickname = $('#nickname-input').val().trim();
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

    menu.bind('oanimationend animationend webkitAnimationEnd', function() {
      if (!show) {
        $('.button').unbind();
      }
      $('#menu-container').unbind();
    });
  };

  this.fpsSamples = [];
  this.latencySamples = [];

  this.update();

  this.audioToggleButton.bind('click', function() {
    console.log('Clicked on audio toggle button');

    self.audioToggleButton.toggleClass('nosound', APP.Model.enableAudio);

    //TODO why is APP.Model.enableAudio undefined here?
    console.log('APP.Model.enableAudio when calling', APP.Model.enableAudio);
    audio.enableAudio(!APP.Model.enableAudio);
  });

  setInterval(this.updateStats.bind(this), 1000);
};
APP.Ui.constructor = APP.Ui;
