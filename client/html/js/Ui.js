// Define namespace
var APP = APP || {};

APP.Ui = function() {
  this.displayFadingLargeText = function(text) {
    // Delete existing large-text node(s)
    var largeTextContainer = $('#large-text-container');
    largeTextContainer.empty();

    // Create a new large-text node
    var largeText = $(document.createElement('div'));
    largeText.attr('id', 'large-text').text(text);
    largeTextContainer.append(largeText);

    // Animate it out after a small delay
    setTimeout(function() {
      largeText.addClass('animate');
    }, 750);
  };
};
APP.Ui.constructor = APP.Ui;
