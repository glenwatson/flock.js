/* flock.js - Built by Andrew Capshaw */
var flockApp = function() {

    /* The default options to govern the behavior of the app. */
    var options = {
        canvasFrontId: null,
        canvasBackId: null,
        canvasOnClickAddBoid: true,
        boidSight: 10,
        boidMaxVelocity: 2,
        boidStrokeColor: "#fff",
        boidFillColor: "#222",
        boidSize: 20,
        trailStrokeColor: "#444",
        trailFillColor: "#999",
        drawTrail: true,
        drawDotted: false,
        updatePeriod: 100,
        flockSize: 30
    };

    /* The canvas and context elements to draw to. */
    var frontCanvas;
    var frontContext;
    var backCanvas;
    var backContext;

    /* The refresh interval id. Should the user request to cancel the animation
     * this is what is cleared. */
    var intervalId;

    /* Maintain our flock of boids. */
    var flock = [];

    /* Extend the default options with the user's options and check to ensure
     * that required options were successfully passed in. */
    var init = function (userOptions) {
        options = $.extend(options, userOptions);
        if(!hasRequiredParameters()) {
            return false;
        }
        setupHandlers();
    };

    /* Stop drawing the drawing and updating actions. */
    var stop = function () {
        if(!intervalId) {
            return false;
        }
        clearInterval(intervalId);
        intervalId = null;
        return true;
    }

    /* Start the drawing and updating actions. */
    var restart = function () {
        if(intervalId) {
            return false;
        }
        intervalId = setInterval(updateFlock, options.updatePeriod);
        return true;
    }

    /* Make sure that every option has a non-null value. */
    var hasRequiredParameters = function () {
        var valid = true;
        $.each(options, function (key, value) {
            if(value == null) {
                console.log("The option " + key + " is required.");
                valid = false;
            }
        });
        return valid;
    }

    /* Setup the handlers for the app. When the document is ready, find the
     * user-specified canvas's and resize them to fill their container. Also,
     * setup the resize handler to resize the canvas every time the page size
     * is changed. */
    var setupHandlers = function () {
        $(document).ready(function(){
            frontCanvas = document.getElementById(options.canvasFrontId);
            backCanvas = document.getElementById(options.canvasBackId);
            frontContext = frontCanvas.getContext("2d");
            backContext = backCanvas.getContext("2d");
            resizeCanvas(frontCanvas);
            resizeCanvas(backCanvas);
            flock = buildFlock(options.flockSize);
            restart();
        });

        $(window).resize(function(){
            resizeCanvas(frontCanvas);
            resizeCanvas(backCanvas);
        });

        $("#" + options.canvasFrontId).on("click", function(e){
            if(options.canvasOnClickAddBoid) {
                var boid = buildRandomBoid();
                boid.x = e.pageX;
                boid.y = e.pageY;
                flock.push(boid);
            }
        });
    }

    /* Javascript '%' operator returns remainder. This function implements the
     * modulo functionality such that negative values wrap around. */
    var mod = function (n, m) {
        var remain = n % m;
        return remain >= 0 ? remain : remain + m;
    }

    /* Returns a random integer inclusive to the minimum and maximum. */
    var randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
	var random = function (min, max) {
        return Math.random() * (max - min) + min;
    }

    /* Resize the canvas to fill the size of it's parent container. */
    var resizeCanvas = function (canvas) {
        canvas.width = $(canvas).parent().width();
        canvas.height = $(canvas).parent().height();
    }

    /* Clear the front canvas in preparation for drawing the boids new
     * positions. */
    var clearCanvas = function () {
        frontContext.width = frontContext.width;
        frontContext.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
    }

    /* Initialize a flock of boids of the defined size. */
    var buildFlock = function (size) {
        var flock = [];
        for(var i = 0; i < size; i++){
            flock.push(buildRandomBoid());
        }
        return flock;
    }

    /* Return a boid with a random starting location and movement vector. */
    var buildRandomBoid = function () {
        return {
            id: randomInt(0, 1000000),
            x: randomInt(0, frontCanvas.width),
            y: randomInt(0, frontCanvas.height),
            vx: randomInt(-options.boidMaxVelocity, options.boidMaxVelocity),
            vy: randomInt(-options.boidMaxVelocity, options.boidMaxVelocity),
        };
    }

    /* Find the distance between two boids. Does not take into account canvas
     * wraparound. */
    var distance = function (boidA, boidB) {
        return Math.pow(boidA.x - boidB.x, 2) + Math.pow(boidA.y - boidB.y, 2);
    }

    /* Update each of the boid's vectors and position on the canvas. */
    var updateFlock = function () {
        clearCanvas();
        resetTotals();
        findLocals();
        calculateMovementAndDraw();
    }

	/* reset the numbers used in movement calculations */
	var resetTotals = function () {
		var i = flock.length;
		/* zero out totals */
        while(--i) {
            boid = flock[i];
            boid.locals = 0;
            boid.averageXHeading = 0;
            boid.averageYHeading = 0;
        }
	}

	/* Record each local boid */
	var findLocals = function () {
        var i = flock.length, j, other;
		/* find locals */
        while(--i) {
            boid = flock[i];
            /* Find local boids. Fun O(n^2/2) times! */
            j = i;
            while(--j) {
                other = flock[j];
                if(distance(boid, other) < options.boidSight) {
                    boid.locals++;
                    boid.averageXHeading += other.vx;
                    boid.averageYHeading += other.vy;
                    other.locals++;
                    other.averageXHeading += boid.vx;
                    other.averageYHeading += boid.vy;
                }
            }
        }
	}

	/* Calulates the boid's next position & draws it to the canvas */
	var calculateMovementAndDraw = function () {
		/* calculate movement */
        var i = flock.length, boid,
			newXHeading, newYHeading,
			dtheta;
        while(--i) {
            boid = flock[i];
            if(boid.locals > 0) {
                boid.averageXHeading /= boid.locals;
                boid.averageYHeading /= boid.locals;

                // Move torwards average local heading.
                newYHeading = (boid.averageYHeading + boid.vy)/2;
                newXHeading = (boid.averageXHeading + boid.vx)/2;
            }

            // Speed up or down randomly.
            boid.vx += random(-.1, .1);
            boid.vx = Math.min(boid.vx, options.boidMaxVelocity);
            boid.vx = Math.max(boid.vx, -options.boidMaxVelocity);
            boid.vy += random(-.1, .1);
            boid.vy = Math.min(boid.vy, options.boidMaxVelocity);
            boid.vy = Math.max(boid.vy, -options.boidMaxVelocity);

            // Move the boid.
            boid.x += boid.vx;
            boid.y += boid.vy;

            // Wrap around the canvas
            boid.x = mod(boid.x, frontCanvas.width);
            boid.y = mod(boid.y, frontCanvas.height);

            drawboid(frontContext, boid);
        }
	}

    /* Draw a boid to the front canvas and it's trail to the back canvas. */
    var drawboid = function (context, boid) {

        // Find the coordinates of the paper-airplane-shaped boid.
        var l = options.boidSize;

        // Draw the boid.
		context.save();
        context.strokeStyle = options.boidStrokeColor;
        context.fillStyle = options.boidFillColor;
		var d = boid.vy / boid.vx;
		context.translate(boid.x+l, boid.y);
		context.rotate(Math.atan(d) - (boid.vx < 0 ? Math.PI : 0));
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(-l * 1.3, l * .4);
        context.lineTo(-l, 0);
        context.lineTo(-l * 1.3, -l * .4);
        context.closePath();
        context.stroke();
        context.fill();
		context.restore();

        // Draw the trail, if desired.
        if(options.drawTrail) {
            backContext.beginPath();
            backContext.strokeStyle = options.trailStrokeColor;
            backContext.fillStyle = options.trailFillColor;
            if(!options.drawDotted){
                backContext.moveTo(boid.x, boid.y);
                var oldX = boid.x - boid.vx;
                var oldY = boid.y - boid.vy;
                backContext.lineTo(oldX, oldY);
            } else {
                backContext.fillRect(boid.x, boid.y, 1, 1);
            }
            backContext.closePath();
            backContext.stroke();
        }
    }

    return {
        init: init,
        stop: stop,
        restart: restart
    };
};
