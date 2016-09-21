// Define namespace
var APP = APP || {};

APP.Ui = function() {
  this.displayFadingLargeText = function(text, fadeOutDelay) {
    // Delete existing large-text node(s)
    var largeTextContainer = $('#large-text-container');
    largeTextContainer.empty();

    // Create a new large-text node
    var largeText = $(document.createElement('div'));
    largeText.attr('id', 'large-text').text(text);
    largeTextContainer.append(largeText);

    // Animate it out
    fadeOutDelay = fadeOutDelay || 500;

    setTimeout(function() {
      largeText.addClass('animate');
    }, fadeOutDelay);
  };

  this.update = function() {
    var text = this.score.me + " - " + this.score.opponent;
    $('#score-container').text(text);
  };

  this.score = {me: 0, opponent: 0};
  this.update();
};
APP.Ui.constructor = APP.Ui;
