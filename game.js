var MAX_HEALTH 	= 20;
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

jQuery.fn.extend({
	disable: function(state) {
		return this.each(function() {
			this.disabled = state;
		});
	}
});

$( document ).ready(function() {
	body = $( "#body" );
	html = $( "#html" );
	body.append("<h1>Welcome</h1>");
	day = 0;
	height = 1;
	food = 10;
	water = 10;
	health = MAX_HEALTH;
	dead = false;
	wind = false;
	aphid = false;
	rain = false;
	sunny = false;
	nutrients = 10;
	startdate = new Date().getTime();

	$( "#btn_next" ).click(function() {
		progress();
	});

	//	$( "#btn_feed" ).change(function() {
	//		$( "#feedlevel" ).val( 
	//			$( "#btn_feed" ).val() 
	//		);
	//	});

	$( "#btn_water" ).change(function() {
		$( "#waterlevel" ).val( 
			$( "#btn_water" ).val() 
		);
	});

	progress();
});

function rng()
{
	return Math.floor(Math.random() * 101);
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
	day++;
	body.append( "<h3>Day "+day+"</h3>" );

	wateradd = parseInt($( "#btn_water" ).val());
	water += wateradd;
	feed = $( "#btn_feed" ).is(":checked");

	// TODO make it: if (forecast_rain ? 20% : 90%) and calc a forecast and show
	// a forecast
	if(rng() > 70) rain = true; else rain = false;
	if(rng() > 65) wind = true; else wind = false; 
	// add in slugs for <20cm ones
	if(rng() > 95) aphid = true; else aphid = false;
	if(!rain && rng() > 50) sunny = true ; else sunny = false;

	if(aphid) {
		health -= 8;
	}


	// if we have rain, increase the amount of water in our soil
	if(rain) {
		water += RAIN_VOLUME;
		// water += (((height * 2)^2) * 0.02 * RAIN_AMOUNT);
		$('html').css({backgroundImage: 'url("clouds.jpg")', backgroundSize: '100% 100%'});
	} else if(sunny) {
		$('html').css({backgroundImage: 'url("sun.jpg")', backgroundSize: '100% 100%'});
	} else {
		$('html').css({background: 'rgb(235,255,235)'});
	}

	// let the plant drink water
	plantdrain = height * 5;
	water -= plantdrain;

	// let the soil drain water
	soildrain = SOIL_DRAIN * (rnRange(70, 120)/100);
	water -= soildrain;

	if(feed) {
		food += wateradd;
	}

	food -= height * 5;

	// add in text based reporting on how wet it is

	// define semi water logged
	if(height > 30 && water > (SOIL_VOLUME * 0.05) && wind && rng() > 75) {
		body.append("Your flower has blown over and is damaged.<br>");
		health -= 10;
	}

	// clamps
	water = Math.max(0, water);
	food = Math.max(0, food);

	if(water <= 0) {
		health -= 2;
		// test for being water logged
	} else if(water > SOIL_VOLUME * 0.1) {
		health -= 4;
	}

	if(water > SOIL_VOLUME * L_WATER_LOGGED) {
		nutrients -= 1;
		nutrients = Math.max(0, nutrients);
	} else {
		nutrients += 0.5;
		nutrients = Math.min(MAX_NUTRIENT, nutrients);
	}

	if(nutrients <= 0) {
		health -= 1;
		body.append("<i>Your sunflower stem is looking yellow!</i><br>");
	}

	// if we are at >= 50% health, grow
	if(health > MAX_HEALTH/2) {
		oldname = age_text(height);

		growth = height * 0.1;
		growth *= health/MAX_HEALTH;

		if(food > 0) growth *= 1.2;
		if(rain) growth *= 0.8;
		if(sunny) growth *= 1.1;

		if(nutrients <= 0) growth *= 0.2;
		else if(nutrients < 3) growth *= 0.5;
		else if(nutrients < 5) growth *= 0.8;

		growth = Math.min(2, growth); // TODO cap by phase

		height += growth;

		if(growth > 0.1) {
			body.append("<font style=\"color: green\">Your flower has grown "+parseInt(growth * 10) + "mm!</font><br>");
		} else if(growth > 0) {
			body.append("<font style=\"color: green\">Your flower has grown.</font><br>");
		}

		newname = age_text(height)
		if(oldname != newname) {
			$( "#img" ).attr('src', encodeURIComponent(newname+'.png'));
			$( "#img" ).attr('alt', newname);
		}
	}

	if(health <= 0) {
		body.append(
			"<p style=\"font-size: 2em; text-align: center\">"+
			"<b>Your flower is dead.</b></p>"
		);
		dead = true;
	} else {
		if(health <= 2) {
			body.append("Your sunflower looks withered and unhealthy.<br>");
		}

		// FIXME define correct minimal acceptable water for healing
		if(health < MAX_HEALTH && water > 10) {
			// if we have been fed, get better more
			health += food ? 5 : 2;
		}

		if(day >= MAX_AGE) {
			body.append("<b>Game over</b><br>");
			body.append("<b>Your sunflower was " + parseInt(height) + "cm tall!</b><br>");
			day++;
			dead = true;
		}
	}

	if(!dead) {
		body.append(
			//		"<font style=\"color: red\">" +
			//		"Debug: water="+parseInt(water)+",health="+parseInt(health)+
			//		"/"+MAX_HEALTH+",food="+food+"</font>"+
			//		"<br>" + 
			(aphid ? "<b>Aphid's are attacking!</b><br/>" : "") +
			(rain ? "It has rained. " : "") +
			(sunny ? "It is bright and sunny. " : "") +
			"It is " + (wind ? "windy" : "calm") + ". " +
			"Your sunflower is " + parseInt(height) + "cm tall. "
		);

		if(water > SOIL_VOLUME * L_FLOODED) {
			body.append("The soil is flooded.<br>");
		} else if(water > SOIL_VOLUME * L_WATER_LOGGED) {
			body.append("The soil is water logged.<br>");
		} else if(water > SOIL_VOLUME * L_VWET) {
			body.append("The soil is very wet.<br>");
		} else if(water > SOIL_VOLUME * L_WET) {
			body.append("The soil is quite wet.<br>");
		} else if(water > SOIL_VOLUME * L_DAMP) {
			body.append("The soil is damp.<br>");
		} else if(water > SOIL_VOLUME * L_DRY) {
			body.append("The soil is dry.<br>");
		} else {
			body.append("The soil is bone dry.<br>");
		}
	}
	// clamp
	health = Math.min(MAX_HEALTH, health);

	/*
	 body.append(
		 "<code>" +
		 "water=" + parseInt(water) + "ml" +
		 ", health=" + parseInt(health) + "/" + MAX_HEALTH +
		 ", rain=" + (rain ? "" : RAIN_VOLUME +  "ml") +
		 ", drainage=" + parseInt(soildrain) + "ml" +
		 ", drunk=" + parseInt(plantdrain) + "ml" +
		 ", nutrients=" + parseInt(nutrients) +
		 ", food=" + parseInt(food) + "ml" +
		 "</code>"
	 );
	 */

	if( dead ) {
		$( "#btn_next" ).click(null);
		$( "#btn_next" ).remove();
		$( "#div_bot" ).load(
			'form.html', 
			function() {
				scroll();
				$( "#submit" ).click(function () {
					$.ajax({
						type: 'POST',
						url: 'http://logomaze.herokuapp.com/events/44bpm/dashboard',
						data: JSON.stringify({
							name:	$("#_name").val(),
							email:	$("#_email").val(),	
							height:	parseInt(height),
							token:	startdate,
							alive:	!dead 
						}),
						error: function(xhr) {
							alert("Unable to post");
						},
						success: function() {
							$( "#div_bot" ).load( 'thanks.html' );
						},
						contentType: 'application/json'
					});
				});
			}
		);
	}

	scroll();
}

function scroll()
{
	both = $('#div_bot').height();
	wind = $('body').height();

	$( "#btn_water" ).val(0);
	$( "#waterlevel" ).val(0);
	$( "#btn_feed").prop('checked',false);
	$( "#div_mid" ).css('max-height',wind-both);
	$( "#div_mid" ).animate({ scrollTop: $("#div_mid")[0].scrollHeight}, 250);
}

