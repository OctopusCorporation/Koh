//WinJS.Application.addEventListener("fullViewPossibleChanged", function (data) {
//    console.log(data);
//});

//WinJS.Application.queueEvent({ type: "fullViewPossibleChanged", data: { test: 1 } });

(function () {
    var connected = false;
    var disconnected = true;
    var socket = null;

    var initialSettings = null;
    var globalSettings = null;
    var userSettings = null;
    var updater = null;
    var systemHostList = null;

    WinJS.Namespace.define("Octopus.Core", {
        Initialize: function () {
            Octopus.Core.SettingUpApp();
            //
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        SettingUpApp: function () {
            

            // Add the necesary libraries 
            Octopus.Utils.ReadConfigFile(function (libraries) {
                Octopus.Core.Require(libraries);

                // Verify is test user or real user
                Octopus.Utils.ReadConfigFile(function (initial) {
                    initialSettings = initial;

                    // Get the global settings
                    Octopus.Utils.ReadConfigFile(function (global) {
                        globalSettings = global;

                        // Get user information
                        Octopus.Utils.ReadConfigFile(function (user) {
                            userSettings = user;

                            Octopus.Core.InitializePrimarySocket();

                        }, "/Settings/UserSettings.json");
                    }, "/Settings/GlobalSettings.json");
                }, "/Settings/InitialSettings.json");

            }, "/Settings/Libraries.json");
                        
            // Check the system host and verify system updates
            Octopus.Utils.ReadConfigFile(function (hosts) {
                systemHostList = hosts;

                Octopus.Utils.ReadConfigFile(function (response) {
                    updater = response;
                }, "/Settings/Updater.json");

            }, "/Settings/SystemHostSettings.json");
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        InitializePrimarySocket: function () {
            var url = "";
            if (globalSettings.IsTestUser) {
                for (var key in userSettings.TestUser.StardustHUB) {
                    if (userSettings.TestUser.StardustHUB[key].isPrimary === true) {
                        url = 'http://' + userSettings.TestUser.StardustHUB[key].Host + ':' + userSettings.TestUser.StardustHUB[key].Port + '/';
                    }
                }
            }
            else {
                for (var key in userSettings.User.StardustHUB) {
                    if (userSettings.User.StardustHUB[key].isPrimary === true) {
                        url = 'http://' + userSettings.User.StardustHUB[key].Host + ':' + userSettings.User.StardustHUB[key].Port + '/';
                    }
                }
            }
            
            socket = io(url);
            Octopus.Core.Socket();
        },
        Socket: function () {
            
            socket.on('connect', function () {
                WinJS.Application.queueEvent("StarDust.Connected");
            });

            socket.on('Welcome', function (data) {
                WinJS.Application.queueEvent({ type: "Stardust.Say", Message: data.Message });
            });

            socket.on('command.KohJS', function (data) {
                WinJS.Application.queueEvent({type: data.Command, Frame : {Command: data.Command, Values: data.Values} })
            });
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        Require: function (scripts) {
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

            // loop through script urls
            for (var groupScripts in scripts) {
                for (var JSscript in scripts[groupScripts]) {
                    src = scripts[groupScripts][JSscript].Path;

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
    })

    WinJS.Namespace.define("Octopus", {
        emit: function (command, data) {
            socket.emit('command.KohJS.Hy', { Command: command, Values: data });
        }
    })

    WinJS.Namespace.define("Octopus.Utils", {
        ReadConfigFile: function (callback, fileName) {
            if (fileName != undefined) {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        callback(JSON.parse(xhr.responseText));
                    }
                };
                xhr.open("GET", fileName, false);
                xhr.send();
            }
        }
    })

    //WinJS.Namespace.define("Octopus", {
    //    nameMethod: function () {
    //        // do something
    //    }
    //})
})();
