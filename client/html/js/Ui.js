// Define namespace
var APP = APP || {};

APP.Ui = function() {
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
    var text = APP.Model.score.me + " - " + APP.Model.score.opponent;
    $('#score-container').text(text);
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

  this.showMenu = function(show) {
    var self = this;

    var doStartGame = function(mode, difficulty) {
      self.showMenu(false);

      setTimeout(function() {
        showCountdownTimer(3, function () {
          startGame(mode, difficulty);
        });
      }, 1000);
    };

    if (show) {
      // $('#menu-container').show();

      $('#single-player-easy').bind('click', function() {
        doStartGame(APP.GameMode.SinglePlayer, APP.Difficulty.Easy);
      });
      $('#score-container').hide();

      $('#full-screen').removeClass('animate-reverse');
      $('#full-screen').addClass('animate');
      $('#menu-container').removeClass('animate-reverse');
      $('#menu-container').addClass('animate');
      $('#menu-container').css('pointer-events', 'auto');
    } else {
      $('#score-container').show();

      $('#full-screen').removeClass('animate');
      $('#full-screen').addClass('animate-reverse');
      $('#menu-container').removeClass('animate');
      $('#menu-container').addClass('animate-reverse');
      $('#menu-container').css('pointer-events', 'none');
    }

    $('#menu-container').bind('oanimationend animationend webkitAnimationEnd', function() {
      if (!show) {
        $('.menu-button').unbind();
      }

      $('#menu-container').unbind();
    });
  };

  this.update();
};
APP.Ui.constructor = APP.Ui;
