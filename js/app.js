(function () {
  "use strict";

  window.App = {
    isShown: true,

    initialize: function () {
      this.$wrap = $('#wrap');

      this.setEvents();

      $$nav.on();
    },

    setEvents: function () {
       var /*$bg = $('#sleepbg'),*/ $playerinfo = $('#playerinfo'), $msg = $('#playerinfo .msg');
	   
      $(document.body).on({
        'nav_key:blue': _.bind(this.toggleView, this),
        'nav_key:red': function () {
          Player.stop();
        }
      });
      Player.on('error', function () {
		$msg.text('Reconectando');
		$playerinfo.show();
		Player.stop(true);
		Player.play(window.url);
      });
	  Player.on('bufferingBegin', function () {
		$msg.text('Cargando...');
		$playerinfo.show();
        //$bg.hide();
      });
      Player.on('bufferingEnd', function () {
		$playerinfo.delay(1000).fadeOut("slow");
      });
		Player.on('stop', function () {
		$msg.text('Detenido');
		$playerinfo.show();
		//$bg.show();
	});

    },

    toggleView: function () {
      if (this.isShown) {
        this.$wrap.hide();
      } else {
        this.$wrap.show();
      }
      this.isShown = !this.isShown;
    }
  };
  SB(_.bind(App.initialize, App));
})();