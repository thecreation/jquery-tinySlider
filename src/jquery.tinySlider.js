/*! TinySlider - v0.1.0 - 2012-11-26
 * https://github.com/KaptinLin/tinySlider
 * Copyright (c) 2012 KaptinLin; Licensed GPL */

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
        this.classes.activeSlide = this.options.namespace + '-slide-active';
        this.classes.activePager = this.options.namespace + '-pager-active';

        this.$element.addClass(namespace + '-container');
        this.$viewport = this.$element.children('ul').addClass(namespace + '-viewport');
        this.$slides = this.$viewport.children();

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
                    self.$viewport.empty().append(self.$slides);
                }

                // Add animation attr for css styling
                self.$viewport.attr('data-animation', self.options.animation);
                self.$viewport.on('go', self.animations[self.options.animation]);

                // Active the first slide
                self.current = 0;
                self.active(self.current);

                // Auto start
                if (self.options.autoplay) {
                    self.autoplay.enabled = true;
                    self.autoplay.start();
                }

                // Bind logic
                self.$viewport.on('animation_end', function(e, data) {
                    e.stopPropagation();

                    self.current = data.index;
                    self.active(data.index);

                    if (self.autoplay.enabled) {
                        self.autoplay.start();
                    }
                });
            },
            autoplay: {
                enabled: false,
                start: function() {
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
                    });
                },
                active: function(i) {
                    self.pager.$items.removeClass(self.classes.activePager).eq(i).addClass(self.classes.activePager);
                }
            },
            nav: {
                setup: function() {
                    self.$nav = $('<div class="' + namespace + '-nav">' + '<a href="#" class="' + namespace + '-nav-prev">' + self.options.prevText + '</a>' + '<a href="#" class="' + namespace + '-nav-next">' + self.options.nextText + '</a>' + '</div>');

                    self.$nav.appendTo(self.$element);

                    self.$nav.delegate('a', "click", function() {
                        if ($(this).is(namespace + '-nav-prev')) {
                            self.next();
                        } else {
                            self.prev();
                        }
                    });
                }
            },
            animations: {
                fade: function(e, data) {
                    e.stopPropagation();

                    self.$viewport.trigger('animation_start', {
                        current: self.current,
                        index: data.index
                    });
                    self.$slides.eq(self.current).fadeOut(self.options.duration, self.options.easing);
                    self.$slides.eq(data.index).fadeIn(self.options.duration, self.options.easing, function() {
                        self.$viewport.trigger('animation_end', {
                            index: data.index
                        });
                    });
                },
                slide: function() {

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

        pager: false, // Boolean: Show pager, true or false
        nav: false, // Boolean: Show navigation, true or false
        prevText: "Previous", // String: Text for the "previous" button
        nextText: "Next", // String: Text for the "next" button

        random: false, // Boolean: Randomize the order of the slides, true or false
        autoplay: true, // Boolean: Animate automatically, true or false
        pauseOnHover: true, // Boolean: Pause the slideshow when hovering over slider

        useCSS: true,
        touch: true,

        // Callback API
        start: function() {}, // Callback: function(slider) - Fires when the slider loads the first slide
        before: function() {}, // Callback: function(slider) - Fires asynchronously with each slider animation
        after: function() {}, // Callback: function(slider) - Fires after each slider animation completes
        end: function() {}, // Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
        added: function() {}, // Callback: function(slider) - Fires after a slide is added
        removed: function() {} // Callback: function(slider) - Fires after a slide is removed
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
            var next = this.current + 1 >= this.$slides.length ? 0 : this.current + 1;
            this.goTo(next);
        },
        prev: function() {
            var prev = this.current - 1 < 0 ? this.$slides.length - 1 : this.current - 1;
            this.goTo(prev);
        },
        go: function() {
            var next = this.current + 1 >= this.$slides.length ? 0 : this.current + 1;
            this.goTo(next);
        },
        goTo: function(index) {
            this.$viewport.trigger('go', {
                index: index
            });
        },
        update: function() {

        },
        destroy: function() {

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