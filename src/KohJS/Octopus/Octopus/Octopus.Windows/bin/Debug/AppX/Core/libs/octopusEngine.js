//WinJS.Application.addEventListener("fullViewPossibleChanged", function (data) {
//    console.log(data);
//});

//WinJS.Application.queueEvent({ type: "fullViewPossibleChanged", data: { test: 1 } });

var Octopus = WinJS.Class.define(function (octo) {
    this.octo = octo;
    this.stardust = this.octo.Stardust;
    this.connected = false;
    this.disconnected = true;
    this.socket = null;
    this.scripts = ['Core/libs/WebComponents.js', 'Core/libs/socket.io.js'];
},
{
    engine: function () {
        this.socket = io(this.stardust);

        this.socket.on('connect', function () {
            WinJS.Application.queueEvent("StarDust.Connected");
        });

        this.socket.on('Welcome', function (data) {
            WinJS.Application.queueEvent({ type: "Stardust.Say", Message: data.Message });
        });

        this.socket.on('command.KohJS', function (data) {
            WinJS.Application.queueEvent({type: data.Command, Frame : {Command: data.Command, Values: data.Values} })
        });
    },
    emit: function (command, data) {
        this.socket.emit('command.KohJS.Hy', { Command: command, Values: data });
    },
    require: function () {
        // Insert the core scripts 
        //
        //http://www.html5rocks.com/en/tutorials/speed/script-loading/
        var src;
        var script;
        var pendingScripts = [];
        var firstScript = document.scripts[0];

        // Watch scripts load in IE
        function stateChange() {
            // Execute as many scripts in order as we can
            var pendingScript;
            while (pendingScripts[0] && pendingScripts[0].readyState == 'loaded') {
                pendingScript = pendingScripts.shift();
                // avoid future loading events from this script (eg, if src changes)
                pendingScript.onreadystatechange = null;
                // can't just appendChild, old IE bug if element isn't closed
                firstScript.parentNode.insertBefore(pendingScript, firstScript);
            }
        }

        // loop through our script urls
        while (src = this.scripts.shift()) {
            if ('async' in firstScript) { // modern browsers
                script = document.createElement('script');
                script.async = false;
                script.src = src;
                document.head.appendChild(script);
            }
            else if (firstScript.readyState) { // IE<10
                // create a script and add it to our todo pile
                script = document.createElement('script');
                pendingScripts.push(script);
                // listen for state changes
                script.onreadystatechange = stateChange;
                // must set src AFTER adding onreadystatechange listener
                // else we’ll miss the loaded event for cached scripts
                script.src = src;
            }
            else { // fall back to defer
                document.write('<script src="' + src + '" defer></' + 'script>');
            }
        }
    }
}
);

WinJS.Class.mix(Octopus);