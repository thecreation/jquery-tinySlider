/*
 * jQuery TinySlider
 * https://github.com/amazingsurge/jquery-tinySlider
 *
 * Copyright (c) 2015 amazingsurge
 * Licensed under the GPL license.
 */
(function(window, document, $, undefined) {
    "use strict";

    // Constructor
    var TinySlider = $.TinySlider = function(element, options) {
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
        this.classes = {
            activeSlide: namespace + '-slide_active',
            activePager: namespace + '-pager_active'
        };

        this.$element.addClass(namespace + '-container');
        this.$ul = this.$element.children('ul').addClass(namespace + '-items');
        this.$viewport = this.$ul.wrap('<div class="' + namespace + '-viewport" />').parent();
        this.$slides = this.$ul.children().addClass(namespace + '-item');

        var self = this;
        $.extend(self, {
            init: function() {
                self.current = 0;
                self.wait = null;
                self.cycle = false;
                self.isSliding = false;
                self.transition = self.transition();

                if (!self.transition.supported) {
                    self.options.useCSS = false;
                }
                if (self.options.useCSS) {
                    self.$element.addClass(namespace + '_css');
                    self.options.cycle = false;
                }

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
                self.$viewport.addClass(namespace + '_' + self.options.animation);
                self.$viewport.on('go', function(e, data) {
                    e.stopPropagation();

                    self.$viewport.trigger('animation_start', {
                        current: self.current,
                        index: data.index
                    });

                    self.animations[self.options.animation].run(data);
                    self.current = data.index;
                });

                // Active the first slide
                self.active(self.current);

                // Fire start event
                if (typeof self.options.onStart === 'function') {
                    self.options.onStart.call(self);
                }

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

                // Touch support
                if (self.options.touch) {
                    self.touch.setup();
                }

                // Bind logic
                self.$viewport.on('animation_start', function(e, data) {
                    e.stopPropagation();

                    self.isSliding = true;

                    // Fire before event
                    if (typeof self.options.onBefore === 'function') {
                        self.options.onBefore.call(self, data);
                    }
                });

                self.$viewport.on('animation_end', function(e, data) {
                    e.stopPropagation();
                    self.active(data.index);

                    // Fire after event
                    if (typeof self.options.onAfter === 'function') {
                        self.options.onAfter.call(self, data);
                    }
                    self.isSliding = false;
                    if (self.wait && data.index !== self.wait) {
                        self.goTo(self.wait);
                    } else if (self.autoplay.enabled) {
                        self.autoplay.start();
                    }
                });

                // Fire after event
                if (typeof self.options.onAfter === 'function') {
                    self.options.onAfter.call(self);
                }

                // Fire resize event
                if (typeof self.options.onResize === 'function') {
                    $(window).on('orientationchange.tinyslider resize.tinyslider', self.throttle(function() {
                        self.options.onResize.call(self);
                    }), 50);
                }
            },
            /**
             * throttle
             * @description Borrowed from Underscore.js
             */
            throttle: function(func, wait) {
                var _now = Date.now || function() {
                    return new Date().getTime();
                };
                var context, args, result;
                var timeout = null;
                var previous = 0;
                var later = function() {
                    previous = _now();
                    timeout = null;
                    result = func.apply(context, args);
                    context = args = null;
                };
                return function() {
                    var now = _now();
                    var remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0) {
                        clearTimeout(timeout);
                        timeout = null;
                        previous = now;
                        result = func.apply(context, args);
                        context = args = null;
                    } else if (!timeout) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };
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

                    // active first
                    self.pager.active(self.current);
                },
                bind: function() {
                    self.$viewport.on('animation_start', function(e, data) {
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
                        var $current = self.$slides.eq(self.current);
                        var $to = self.$slides.eq(data.index).css('display', 'block');

                        self.animate($current, {
                            opacity: 0
                        }, self.options.duration, self.options.easing, function() {
                            $current.css('opacity', '');
                        });
                        self.animate($to, {
                            'opacity': 1
                        }, self.options.duration, self.options.easing, function() {
                            $to.css({
                                'opacity': '',
                                'display': ''
                            });

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

                        $(window).on('orientationchange.tinyslider resize.tinyslider', self.throttle(function() {
                            var width = self.$viewport.width();
                            self.$slides.width(width);
                        }, 50));
                    },
                    run: function(data) {
                        var duration = self.options.duration;
                        if (data.jump) {
                            duration = Math.floor(duration / 3, 10);
                        }

                        if (!self.cycle) {
                            self.animate(self.$ul, {
                                marginLeft: '-' + data.index * 100 + '%'
                            }, duration, self.options.easing, function() {
                                self.$viewport.trigger('animation_end', {
                                    index: data.index
                                });
                            });
                        } else {
                            self.$ul.attr('data-cycle', self.cycle);
                            self.$slides.eq(data.index).css('display', 'block');
                            self.$ul.width('200%');
                            if (self.cycle === 'prev') {
                                self.$ul.css('marginLeft', '-100%');
                                self.animate(self.$ul, {
                                    marginLeft: ''
                                }, duration, self.options.easing, function() {
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
                                self.$ul.css('marginLeft', '0');
                                self.animate(self.$ul, {
                                    marginLeft: '-100%'
                                }, duration, self.options.easing, function() {
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
            animate: function($el, properties, duration, easing, callback) {
                if (self.options.useCSS) {
                    self.insertRule('.duration_' + duration + ' {' + self.transition.prefix + 'transition-duration:' + duration + 'ms;}');

                    $el.addClass('duration_' + duration + ' easing_' + easing).one(self.transition.end, function() {
                        $el.removeClass('duration_' + duration + ' easing_' + easing);

                        callback.call(this);
                    });
                    window.setTimeout(function() {
                        $el.css(properties);
                    }, 10);
                } else {
                    $el.animate(properties, duration, easing, callback);
                }
            },
            transition: function() {
                var e,
                    end,
                    prefix = '',
                    supported = false,
                    el = document.createElement("fakeelement"),
                    transitions = {
                        "WebkitTransition": "webkitTransitionEnd",
                        "MozTransition": "transitionend",
                        "OTransition": "otransitionend",
                        "transition": "transitionend"
                    };

                for (e in transitions) {
                    if (el.style[e] !== undefined) {
                        end = transitions[e];
                        supported = true;
                        break;
                    }
                }

                if (/(WebKit)/i.test(window.navigator.userAgent)) {
                    prefix = '-webkit-';
                }

                return {
                    prefix: prefix,
                    end: end,
                    supported: supported
                };
            },
            insertRule: function(rule) {
                if (self.rules && self.rules[rule]) {
                    return;
                } else {
                    if (self.rules === undefined) {
                        self.rules = {};
                    }
                    self.rules[rule] = true;
                }

                if (document.styleSheets && document.styleSheets.length) {
                    document.styleSheets[0].insertRule(rule, 0);
                } else {
                    var style = document.createElement('style');
                    style.innerHTML = rule;
                    document.head.appendChild(style);
                }
            },
            touch: {
                supported: (("ontouchstart" in window) || window.DocumentTouch && document instanceof DocumentTouch),
                eventType: function(action) {
                    var eventTypes = {
                        start: (this.supported ? 'touchstart' : 'mousedown'),
                        move: (this.supported ? 'touchmove' : 'mousemove'),
                        end: (this.supported ? 'touchend' : 'mouseup'),
                        cancel: (this.supported ? 'touchcancel' : 'mouseout')
                    };
                    return eventTypes[action];
                },
                setup: function() {
                    self.$viewport.on(this.eventType('start'), $.proxy(this.startTouch, this));

                    self.$slides.find('a').on(this.eventType('start'), function(e) {
                        this.timeStamp = e.timeStamp;
                    }).on('click', function(e) {
                        if (this.timeStamp && (e.timeStamp - this.timeStamp > 400)) {
                            e.preventDefault(); // prevent Click
                        }
                    });
                },
                getEvent: function(event) {
                    var e = event.originalEvent;
                    if (self.touch.supported && e.touches.length && e.touches[0]) {
                        e = e.touches[0];
                    }
                    return e;
                },
                startTouch: function(e) {
                    //e.preventDefault();

                    if (self.isSliding) {
                        return false;
                    }
                    var event = this.getEvent(e);

                    this.data = {};
                    this.data.start = event.pageX;
                    this.width = self.$viewport.width();

                    $(document).on(this.eventType('move'), $.proxy(this.moving, this))
                        .on(this.eventType('end'), $.proxy(this.endTouch, this));

                    //return false;
                },
                moving: function(e) {
                    //e.preventDefault();

                    var event = this.getEvent(e);

                    this.data.distance = (event.pageX || this.data.start) - this.data.start;

                    if (self.options.animation === 'fade') {
                        if (this.data.distance / this.width > self.options.touchSensitivity) {
                            self.next();

                            $(document).off(this.eventType('move'));
                        } else if (this.data.distance / this.width < -self.options.touchSensitivity) {
                            self.prev();

                            $(document).off(this.eventType('move'));
                        }
                    } else {
                        self.$ul.css({
                            marginLeft: -100 * self.current + (this.data.distance / this.width) * 100 + '%'
                        });
                    }

                    //return false;
                },
                endTouch: function(e) {
                    //e.preventDefault();

                    $(document).off(this.eventType('move'))
                        .off(this.eventType('end'));

                    if (self.options.animation === 'fade') {
                        return false;
                    }

                    var index = self.current - Math.round(this.data.distance / this.width);

                    if (index <= 0) {
                        index = 0;
                    } else if (index >= self.$slides.length - 1) {
                        index = self.$slides.length - 1;
                    }

                    self.jumpTo(index);

                    //return false;
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

        useCSS: true, // if use CSS transition, cycle will not works
        touch: true,
        touchSensitivity: 0.25,

        // Callback API
        onStart: null, // Callback: function(slider) - Fires when the slider loads the first slide
        onBefore: null, // Callback: function(slider) - Fires asynchronously with each slider animation
        onAfter: null, // Callback: function(slider) - Fires after each slider animation completes
        onResize: null // Callback: function(slider) - Fires when resize
    };

    TinySlider.prototype = {
        constructor: TinySlider,
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
                if (this.options.cycle) {
                    this.cycle = 'next';
                }
            }
            this.goTo(next);
        },
        prev: function() {
            var prev = this.current - 1;
            if (prev < 0) {
                prev = this.$slides.length - 1;
                if (this.options.cycle) {
                    this.cycle = 'prev';
                }
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
            if (this.isSliding) {
                this.wait = index;
            } else {
                this.wait = null;
                this.$viewport.trigger('go', {
                    index: index
                });
            }
        },
        jumpTo: function(index) {
            this.$viewport.trigger('go', {
                index: index,
                jump: true
            });
        }
    };

    // Collection method.
    $.fn.tinySlider = function(options) {
        if (typeof options === 'string') {
            var method = options;
            var method_arguments = Array.prototype.slice.call(arguments, 1);

            return this.each(function() {
                var api = $.data(this, 'tinyslider');
                if (typeof api[method] === 'function') {
                    api[method].apply(api, method_arguments);
                } else {
                    throw new Error("Method " + method + " does not exist.");
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
