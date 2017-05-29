(function () {
  var Smartbox,
    _ready = false,
    readyCallbacks = [],
    userAgent = navigator.userAgent.toLowerCase(),
    SmartboxAPI;

  //private func for applying all ready callbacks
  var onReady = function () {
    _ready = true;

    for ( var i = 0, len = readyCallbacks.length; i < len; i++ ) {
      if (typeof readyCallbacks[i] === 'function') {
        readyCallbacks[i].call(this);
      }
    }
    // no need anymore
    readyCallbacks = null;
  };

  /**
   * Detecting current platform
   * @returns {boolean} true if running on current platform
   */
  function detect ( slug ) {
    return userAgent.indexOf(slug) !== -1;
  }

  var initialise = function() {
    Smartbox.setPlugins();
    Smartbox.getDUID();

    // wait for calling others $()
    setTimeout(function () {
      onReady();
      onReady = null;
    }, 10);
  };

  Smartbox = function ( platform, cb ) {
    if ( typeof platform === 'string' ) {
      Smartbox.readyForPlatform(platform, cb);
    } else if ( typeof platform === 'function' ) {
      // first arg - function
      Smartbox.ready(platform);
    }
  };

  //public smartbox API
  SmartboxAPI = {
    version: 0.1,
    platformName: '',

    userAgent: userAgent,

    createPlatform: function ( platformName, platformApi ) {
      var isCurrent = platformApi.detect && platformApi.detect();

      if ( isCurrent || detect(platformApi.platformUserAgent) ) {
        this.platformName = platformName;
        _.extend(this, platformApi);

        if (typeof platformApi.onDetect === 'function') {
          this.onDetect();
        }
      }
    },

    // calling cb after library initialise
    ready: function ( cb ) {
      if ( _ready ) {
        cb.call(this);
      } else {
        readyCallbacks.push(cb);
      }
    },

    // calling cb after library initialise if platform is current
    readyForPlatform: function ( platform, cb ) {
      var self = this;
      this.ready(function () {
        if ( platform == self.platformName ) {
          cb.call(self);
        }
      });
    },

    utils: {

      /**
       * Show error message
       * @param msg
       */
      /*error: function ( msg ) {
        $$log(msg, 'error');
      },*/

      /**
       * Show messages in log
       * all functionality in main.js
       */
      log: {
        log: $.noop,
        state: $.noop,
        show: $.noop,
        hide: $.noop,
        startProfile: $.noop,
        stopProfile: $.noop
      },

      /**
       * Asynchroniosly adding javascript files
       * @param filesArray {Array} array of sources of javascript files
       * @param cb {Function} callback on load javascript files
       */
      addExternalJS: function ( filesArray, cb ) {
        var $externalJsContainer,
          loadedScripts = 0,
          len = filesArray.length,
          el,
          scriptEl;

        function onloadScript () {
          loadedScripts++;

          if ( loadedScripts === len ) {
            cb && cb.call();
          }
        }

        if ( filesArray.length ) {

          $externalJsContainer = document.createDocumentFragment();
          el = document.createElement('script');
          el.type = 'text/javascript';
          el.onload = onloadScript;

          for ( var i = 0; i < len; i++ ) {
            scriptEl = el.cloneNode();
            scriptEl.src = filesArray[i];
            $externalJsContainer.appendChild(scriptEl);
          }

          document.body.appendChild($externalJsContainer);
        } else {

          // if no external js simple call cb
          cb && cb.call(this);
        }
      },

      addExternalCss: function ( filesArray ) {
        var $externalCssContainer;

        if ( filesArray.length ) {
          $externalCssContainer = document.createDocumentFragment();
          _.each(filesArray, function ( src ) {

            var el = document.createElement('link');

            el.rel = 'stylesheet';
            el.href = src;

            $externalCssContainer.appendChild(el);
          });

          document.body.appendChild($externalCssContainer);
        }
      },

      addExternalFiles: function ( cb ) {
        if ( this.externalJs.length ) {
          this.addExternalJS(this.externalJs, cb);
        }
        if ( this.externalCss.length ) {
          this.addExternalCss(this.externalCss);
        }
      }
    }
  };

  Smartbox.config = {
    DUID: 'real'
  };

  _.extend(Smartbox, SmartboxAPI);

  // exporting library to global
  window.SB = Smartbox;

  // initialize library
  window.onload = function () {
    initialise();

    // we don't need initialise func anymore
    initialise = null;
  };
})();

// global SB
!(function ( window, undefined ) {

  var PlatformApi = {
    externalCss: [],
    externalJs: [],
    keys: {},

    DUID: '',

    platformUserAgent: 'not found',

    /**
     * Get DUID in case of Config
     * @return {string} DUID
     */
    getDUID: function () {
      switch ( SB.config.DUID ) {
        case 'real':
          this.DUID = this.getNativeDUID();
          break;
        case 'mac':
          this.DUID = this.getMac();
          break;
        case 'random':
          this.DUID = this.getRandomDUID();
          break;
        /*case 'local_random':
         this.DUID = this.getLocalRandomDUID();
         break;*/
        default:
          this.DUID = Config.DUIDSettings;
          break;
      }

      return this.DUID;
    },

    getSDI: function () {
      return '';
    },

    /**
     * Returns random DUID for platform
     * @returns {string}
     */
    getRandomDUID: function () {
      return (new Date()).getTime().toString(16) + Math.floor(Math.random() * parseInt("10000", 16)).toString(16);
    },

    /**
     * Returns MAC for platform if exist
     * @returns {string}
     */
    getMac: function () {
      return '';
    },

    /**
     * Returns native DUID for platform if exist
     * @returns {string}
     */
    getNativeDUID: function () {
      return '';
    },

    /**
     * Set custom plugins for platform
     */
    setPlugins: $.noop,

    // TODO: volume for all platforms
    volumeUp: $.noop,
    volumeDown: $.noop,
    getVolume: $.noop,
    exit: $.noop,
    sendReturn: $.noop,
    setData: function ( name, val ) {
      // save data in string format
      localStorage.setItem(name, JSON.stringify(val));
    },

    getData: function ( name ) {
      var result;
      try {
        result = JSON.parse(localStorage.getItem(name));
      } catch (e) {
      }

      return result;
    },

    removeData: function ( name ) {
      localStorage.removeItem(name);
    }
  };

  _.extend(SB, PlatformApi);
})(this);

!(function ( window, undefined ) {

  var $body = null,
    nav, invertedKeys = {};

  SB.ready(function () {
    var keys = SB.keys;
    for (var key in keys) {
      invertedKeys[keys[key]] = key.toLowerCase();
    }
  });

  function Navigation () {


    // for methods save и restore
    var savedNavs = [],

    // object for store throttled color keys  methods
      throttledMethods = {},

    // current el in focus
      navCur = null,

    // arrays
      numsKeys = ['n0', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9'],
      colorKeys = ['green', 'red', 'yellow', 'blue'],

    // pause counter
      paused = 0;

    function onKeyDown ( e ) {
      var key,
        data = {},
        keyCode = e.keyCode;

      if ( paused || !navCur ) {
        return;
      }

      key = invertedKeys[keyCode];
      if ( key ) {
        if ( colorKeys.indexOf(key) > -1 ) {
          throttleEvent(key);
        } else {
          if ( numsKeys.indexOf(key) > -1 ) {
            data.num = key[1];
            key = 'num';
          }

          triggerKeyEvent(key, data);
        }
      }
    }

    /**
     * 'nav_key:' event trigger
     * @param key key name
     * @param data event data
     */
    function triggerKeyEvent ( key, data ) {
      var ev,
        commonEvent;
      if ( navCur ) {
        ev = $.Event("nav_key:" + key, data || {});
        commonEvent = $.Event("nav_key");

        ev.keyName = key;
        commonEvent.keyName = key;
        navCur.trigger(ev);
        //первый trigger мог уже сменить текщий элемент
        navCur && navCur.trigger(commonEvent);
      }
    }

    function throttleEvent ( key ) {
      var keyMethod = throttledMethods[key];

      // lazy init
      if ( !keyMethod ) {
        keyMethod = throttledMethods[key] = _.throttle(function () {
          triggerKeyEvent(key);
        }, 800, {
          leading: true
        });
      }

      keyMethod(key);
    }

    /**
     * trigger click on current element
     */
    function onClick () {
      navCur && navCur.click();
    }

    return {

      // nav els selector
      area_selector: '.nav-item',

      /**
       * Current el class
       * @type {string}
       */
      //higlight_class: 'focus',

      /**
       * navigation container
       * @type {jQuery}
       */
      $container: null,

      /**
       * Current looping type
       * false/hbox/vbox
       * @type {boolean|string}
       */
      loopType: null,

      /**
       * Phantom els selector
       * @type {string}
       */
      phantom_selector: '[data-nav-phantom]',

      /**
       * Returns current navigation state
       * @returns {boolean}
       */
      isPaused: function () {
        return !!paused;
      },

      /**
       * Stop navigation. Increase pause counter
       * @returns {Navigation}
       */
      pause: function () {
        paused++;
        return this;
      },

      /**
       * Resume navigation if force or pause counter is zero
       * @param force {Boolean} force navigation resume
       * @returns {Navigation}
       */
      resume: function ( force ) {
        paused--;
        if ( paused < 0 || force ) {
          paused = 0;
        }
        return this;
      },

      /**
       * Save current navigation state
       * @returns {Navigation}
       */
      save: function () {

        savedNavs.push({
          navCur: navCur,
          area_selector: this.area_selector,
          //higlight_class: this.higlight_class,
          $container: this.$container
        });
        return this;
      },

      /**
       * Restore navigation state
       * @returns {Navigation}
       */
      restore: function () {
        if ( savedNavs.length ) {
          this.off();
          var foo = savedNavs.pop();
          this.area_selector = foo.area_selector;
          //this.higlight_class = foo.higlight_class;
          this.on(foo.$container, foo.navCur);
        }

        return this;
      },

      /**
       * Setting focus on element
       * @param element {*} - HTMLElement, selector or Jquery object
       * @param originEvent {string} - event source(nav_key, mousemove, voice etc.)
       * @return {Navigation}
       */
      current: function ( element, originEvent ) {
        if ( !element ) {
          return navCur;
        }

        originEvent = originEvent || 'nav_key';

        var $el = $(element);
        if ( $el.is(this.phantom_selector) ) {
          $el = $($($el.attr('data-nav-phantom'))[0]);
        }
        if ( $el.length > 1 ) {
          throw new Error('Focused element must be only one!');
        }
        if ( !$el.length ) {
          return this;
        }
        var old = navCur;
        if ( navCur ) {
          navCur./*removeClass(this.higlight_class).*/trigger('nav_blur', [originEvent, $el]);
        }

        navCur = $el;

        $el./*addClass(this.higlight_class).*/trigger('nav_focus', [originEvent, old]);
        return this;
      },

      /**
       * Turn on navigation in container, turn off previous navigation
       * @param container - HTMLElement, selector or Jquery object (body by default)
       * @param cur - HTMLElement, selector or Jquery object(first nav el by default)
       * @return {Navigation}
       */
      on: function ( container, cur ) {

        var self = this,
          $navTypeEls;

        $body = $body || $(document.body);

        this.off();

        this.$container = container ? $(container) : $body;

        if ( SB.platform != 'philips' ) {
          this.$container.on('mouseenter.nav', this.area_selector, function ( e ) {
            if ( !$(this).is(self.phantom_selector) ) {
              self.current(this, 'mouseenter');
            }
          });
        }

        $navTypeEls = this.$container.find('[data-nav_type]');

        if ( this.$container.attr('data-nav_type') ) {
          $navTypeEls = $navTypeEls.add(this.$container);
        }

        $navTypeEls.each(function () {
          var $el = $(this);
          var navType = $el.attr("data-nav_type");
          $el.removeAttr('data-nav_type');
          //self.setLoop($el);
          var loop = $el.attr("data-nav_loop");

          self.siblingsTypeNav($el, navType, loop);
        });

        $body
          .bind('keydown.navigation', onKeyDown)
          .bind('nav_key:enter.navigation', onClick);

        if ( !cur ) {
          cur = this.$container.find(this.area_selector).filter(':visible')[0];
        }
        this.current(cur);
        return this;
      },

      siblingsTypeNav: function ( $container, type, loop ) {
        var self = this;
        $container.on('nav_key:left nav_key:right nav_key:up nav_key:down', this.area_selector,
          function ( e ) {
            var last = 'last',
              cur = self.current(),
              next,
              fn;

            //check if direction concur with declared
            if ( (type == 'hbox' && e.keyName == 'left') ||
                 (type == 'vbox' && e.keyName == 'up') ) {
              fn = 'prev';
            } else if ( (type == 'hbox' && e.keyName == 'right') ||
                        (type == 'vbox' && e.keyName == 'down') ) {
              fn = 'next';
            }

            if ( fn == 'next' ) {
              last = 'first';
            }

            if ( fn ) {
              next = cur[fn](self.area_selector);

              while ( next.length && !next.is(':visible') ) {
                next = next[fn](self.area_selector);
              }

              if ( !next.length && loop ) {
                next = $container.find(self.area_selector).filter(':visible')[last]();
              }

              if ( next.length ) {
                nav.current(next);
                return false;
              }
            }
          });
      },

      /**
       * Turn off navigation from container, disable navigation from current element
       * @return {Navigation}
       */
      off: function () {
        if ( navCur ) {
          navCur./*removeClass(this.higlight_class).*/trigger('nav_blur');
        }
        this.$container && this.$container.off('mouseenter.nav').off('.loop');
        $body.unbind('.navigation');
        navCur = null;
        return this;
      },

      /**
       * Find first nav el & set navigation on them
       */
      findSome: function () {
        var cur;

        if ( !(navCur && navCur.is(':visible')) ) {
          cur = this.$container.find(this.area_selector).filter(':visible').eq(0);
          this.current(cur);
        }

        return this;
      },

      /**
       * Find closest to $el element by dir direction
       * @param $el {jQuery} - source element
       * @param dir {string} - direction up, right, down, left
       * @param navs {jQuery} - object, contains elements to search
       * @returns {*}
       */
      findNav: function ( $el, dir, navs ) {
        var user_defined = this.checkUserDefined($el, dir);

        if ( user_defined ) {
          if (user_defined === 'none') {
            return false;
          } else {
            return user_defined;
          }
        }

        var objBounds = $el[0].getBoundingClientRect(),
          arr = [],
          curBounds = null,
          cond1, cond2, i , l;

        for ( i = 0, l = navs.length; i < l; i++ ) {
          curBounds = navs[i].getBoundingClientRect();

          if ( curBounds.left == objBounds.left &&
               curBounds.top == objBounds.top ) {
            continue;
          }

          switch ( dir ) {
            case 'left':
              cond1 = objBounds.left > curBounds.left;
              break;
            case 'right':
              cond1 = objBounds.right < curBounds.right;
              break;
            case 'up':
              cond1 = objBounds.top > curBounds.top;
              break;
            case 'down':
              cond1 = objBounds.bottom < curBounds.bottom;
              break;
            default:
              break;
          }

          if ( cond1 ) {
            arr.push({
              'obj': navs[i],
              'bounds': curBounds
            });
          }
        }

        var min_dy = 9999999, min_dx = 9999999, min_d = 9999999, max_intersection = 0;
        var dy = 0, dx = 0, d = 0;

        function isIntersects ( b1, b2, dir ) {
          var temp = null;
          switch ( dir ) {
            case 'left':
            case 'right':
              if ( b1.top > b2.top ) {
                temp = b2;
                b2 = b1;
                b1 = temp;
              }
              if ( b1.bottom > b2.top ) {
                if ( b1.top > b2.right ) {
                  return b2.top - b1.right;
                }
                else {
                  return b2.height;
                }
              }
              break;
            case 'up':
            case 'down':
              if ( b1.left > b2.left ) {
                temp = b2;
                b2 = b1;
                b1 = temp;
              }
              if ( b1.right > b2.left ) {
                if ( b1.left > b2.right ) {
                  return b2.left - b1.right;
                }
                else {
                  return b2.width;
                }
              }
              break;
            default:
              break;
          }
          return false;
        }

        var intersects_any = false;
        var found = false;

        for ( i = 0, l = arr.length; i < l; i++ ) {
          if ( !this.checkEntryPoint(arr[i].obj, dir) ) {
            continue;
          }

          var b = arr[i].bounds;
          var intersects = isIntersects(objBounds, b, dir);
          dy = Math.abs(b.top - objBounds.top);
          dx = Math.abs(b.left - objBounds.left);
          d = Math.sqrt(dy * dy + dx * dx);
          if ( intersects_any && !intersects ) {
            continue;
          }
          if ( intersects && !intersects_any ) {
            min_dy = dy;
            min_dx = dx;
            max_intersection = intersects;
            found = arr[i].obj;
            intersects_any = true;
            continue;
          }

          switch ( dir ) {
            case 'left':
            case 'right':
              if ( intersects_any ) {
                cond2 = dx < min_dx || (dx == min_dx && dy < min_dy);
              }
              else {
                cond2 = dy < min_dy || (dy == min_dy && dx < min_dx);
              }
              break;
            case 'up':
            case 'down':
              if ( intersects_any ) {
                cond2 = dy < min_dy || (dy == min_dy && dx < min_dx);
              }
              else {
                cond2 = dx < min_dx || (dx == min_dx && dy < min_dy);
              }
              break;
            default:
              break;
          }
          if ( cond2 ) {
            min_dy = dy;
            min_dx = dx;
            min_d = d;
            found = arr[i].obj;
          }
        }

        return found;
      },

      /**
       * Return element defied by user
       * Если юзером ничего не определено или направление равно 0, то возвращает false
       * Если направление определено как none, то переход по этому направлению запрещен
       *
       * @param $el - current element
       * @param dir - direction
       * @returns {*}
       */
      checkUserDefined: function ( $el, dir ) {
          var ep = $el.data('nav_ud'),
              result = false,
              res = $el.data('nav_ud_' + dir);
          if (!ep && !res) {
              return false;
          }

          if ( !res ) {
              var sides = ep.split(','),
                  dirs = ['up', 'right', 'down', 'left'];
              if(sides.length !== 4) {
                  return false;
              }

              $el.data({
                  'nav_ud_up': sides[0],
                  'nav_ud_right': sides[1],
                  'nav_ud_down': sides[2],
                  'nav_ud_left': sides[3]
              });

              res = sides[dirs.indexOf(dir)];
          }

          if ( res == 'none' ) {
              result = 'none';
          } else if( res == '0' ) {
              result = false;
          } else if ( res ) {
              result = $(res).first();
          }
          return result;
      },

      /**
       * Проверяет можно ли войти в элемент с определенной стороны.
       * Работает если у элемента задан атрибут data-nav_ep. Точки входа задаются в атрибуте с помощью 0 и 1 через запятые
       * 0 - входить нельзя
       * 1 - входить можно
       * Стороны указываются в порядке CSS - top, right, bottom, left
       *
       * data-nav_ep="0,0,0,0" - в элемент зайти нельзя, поведение такое же как у элемента не являющегося элементом навигации
       * data-nav_ep="1,1,1,1" - поведение по умолчанию, как без задания этого атрибута
       * data-nav_ep="0,1,0,0" - в элемент можно зайти справа
       * data-nav_ep="1,1,0,1" - в элемент нельзя зайти снизу
       * data-nav_ep="0,1,0,1" - можно зайти слева и справа, но нельзя сверху и снизу
       *
       * @param elem -  проверяемый элемент
       * @param dir - направление
       * @returns {boolean}
       */
      checkEntryPoint: function ( elem, dir ) {
        var $el = $(elem),
          ep = $el.attr('data-nav_ep'),
          res = null;

        if ( !ep ) {
          return true;
        }

        res = $el.attr('data-nav_ep_' + dir);

        if ( res === undefined ) {
          var sides = ep.split(',');
          $el.attr('data-nav_ep_top', sides[0]);
          $el.attr('data-nav_ep_right', sides[1]);
          $el.attr('data-nav_ep_bottom', sides[2]);
          $el.attr('data-nav_ep_left', sides[3]);
          res = $el.attr('data-nav_ep_' + dir);
        }

        return !!parseInt(res);
      }
    };
  }

  nav = window.$$nav = new Navigation();

  $(function () {
    // Navigation events handler
    $(document.body).bind('nav_key:left nav_key:right nav_key:up nav_key:down', function ( e ) {
      var cur = nav.current(),
        $navs,
        n;

      $navs = nav.$container.find(nav.area_selector).filter(':visible');
      n = nav.findNav(cur, e.keyName, $navs);
      n && nav.current(n);
    });
  });

})(this);

/**
 * Player plugin for smartbox
 */

(function (window) {

    var updateInterval, curAudio = 0;


    /**
     * emulates events after `play` method called
     * @private
     * @param self Player
     */
    var stub_play = function (self) {
        self.state = "play";
        updateInterval = setInterval(function () {
            self.trigger("update");
            self.videoInfo.currentTime += 0.5;
            if (self.videoInfo.currentTime >= self.videoInfo.duration) {
                self.stop();
                self.trigger("complete");
            }
        }, 500);
    }

    var inited = false;

    var Player = window.Player = {

        /**
         * Inserts player object to DOM and do some init work
         * @examples
         * Player._init(); // run it after SB.ready
         */
        _init: function () {

            //no need to do anything because just stub
        },
        /**
         * current player state ["play", "stop", "pause"]
         */
        state: 'stop',
        /**
         * Runs some video
         * @param {Object} options {url: "path", type: "hls", from: 0
         * }
         * @examples
         *
         * Player.play({
         * url: "movie.mp4"
         * }); // => runs video
         *
         * Player.play({
         * url: "movie.mp4"
         * from: 20
         * }); // => runs video from 20 second
         *
         * Player.play({
         * url: "stream.m3u8",
         * type: "hls"
         * }); // => runs stream
         */
        play: function (options) {
            if (!inited) {
                this._init();
                inited = true;
            }

            if (typeof options == "string") {
                options = {
                    url: options
                }
            }
            if (options !== undefined) {
                this.stop();
                this.state = 'play';
                this._play(options);
            } else if (options === undefined && this.state === 'pause') {
                this.resume();
            }
        },
        _play: function () {
            var self = this;

            setTimeout(function () {
                self.trigger("ready");
                setTimeout(function () {
                    self.trigger("bufferingBegin");
                    setTimeout(function () {
                        self.videoInfo.currentTime = 0;
                        self.trigger("bufferingEnd");
                        stub_play(self);
                    }, 1000);
                }, 1000);
            }, 1000);

        },
        /**
         * Stop video playback
         * @param {Boolean} silent   if flag is set, player will no trigger "stop" event
         * @examples
         *
         * Player.stop(); // stop video
         *
         * App.onDestroy(function(){
         *      Player.stop(true);
         * });  // stop player and avoid possible side effects
         */
        stop: function (silent) {
            if (this.state != 'stop') {
                this._stop();
                if (!silent) {
                    this.trigger('stop');
                }
            }
            this.state = 'stop';
        },
        /**
         * Pause playback
         * @examples
         * Player.pause(); //paused
         */
        pause: function () {
            this._stop();
            this.state = "pause";
        },
        /**
         * Resume playback
         * @examples
         * Player.pause(); //resumed
         */
        resume: function () {
            stub_play(this);
        },
        /**
         * Toggles pause/resume
         * @examples
         *
         * Player.togglePause(); // paused or resumed
         */
        togglePause: function () {
            if (this.state == "play") {
                this.pause();
            } else {
                this.resume();
            }
        },
        _stop: function () {
            clearInterval(updateInterval);
        },
        /**
         * Converts time in seconds to readable string in format H:MM:SS
         * @param {Number} seconds time to convert
         * @returns {String} result string
         * @examples
         * Player.formatTime(PLayer.videoInfo.duration); // => "1:30:27"
         */
        formatTime: function (seconds) {
            var hours = Math.floor(seconds / (60 * 60));
            var divisor_for_minutes = seconds % (60 * 60);
            var minutes = Math.floor(divisor_for_minutes / 60);
            var divisor_for_seconds = divisor_for_minutes % 60;
            var seconds = Math.ceil(divisor_for_seconds);
            if (seconds < 10) {
                seconds = "0" + seconds;
            }
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            return (hours ? hours + ':' : '') + minutes + ":" + seconds;
        },
        /**
         * Hash contains info about current video
         */
        videoInfo: {
            /**
             * Total video duration in seconds
             */
            duration: 0,
            /**
             * Video stream width in pixels
             */
            width: 0,
            /**
             * Video stream height in pixels
             */
            height: 0,
            /**
             * Current playback time in seconds
             */
            currentTime: 0
        },

        /**
         *
         * @param {Number} seconds time to seek
         * @examples
         * Player.seek(20); // seek to 20 seconds
         */
        seek: function (seconds) {
            var self = this;
            self.videoInfo.currentTime = seconds;
            self.pause();
            self.trigger("bufferingBegin");
            setTimeout(function () {
                self.trigger("bufferingEnd");
                self.resume();
            }, 500);
        },
        /**
         * For multi audio tracks videos
         */
        audio: {
            /**
             * Set audio track index
             * @param index
             */
            set: function (index) {
                curAudio = index;
            },
            /**
             * Returns list of supported language codes
             * @returns {Array}
             */
            get: function () {
                var len = 2;
                var result = [];
                for (var i = 0; i < len; i++) {
                    result.push(0);
                }
                return result;
            },
            /**
             * @returns {Number} index of current playing audio track
             */
            cur: function () {
                return curAudio;
            },
            toggle: function () {
                var l = this.get().length;
                var cur = this.cur();
                if (l > 1) {
                    cur++;
                    if (cur >= l) {
                        cur = 0;
                    }
                    this.set(cur);
                }
            }
        },
        subtitle: {
            /**
             * Set subtitle index
             * @param index
             */
            set: function (index) {
                curSubtitle = index;
            },
            /**
             * Returns list of available subtitles
             * @returns {Array}
             */
            get: function () {
                var len = 2;
                var result = [];
                for (var i = 0; i < len; i++) {
                    result.push(0);
                }
                return result;
            },
            /**
             * @returns {Number} index of current subtitles
             */
            cur: function () {
                return curSubtitle;
            },
            toggle: function () {
                var l = Player.subtitle.get().length;
                var cur = Player.subtitle.cur();
                if (l > 1) {
                    cur++;
                    if (cur >= l) {
                        cur = 0;
                    }
                    Player.subtitle.set(cur);
                }
            },
            text: function (time) {
                var data = Player.subtitle.data,
                    index = _.sortedIndex(data, {
                        time: time
                    }, function (value) {
                        return value.time;
                    });
                if (data[index - 1]) {
                    return data[index - 1].text;
                }
                return '';
            },
            data: [
                {
                    time: 0,
                    text: ''
                }
            ],
            /**
             * Load subtitles from remote file
             * @param url
             */
            url: function (url) {
                var extension = /\.([^\.]+)$/.exec(url)[1];
                // TODO Сделать универсальное выключение вшитых субтитров
                Player.subtitle.set(undefined);
                $.ajax({
                    url: url,
                    dataType: 'text',
                    success: function (data) {
                        var $subtitiles = $('#subtitles_view');
                        $(Player).off('.subtitles');
                        Player.subtitle.init = true;
                        Player.subtitle.remote = true;
                        Player.subtitle.parse[extension].call(Player, data);
                        $subtitiles.show();
                        var setSubtitlesText = function () {
                            $('#subtitles_text').html(Player.subtitle.text(parseInt(Player.videoInfo.currentTime) * 1000));
                        }
                        Player.on('update', setSubtitlesText);

                        if (!$subtitiles.length) {
                            $('body').append('<div id="subtitles_view" style="position: absolute; z-index: 1;"><div id="subtitles_text"></div></div>');
                            $subtitiles = $('#subtitles_view');
                            $subtitiles.css({
                                width: '1280px',
                                height: '720px',
                                left: '0px',
                                top: '0px'
                            });
                            $('#subtitles_text').css({
                                'position': 'absolute',
                                'text-align': 'center',
                                'width': '100%',
                                'left': '0',
                                'bottom': '50px',
                                'font-size': '24px',
                                'color': '#fff',
                                'text-shadow': '0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000,0 0 3px #000',
                                'line-height': '26px'
                            });
                        }

                        var stopSubtitlesUpdate = function () {
                            $(Player).off('update', setSubtitlesText);
                            $(Player).off('stop', stopSubtitlesUpdate);
                            $subtitiles.hide();
                        }

                        Player.on('stop', stopSubtitlesUpdate);
                    }
                });
            },
            parse: {
                smi: function (data) {
                    data = data.split(/\s*<sync/i);
                    data.shift();
                    Player.subtitle.data = _.map(data, function (value) {
                        var match = /[\s\S]*start=(\d+)[\s\S]*<p[^>]*>([\s\S]*)<spanid/i.exec(value);
                        if (match) {
                            return {
                                time: parseInt(match[1], 10),
                                text: match[2]
                            };
                        }
                    });
                },
                srt: function (data) {
                    data = data.split('\r\n\r\n');
                    var self = Player.subtitle;

                    self.data = [];
                    var parseTime = function (time) {
                        var matches = time.match(/(\d{2}):(\d{2}):(\d{2}),(\d+)/);
                        return parseInt(matches[1], 10) * 3600000 +
                            parseInt(matches[2], 10) * 60000 +
                            parseInt(matches[3], 10) * 1000 +
                            parseInt(matches[4], 10);
                    };

                    _.each(data, function (value) {
                        if (!value) {
                            return;
                        }
                        var rows = value.split('\n');

                        var timeRow = rows[1].split(' --> '),
                            timeStart, timeEnd, text;
                        rows.splice(0, 2);
                        timeStart = parseTime(timeRow[0]);
                        timeEnd = parseTime(timeRow[1]);

                        self.data.push({
                            time: timeStart,
                            text: rows.join('<br/>')
                        });
                        self.data.push({
                            time: timeEnd,
                            text: ''
                        });
                    });
                    self.data.unshift({
                        time: 0,
                        text: ''
                    });
                }
            }
        }
    };


    var extendFunction, eventProto;
    //use underscore, or jQuery extend function
    if (window._ && _.extend) {
        extendFunction = _.extend;
    } else if (window.$ && $.extend) {
        extendFunction = $.extend;
    }


    if (window.EventEmitter) {
        eventProto = EventEmitter.prototype;
    } else if (window.Backbone) {
        eventProto = Backbone.Events;
    } else if (window.Events) {
        eventProto = Events.prototype;
    }

    Player.extend = function (proto) {
        extendFunction(this, proto);
    };

    Player.extend(eventProto);


}(this));

/**
 * Philips platform
 */
 
SB.readyForPlatform('philips', function () {
    var video;


    var updateInterval;
    var ready = false;

    var startUpdate = function () {
        var lastTime = 0;
        updateInterval = setInterval(function () {
            if (video.playPosition != lastTime) {
                Player.videoInfo.currentTime = video.playPosition / 1000;
                Player.trigger('update');
            }
            lastTime = video.playPosition;
        }, 500);
    }

    var stopUpdate = function () {
        clearInterval(updateInterval);
    }

    function checkPlayState() {
        //$('#log').append('<div>' + video.playState + '</div>');


        //some hack
        //in my tv player can sent lesser than 1 time, and correct time after
        if (video.playTime > 1) {

            if (!ready) {
                //+1 for test pass
                Player.videoInfo.duration = (video.playTime / 1000)+1;
                Player.trigger('ready');
                ready = true;
            }
        }

        switch (video.playState) {
            case 5: // finished
                Player.trigger('complete');
                stopUpdate();
                Player.state = "stop";
                break;
            case 0: // stopped
                Player.state = "stop";
                break;
            case 6: // error
                Player.trigger('error');
                break;
            case 1: // playing
                Player.trigger('bufferingEnd');
                startUpdate();
                break;
            case 2: // paused

            case 3: // connecting

            case 4: // buffering
                Player.trigger('bufferingBegin');
                stopUpdate();
                break;
            default:
                // do nothing
                break;
        }
    }

    Player.extend({
        _init: function () {
            $('body').append('<div id="mediaobject" style="position:absolute;left:0px;top:0px;width:640px;height:480px;">\n\
              <object id="videoPhilips" type="video/mpeg4" width="1280" height="720" />\n\
               </div>');
            video = document.getElementById('videoPhilips');
            video.onPlayStateChange = checkPlayState;
        },
        _play: function (options) {
            video.data = options.url;
            video.play(1);
            ready = false;
            Player.trigger('bufferingBegin');
        },
        _stop: function () {
            video.stop();
            stopUpdate();
        },
        pause: function () {
            video.play(0);
            this.state = "pause";
            stopUpdate();
        },
        resume: function () {
            video.play(1);
            this.state = "play";
            startUpdate();
        },
        seek: function (time) {
            //-10 for test pass
            video.seek((time - 10) * 1000);
        }
    });
});

SB.createPlatform('philips', {
    platformUserAgent: 'nettv',
    setPlugins: function () {
        this.keys = {
            ENTER: VK_ENTER,
            PAUSE: VK_PAUSE,
            LEFT: VK_LEFT,
            UP: VK_UP,
            RIGHT: VK_RIGHT,
            DOWN: VK_DOWN,
            N0: VK_0,
            N1: VK_1,
            N2: VK_2,
            N3: VK_3,
            N4: VK_4,
            N5: VK_5,
            N6: VK_6,
            N7: VK_7,
            N8: VK_8,
            N9: VK_9,
            RED: VK_RED,
            GREEN: VK_GREEN,
            YELLOW: VK_YELLOW,
            BLUE: VK_BLUE,
            RW: VK_REWIND,
            STOP: VK_STOP,
            PLAY: VK_PLAY,
            FF: VK_FAST_FWD,
            RETURN: VK_BACK,
            CH_UP: VK_PAGE_UP,
            CH_DOWN: VK_PAGE_DOWN
        };
    }
});