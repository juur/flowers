var MAX_HEALTH 	= 40;
var MAX_AGE		= 7 * 4 * 3;				// days

var SOIL_AREA	= 100;						// cm2
var SOIL_DEPTH	= 50;						// cm
var SOIL_VOLUME	= SOIL_DEPTH * SOIL_AREA;	// cm3 / ml
var SOIL_DRAIN	= SOIL_AREA * 0.75;			// cm3 / ml

var RAIN_DEPTH 	= 1.5;						// cm per day of rain
var RAIN_VOLUME	= SOIL_AREA * RAIN_DEPTH;	// ml

var MAX_NUTRIENT	= 10;

var L_FLOODED		= 0.400;
var L_WATER_LOGGED	= 0.200;
var L_VWET			= 0.150;
var L_WET			= 0.100;
var L_DAMP			= 0.050;
var L_DRY			= 0.020;

var Forecast = Object.freeze({
	FAIR: 0, 
	SUNNY: 1, 
	RAIN: 2
});

var ForecastDesc = ["fair","sun","rain"];

var Game = {};
var Flower = {};
var Soil = {};

var body, html;

$( document ).ready(function() {
	body = $( "#body" );
	html = $( "#html" );
	body.append("<h1>Welcome</h1>");

	Game = {
		day:	0,
		wind:	false,
		aphid:	false,
		rain:	false,
		sunny:	false,
		fcast:	Forecast.FAIR
	};

	Flower = {
		height: 	1,
		health:		MAX_HEALTH,
		dead: 		false,
		startdate:	new Date().getTime()
	};

	Soil = {
		food: 		10,
		water: 		10,
		nutrients:	10
	};

	$( "#btn_next" ).click(function() {
		progress();
	});

	$( "#btn_water" ).change(function() {
		$( "#waterlevel" ).val( 
			$( "#btn_water" ).val() 
		);
	});

	progress();
});

function rng()
{
	return rnRange(1,100);
}

function rnRange(start,end)
{
	return Math.floor(Math.random() * (end - start + 1) + start);
}

function age_text(cm)
{
	if(cm > 50) return "Ripening";
	else if(cm > 40) return "Flowering";
	else if(cm > 30) return "Bud Stage";
	else if(cm > 20) return "Vegetative";
	else if(cm > 5) return "Seedling";
	else return "Seed Germination";
}

function sun_text(l)
{
	if(l > 2) return "Bright";
	else if(l > 1) return "Fine";
	else return "Overcast";
}

function progress()
{
	Game.day++;

	body.append( "<h3>Day " + Game.day + "</h3>" );

	wateradd = parseInt($( "#btn_water" ).val());
	Soil.water += wateradd;
	feed = $( "#btn_feed" ).is(":checked");

	var fc = rng();

	switch(Game.fcast) {
		case Forecast.SUNNY:
		fc -= 60;
		break;
		case Forecast.RAIN:
		fc += 60;
		break;
	}

	Game.rain = false;
	Game.sunny = false;

	if(fc > 90) Game.rain = true;
	else if(fc < 10) Game.sunny = true;

	// TODO forecast this seperately?
	if(rng() > 65) Game.wind = true; else Game.wind = false; 

	// add in slugs for <20cm ones
	if(rng() > 95) Game.aphid = true; else Game.aphid = false;

	if(Game.aphid) {
		Flower.health -= 15;
	}

	/*
	 * 00 - 34	Sun
	 * 35 - 69	Fair
	 * 70 - 99	Rain
	 */

	fc = rng();

	if(fc > 69) {
		Game.fcast = Forecast.RAIN;
	} else if(fc > 34) {
		Game.fcast = Forecast.FAIR;
	} else {
		Game.fcast = Forecast.SUNNY;
	}

	// if we have rain, increase the amount of water in our soil
	if(Game.rain) {
		Soil.water += RAIN_VOLUME;
		// water += (((height * 2)^2) * 0.02 * RAIN_AMOUNT);
		$('html').css({backgroundImage: 'url("clouds.jpg")', backgroundSize: '100% 100%'});
	} else if(Game.sunny) {
		$('html').css({backgroundImage: 'url("sun.jpg")', backgroundSize: '100% 100%'});
	} else {
		$('html').css({background: 'rgb(235,255,235)'});
	}

	// let the plant drink water
	plantdrain = Flower.height * 5;
	Soil.water -= plantdrain;

	// let the soil drain water
	soildrain = SOIL_DRAIN * (rnRange(70, 120)/100);
	Soil.water -= soildrain;
	Soil.food -= soildrain * 1.50; // FIXME is this sensible 

	if(feed) {
		Soil.food += wateradd;
	}

	Soil.food -= Flower.height * 5;

	// add in text based reporting on how wet it is

	// define semi water logged
	if(Flower.height > 30 && Game.water > (SOIL_VOLUME * 0.05) && Game.wind && rng() > 75) {
		body.append(
			"Your flower has blown over and is damaged.<br>"
		);
		Flower.health -= 15;
	}

	// clamps
	Soil.water = Math.max(0, Soil.water);
	Soil.food = Math.max(0, Soil.food);

	if(Soil.water < SOIL_VOLUME * L_DRY) {
		Flower.health -= 7;
	} else if(Soil.water < Soil.water > SOIL_VOLUME * L_DAMP) {
		Flower.health -= 3;
	}

	if(Soil.water > SOIL_VOLUME * L_WATER_LOGGED) {
		Soil.nutrients -= 1;
		Soil.nutrients = Math.max(0, Soil.nutrients);
	} else {
		Soil.nutrients += 0.5;
		Soil.nutrients = Math.min(MAX_NUTRIENT, Soil.nutrients);
	}

	if(Soil.nutrients <= 0) {
		Flower.health -= 2;
		body.append( "<i>Your sunflower stem is looking yellow!</i><br>");
	}

	// if we are at >= 50% health, grow
	if(Flower.health > MAX_HEALTH/2) {
		var oldname = age_text(Flower.height);
		var growth = Flower.height * 0.1;

		growth *= Flower.health/MAX_HEALTH;

		if(Soil.food > 0) growth *= 1.2;
		if(Game.rain) growth *= 0.8;
		if(Game.sunny) growth *= 1.1;

		if(Soil.nutrients <= 0) growth *= 0.2;
		else if(Soil.nutrients < 3) growth *= 0.5;
		else if(Soil.nutrients < 5) growth *= 0.8;

		growth = Math.min(2, growth); // TODO cap by phase

		Flower.height += growth;

		if(growth > 0.1) {
			body.append(
				"<font style=\"color: green\">Your flower has grown " + 
				parseInt(growth * 10) + "mm!</font><br>"
			);
		} else if(growth > 0) {
			body.append( "<font style=\"color: green\">Your flower has grown.</font><br>");
		}

		var newname = age_text(Flower.height)

		if(oldname != newname) {
			$( "#img" ).attr('src', encodeURIComponent(newname+'.png'));
			$( "#img" ).attr('alt', newname);
		}
	}

	if(Flower.health <= 0) {
		body.append(
			"<p style=\"font-size: 1.5em; text-align: center\">"+
			"<b>Your flower is dead.</b></p>"
		);
		Flower.dead = true;
	} else {
		if(Flower.health <= 5) { body.append("Your sunflower looks withered and unhealthy.<br>"); }

		// FIXME define correct minimal acceptable water for healing
		if(Flower.health < MAX_HEALTH && Soil.water > 10) {
			// if we have been fed, get better more
			var heal = 5;
			if( Soil.food ) heal *= 1.8;
			if( Soil.nutrients < 3 ) heal *= 0.7;
			Flower.health += heal;
		}

		if(Game.day >= MAX_AGE) {
			body.append( 
				"<b>Game over</b><br>" +
				"<b>Your sunflower was " + parseInt(Flower.height) + "cm tall!</b><br>"
			);
			Flower.dead = true;
		}
	}

	if(!Flower.dead) {
		body.append(
			(Game.aphid ? "<b style=\"color: red\">Aphids have attacked!</b><br/>" : "") +
			"Your sunflower is " + parseInt(Flower.height) + "cm tall.<br>" +
			(Game.rain ? "It has rained. " : "") +
			(Game.sunny ? "It is bright and sunny. " : "") +
			"The wind is " + (Game.wind ? "blowing" : "calm") + ". " +
			"The forecast for tomorrow is " + ForecastDesc[Game.fcast] + ".<br>"
		);

		if(Soil.water > SOIL_VOLUME * L_FLOODED) {
			body.append("The soil is flooded.<br>");
		} else if(Soil.water > SOIL_VOLUME * L_WATER_LOGGED) {
			body.append("The soil is water logged.<br>");
		} else if(Soil.water > SOIL_VOLUME * L_VWET) {
			body.append("The soil is very wet.<br>");
		} else if(Soil.water > SOIL_VOLUME * L_WET) {
			body.append("The soil is quite wet.<br>");
		} else if(Soil.water > SOIL_VOLUME * L_DAMP) {
			body.append("The soil is damp.<br>");
		} else if(Soil.water > SOIL_VOLUME * L_DRY) {
			body.append("The soil is dry.<br>");
		} else {
			body.append("The soil is bone dry.<br>");
		}
	}
	// clamp
	Flower.health = Math.min(MAX_HEALTH, Flower.health);

	/*
	 body.append(
		 "<code>" +
		 "water=" + parseInt(Soil.water) + "ml" +
		 ", health=" + parseInt(Flower.health) + "/" + MAX_HEALTH +
		 ", rain=" + (Game.rain ? "" : RAIN_VOLUME +  "ml") +
		 ", drainage=" + parseInt(soildrain) + "ml" +
		 ", drunk=" + parseInt(plantdrain) + "ml" +
		 ", nutrients=" + parseInt(Soil.nutrients) +
		 ", food=" + parseInt(Soil.food) + "ml" +
		 ", fcast=" + Game.fcast +
		 "</code>"
	 );
	 */

	if( Flower.dead ) {
		$( "#btn_next" ).click(null);
		$( "#btn_next" ).remove();
		$( "#div_bot" ).load(
			'form.html', 
			function() {
				scroll();
				$( "#submit_form" ).submit(function (event) {
					$( "#submit" ).prop('disabled',true);
					event.preventDefault();
					if(confirm("Do you wish to post your results?") == true) {
						$.ajax({
							type: 'POST',
							url: 'http://logomaze.herokuapp.com/events/44bpm/dashboard',
							data: JSON.stringify({
								name:		$("#_name").val(),
								email:		$("#_email").val(),	
								height:		parseInt(Flower.height),
								birthdate:	Flower.startdate,
								token:		parseInt(Flower.startdate/1000),
								alive:		!Flower.dead 
							}),
							error: function(xhr) {
							},
							success: function() {
								$( "#div_bot" ).load( 'thanks.html' );
							},
							contentType: 'application/json'
						});
					}

					$( "#submit" ).prop('disabled',false);

					return false;
				});
			}
		);
	}

	scroll();
}

function rag(v)
{
	//console.log(v);
	var r,g,b,ret;
	b = 0;

	if(v > 0.5) {
		v -= 0.5;
		v *= 2;

		r = 255 * (1-v);
		g = 255 - (127 * (1-v));
	} else {
		r = 255;
		g = 127 * (v * 2);
	}


	ret = "rgb("+parseInt(r)+","+parseInt(g)+","+parseInt(b)+")";
	// console.log(ret);

	return ret;
}

function scroll()
{
	both = $('#div_bot').height();
	wind = $('body').height();

	$( "#rag" ).css('background-color', rag(Flower.health/MAX_HEALTH));
	$( "#btn_water" ).val(0);
	$( "#waterlevel" ).val(0);
	$( "#btn_feed").prop('checked',false);
	$( "#div_mid" ).css('max-height',wind-both);
	$( "#div_mid" ).animate({ scrollTop: $("#div_mid")[0].scrollHeight}, 250);
}

