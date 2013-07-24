(function(window, document, $, undefined) {
	"use strict";

	// Constructor
	var TinySlider = $.TinySlider = function(element, options) {
		// Attach element to the 'this' keyword
		this.element = element;
		this.$element = $(element);

		// options
		var meta_data = [];
		$.each(this.$element.data(), function(k, v) {
			var re = new RegExp("^tinyslider", "i");
			if (re.test(k)) {
				meta_data[k.toLowerCase().replace(re, '')] = v;
			}
		});
		this.options = $.extend(true, {}, TinySlider.defaults, options, meta_data);

		// Namespacing
		var namespace = this.options.namespace;

		// Class
		this.classes = {};
		this.classes.activeSlide = namespace + '-slide-active';
		this.classes.activePager = namespace + '-pager-active';

		this.$element.addClass(namespace + '-container');
		this.$ul = this.$element.children('ul');
		this.$viewport = this.$ul.wrap('<div class="' + namespace + '-viewport" />').parent();
		this.$slides = this.$ul.children();

		var self = this;
		$.extend(self, {
			init: function() {
				if (self.options.pager) {
					this.pager.setup();
				}
				if (self.options.nav) {
					this.nav.setup();
				}

				// Random order
				if (self.options.random) {
					self.$slides.sort(function() {
						return (Math.round(Math.random()) - 0.5);
					});
					self.$ul.empty().append(self.$slides);
				}

				// Set up animation
				self.animations[self.options.animation].setup();
				self.$viewport.attr('data-animation', self.options.animation);
				self.$viewport.on('go', function(e, data) {
					e.stopPropagation();

					self.$viewport.trigger('animation_start', {
						current: self.current,
						index: data.index
					});

					self.animations[self.options.animation].run(data);
				});


				// Active the first slide
				self.current = 0;
				self.wait = null;
				self.cycle = false;
				self.sliding = false;
				self.active(self.current);

				// Fire start event
				self.options.start.call(self);

				// Auto start
				if (self.options.autoplay) {
					self.autoplay.enabled = true;
					self.autoplay.start();
				}

				// Pause When hover the viewport
				if (self.options.pauseOnHover) {
					self.$viewport.hover(function() {
						if (self.autoplay.enabled) {
							self.pause();
						}
					}, function() {
						if (self.autoplay.enabled) {
							self.play();
						}
					});
				}

				// Touch
				if (self.options.touch) {
					self.touch.setup();
				}

				// Bind logic
				self.$viewport.on('animation_start', function(e, data) {
					e.stopPropagation();

					self.sliding = true;

					// Fire before event
					self.options.before.call(self, data);
				});

				self.$viewport.on('animation_end', function(e, data) {
					e.stopPropagation();

					self.sliding = false;
					self.current = data.index;
					self.active(data.index);

					// Fire after event
					self.options.after.call(self, data);

					if (self.wait) {
						self.goTo(self.wait);
					} else if (self.autoplay.enabled) {
						self.autoplay.start();
					}
				});
			},
			autoplay: {
				enabled: false,
				timeout: null,
				start: function() {
					if (self.autoplay.timeout) {
						clearTimeout(self.autoplay.timeout);
					}
					self.autoplay.timeout = setTimeout(function() {
						self.go();
					}, self.options.delay);
				},
				stop: function() {
					clearTimeout(self.autoplay.timeout);
				}
			},
			active: function(i) {
				self.$slides.removeClass(self.classes.activeSlide).eq(i).addClass(self.classes.activeSlide);
			},
			pager: {
				setup: function() {
					self.$pager = $('<ul class="' + namespace + '-pager" />');

					var itemMarkup = [];
					self.$slides.each(function(i) {
						var n = i + 1;
						itemMarkup += "<li>" + "<a href='#'>" + n + "</a>" + "</li>";
					});
					self.$pager.append(itemMarkup);
					self.$pager.appendTo(self.$element);

					self.pager.$items = self.$pager.children();
					self.pager.bind();
				},
				bind: function() {
					self.$viewport.on('go', function(e, data) {
						self.pager.active(data.index);
					});
					self.$pager.delegate('li', "click", function() {
						self.goTo($(this).index());
						return false;
					});
				},
				active: function(i) {
					self.pager.$items.removeClass(self.classes.activePager).eq(i).addClass(self.classes.activePager);
				}
			},
			nav: {
				setup: function() {
					self.$nav = $('<div class="' + namespace + '-nav">' + '<a href="#" class="' + namespace + '-nav-prev">' + self.options.prevText +
						'</a>' + '<a href="#" class="' + namespace + '-nav-next">' + self.options.nextText + '</a>' + '</div>');

					self.$nav.appendTo(self.$element);
					self.$nav.delegate('a', "click", function() {
						if ($(this).is('.' + namespace + '-nav-prev')) {
							self.prev();
						} else {
							self.next();
						}
						return false;
					});
				}
			},
			animations: {
				fade: {
					setup: function() {},
					run: function(data) {
						self.$slides.eq(self.current).fadeOut(self.options.duration, self.options.easing);
						self.$slides.eq(data.index).fadeIn(self.options.duration, self.options.easing, function() {
							self.$viewport.trigger('animation_end', {
								index: data.index
							});
						});
					}
				},
				slide: {
					setup: function() {
						var width = self.$viewport.width();
						self.$slides.width(width);
						self.$ul.width(100 * self.$slides.length + '%');

						$(window).on('resize', function() {
							var width = self.$viewport.width();
							self.$slides.width(width);
						});
					},
					run: function(data) {
						if (!self.cycle) {
							self.$ul.animate({
								marginLeft: '-' + data.index * 100 + '%'
							}, self.options.duration, self.options.easing, function() {
								self.$viewport.trigger('animation_end', {
									index: data.index
								});
							});
						} else {
							self.$ul.attr('data-cycle', self.cycle);
							self.$slides.eq(data.index).css('display', 'block');
							self.$ul.width('200%');

							if (self.cycle === 'prev') {
								self.$ul.css('marginLeft', '-100%').animate({
									marginLeft: null
								}, self.options.duration, self.options.easing, function() {
									self.$ul.attr('data-cycle', null);
									self.$slides.eq(data.index).css('display', null);
									self.$ul.css({
										width: 100 * self.$slides.length + '%',
										marginLeft: '-' + data.index * 100 + '%'
									});
									self.cycle = false;
									self.$viewport.trigger('animation_end', {
										index: data.index
									});
								});
							} else {
								self.$ul.css('marginLeft', '0').animate({
									marginLeft: '-100%'
								}, self.options.duration, self.options.easing, function() {
									self.$ul.attr('data-cycle', null);
									self.$slides.eq(data.index).css('display', null);
									self.$ul.css({
										width: 100 * self.$slides.length + '%',
										marginLeft: '-' + data.index * 100 + '%'
									});
									self.cycle = false;
									self.$viewport.trigger('animation_end', {
										index: data.index
									});
								});
							}
						}
					}
				}
			},
			touch: {
				setup: function() {
					if (!(("ontouchstart" in window) || window.DocumentTouch && document instanceof DocumentTouch)) {
						return;
					}

					self.$viewport.on('touchstart', function(e) {
						if (self.sliding) {
							e.preventDefault();
						}

						var touch = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
						var startX = touch.pageX;

						self.$viewport.on('touchmove', function(e) {
							e.preventDefault();

							touch = e.originalEvent.touches ? e.originalEvent.touches[0] : e;

							if (touch.pageX - startX > 75) {
								self.$viewport.off('touchmove');
								self.prev();
							} else if (touch.pageX - startX < -75) {
								self.$viewport.off('touchmove');
								self.next();
							}
						}).on('touchend', function() {
							self.$viewport.off('touchmove');
						});

						return false;
					});
				}
			}
		});

		self.init();
	};


	// Default options for the plugin as a simple object
	TinySlider.defaults = {
		namespace: 'tiny', // String: Prefix string attached to the class of every element generated by the plugin

		animation: "fade", // String: Select your animation type, "fade" or "slide"
		easing: "swing",
		duration: 1000, // Integer: Duration of the transition, in milliseconds
		delay: 4000, // Integer: Time between slide transitions, in milliseconds

		pager: true, // Boolean: Show pager, true or false
		nav: true, // Boolean: Show navigation, true or false
		prevText: "Previous", // String: Text for the "previous" button
		nextText: "Next", // String: Text for the "next" button

		random: false, // Boolean: Randomize the order of the slides, true or false
		autoplay: true, // Boolean: Animate automatically, true or false
		pauseOnHover: true, // Boolean: Pause the slideshow when hovering over slider

		/*useCSS: true,*/
		touch: true,

		// Callback API
		start: function() {}, // Callback: function(slider) - Fires when the slider loads the first slide
		before: function() {}, // Callback: function(slider) - Fires asynchronously with each slider animation
		after: function() {}, // Callback: function(slider) - Fires after each slider animation completes
		end: function() {} // Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
	};

	TinySlider.prototype = {
		constructor: TinySlider,
		// This is a public function that users can call
		// Prototype methods are shared across all elements
		play: function() {
			this.autoplay.enabled = true;
			this.autoplay.start();
		},
		pause: function() {
			this.autoplay.stop();
		},
		stop: function() {
			this.autoplay.enabled = false;
			this.autoplay.stop();
		},
		next: function() {
			var next = this.current + 1;
			if (next >= this.$slides.length) {
				next = 0;
				this.cycle = 'next';
			}
			this.goTo(next);
		},
		prev: function() {
			var prev = this.current - 1;
			if (prev < 0) {
				prev = this.$slides.length - 1;
				this.cycle = 'prev';
			}
			this.goTo(prev);
		},
		go: function() {
			var next = this.current + 1 >= this.$slides.length ? 0 : this.current + 1;
			this.goTo(next);
		},
		goTo: function(index) {
			if (this.current === index) {
				return false;
			}
			if (this.sliding) {
				this.wait = index;
			} else {
				this.wait = null;
				this.$viewport.trigger('go', {
					index: index
				});
			}
		}
	};

	// Collection method.
	$.fn.tinySlider = function(options) {
		if (typeof options === 'string') {
			var method = options;
			var method_arguments = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : undefined;

			return this.each(function() {
				var api = $.data(this, 'tinyslider');
				if (typeof api[method] === 'function') {
					api[method].apply(api, method_arguments);
				}
			});
		} else {
			return this.each(function() {
				if (!$.data(this, 'tinyslider')) {
					$.data(this, 'tinyslider', new TinySlider(this, options));
				}
			});
		}
	};
}(window, document, jQuery));
