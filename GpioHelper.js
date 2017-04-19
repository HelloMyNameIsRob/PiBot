const Gpio = require('pigpio').Gpio;

function GpioHelper() {
    function GpioPin(pin) {
        this.pin = pin;
        this.mode = "ALT2";
        this.pwmRange = 0;
        this.pwmValue = null;
        this.digitalValue = 0;
    }
    const gpio_header = {
        2: new GpioPin(2),
        3: new GpioPin(3),
        4: new GpioPin(4),
        5: new GpioPin(5),
        6: new GpioPin(6),
        7: new GpioPin(7),
        8: new GpioPin(8),
        9: new GpioPin(9),
        10: new GpioPin(10),
        11: new GpioPin(11),
        12: new GpioPin(12),
        13: new GpioPin(13),
        14: new GpioPin(14),
        15: new GpioPin(15),
        16: new GpioPin(16),
        17: new GpioPin(17),
        18: new GpioPin(18),
        19: new GpioPin(19),
        20: new GpioPin(20),
        21: new GpioPin(21),
        22: new GpioPin(22),
        23: new GpioPin(23),
        24: new GpioPin(24),
        25: new GpioPin(25),
        26: new GpioPin(26),
        27: new GpioPin(27)

    };
    
    const gpio = {
        gpioData: {},
        gpioPins: {},

        gpioModeToInt: function (mode) {
            const mode_to_int = {
                "INPUT": 0,
                "OUTPUT": 1,
                "ALT0": 4,
                "ALT1": 5,
                "ALT2": 6,
                "ALT3": 7,
                "ALT4": 3,
                "ALT5": 2
            };
            return mode_to_int[mode];
        },
        gpioIntToMode: function (mode) {
            const int_to_mode = {
                0: "INPUT",
                1: "OUTPUT",
                4: "ALT0",
                5: "ALT1",
                6: "ALT2",
                7: "ALT3",
                3: "ALT4",
                2: "ALT5"
            };
            return int_to_mode[mode];
        },
        initGpio: function(){
            for (var key in gpio_header) {
                // skip loop if the property is from prototype
                if (!gpio_header.hasOwnProperty(key)) continue;

                this.gpioData[key] = {};
                var gpio_pin = new Gpio(key);

                var success = true;
                try {
                    this.gpioData[key].mode = this.gpioIntToMode(gpio_pin.getMode());
                } catch (exception) {
                    console.log ("Error retrieving mode for GPIO#" + key + ": " +  exception);
                }
                try {
                    this.gpioData[key].digitalValue = gpio_pin.digitalRead();
                } catch (exception) {
                    console.log ("Error retrieving digital value for GPIO#" + key + ": " +  exception);
                }
                try {
                    this.gpioData[key].pwmRange = gpio_pin.getPwmRange();
                } catch (exception) {
                    // If a PWM range cannot be queried, then do not store this as a GPIO pin
                    success = false;
                    console.log ("Error retrieving PWM range for GPIO#" + key + ": " +  exception);
                }

                if (success) {
                    if (this.gpioData[key].mode == "OUTPUT") {
                        try {
                            this.gpioData[key].pwmValue = gpio_pin.getPwmDutyCycle();
                        } catch (exception) {
                            console.log ("Error retrieving PWM value for GPIO#" + key + ": " +  exception);
                        }
                    }

                    this.gpioPins [key] = gpio_pin;
                } else {
                    delete this.gpioData[key];
                }
            }
            return {
                gpioData: this.gpioData,
                gpioPins: this.gpioPins
            };
        }
    };

    return gpio;
}

module.exports = GpioHelper();