/*! TinySlider - v0.1.0 - 2012-11-26
* https://github.com/KaptinLin/tinySlider
* Copyright (c) 2012 KaptinLin; Licensed GPL */

(function($) {

  // Collection method.
  $.fn.awesome = function() {
    return this.each(function() {
      $(this).html('awesome');
    });
  };

  // Static method.
  $.awesome = function() {
    return 'awesome';
  };

  // Custom selector.
  $.expr[':'].awesome = function(elem) {
    return elem.textContent.indexOf('awesome') >= 0;
  };

}(jQuery));
