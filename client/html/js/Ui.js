// Define namespace
var APP = APP || {};

APP.Ui = function(networking) {
  var self = this;

  this.mainMenu = $('#main-menu');
  this.findingGameMenu = $('#looking-for-game-menu');
  this.findingGameMenu.hide();
  // this.mainMenuVisible = true;

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

  this.showMenu = function(show) {
    var doStartGame = function(mode, difficulty) {
      self.showMenu(false);

      setTimeout(function() {
        showCountdownTimer(1, function () {
          startGame(mode, difficulty);
        });
      }, 1000);
    };

    var fs = $('#full-screen');
    var menu = $('#menu-container');

    if (show) {
      $('#single-player-easy').bind('click', function() {
        doStartGame(APP.GameMode.SinglePlayer, APP.Difficulty.Easy);
      });
      $('#single-player-hard').bind('click', function() {
        doStartGame(APP.GameMode.SinglePlayer, APP.Difficulty.Hard);
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

  this.update();
};
APP.Ui.constructor = APP.Ui;
