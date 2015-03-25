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
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        SettingUpApp: function () {
            var installFolder = Windows.ApplicationModel.Package.current.installedLocation;
            var applicationData = Windows.Storage.ApplicationData.current;
            var localFolder = applicationData.localFolder;
            

            var updaterRoute = "Updater.json";
            var systemHostSettingsRoute = "SystemHostSettings.json";

            

            Octopus.Utils.ReadConfigFile(function (global) {
                globalSettings = global;
                
                console.log("Global settings loaded");

                // Get user information
                Octopus.Utils.ReadConfigFile(function (user) {
                    userSettings = user;

                    console.log("user settings loaded");

                    Octopus.Core.InitializeHome(function (e) {
                        Octopus.Core.InitializePrimarySocket();
                    });
                }, localFolder, "_UserSettings.json");

                Octopus.Utils.ReadConfigFile(function (initial) {
                    initialSettings = initial;
                    console.log("initial settings loaded");
                }, localFolder, "InitialSettings.json");
                // Add the necesary libraries 
                //Octopus.Utils.ReadConfigFile(function (libraries) {
                    //Octopus.Core.Require(libraries);

                    // Verify is test user or real user

                //}, localFolder, "Libraries.json");

            }, localFolder, "GlobalSettings.json");

           
                        
            // Check the system host and verify system updates
            Octopus.Utils.ReadConfigFile(function (hosts) {
                systemHostList = hosts;

                Octopus.Utils.ReadConfigFile(function (response) {
                    updater = response;
                }, updaterRoute );

            },systemHostSettingsRoute );
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
                Octopus.MessageBox.Show("Primary stardust HUB", "Is connected successfully", "success")
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
        ReadConfigFile: function (callback, folder, fileName) {
            if (fileName != undefined) {

                folder.getFolderAsync("Settings").then(function (settingsFolder) {
                    settingsFolder.getFileAsync(fileName).then(function (settingsFile) {
                        Windows.Storage.FileIO.readTextAsync(settingsFile).then(function (text) {
                            callback(JSON.parse(text));
                        });
                    });
                    
                }, function (e) {
                    folder.createFolderAsync("Settings", Windows.Storage.CreationCollisionOption.OpenIfExists).done(function (localSettingsFolder) {

                        Octopus.Utils.CopyFilesToFolder(function () {
                            var installFolder = Windows.Storage.ApplicationData.current.localFolder;

                            installFolder.getFolderAsync("Settings").then(function (settingsFolder) {
                                settingsFolder.getFileAsync(fileName).then(function (settingsFile) {
                                    Windows.Storage.FileIO.readTextAsync(settingsFile).then(function (text) {
                                        callback(JSON.parse(text));
                                    });
                                });
                                
                            });
                        }, "Settings", Windows.ApplicationModel.Package.current.installedLocation, localSettingsFolder);

                    })
                });
                
                
            }
        }
    })

    WinJS.Namespace.define("Octopus.Utils", {
        CleanContent: function () {
            //document.querySelector("#mainContent_>shadow-root").remove();
        }
    })

    WinJS.Namespace.define("Octopus.Utils", {
        CleanPage: function () {
            try { document.querySelector("#mainContainer_>shadow-root").remove(); }
            catch (err) { }
        }
    })

    WinJS.Namespace.define("Octopus.MessageBox", {
        Show: function (title, message, type) {
            if (toastr) {
                toastr.options = {
                    "closeButton": true,
                    "debug": false,
                    "newestOnTop": true,
                    "progressBar": false,
                    "positionClass": "toast-top-right",
                    "preventDuplicates": true,
                    "onclick": null,
                    "showDuration": "300",
                    "hideDuration": "1000",
                    "timeOut": "5000",
                    "extendedTimeOut": "1000",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"
                }

                toastr[type](message, title)
            }
            
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        GetAllApps: function (target) {
            if (userSettings != null) {
                if (target != undefined) {
                    if (globalSettings.IsTestUser) {
                        var html = '';
                        if (userSettings.TestUser.Apps.length>0) {
                            html = '<div class="row">';
                            for (var key in userSettings.TestUser.Apps) {
                                var item = userSettings.TestUser.Apps[key];

                                Octopus.Core.GetAppInformation(function (appInfo) {
                                    html +=
                                            '<div class="col-lg-4">' +
                                            '<section class="panel panel-default">' +
                                                '<header class="panel-heading">' +
                                                    '<div class="nav nav-pills pull-right" style="margin-right:0px;padding-top:5px;"> ' +
                                                            '<a href="#" style="font-size:14px;margin-right:5px;"><i class="i i-bars3 icon"></i></a><a href="#" onclick="javascipt: Octopus.Core.DeleteApp(\'' + item.ProjectName + '\')" style="font-size: 16px;"><i class="fa fa-times"></i></a>' +
                                                    '</div> ' + item.DisplayName +
                                                '</header>' +

                                                '<div class="panel-body" onclick="javascript: Octopus.Core.LoadComponent(\'Apps/' + item.ProjectName + '/' + appInfo.Application.StartPage + '\', \'' + appInfo.MinimumOctoApp + '\')" style="cursor:pointer; height:213px;background: url(Apps/' + item.ProjectName + '/' + appInfo.Application.VisualElements.WideLogo + ') no-repeat;">' +
                                                    '<div class="clearfix text-center m-t">' + appInfo.Description + '</div>' +
                                                '</div>' +
                                            '</section>' +
                                            '</div>';

                                }, "ms-appdata:///local/" + "/Apps/" + item.ProjectName + "/" + item.Manifest);
                            }
                            html += '</div>';
                        }
                        else {
                            html = '<h1>Welcome to Octopus</h1><a href="#" onclick="javascript: Octopus.NavigateTo(\'store\')" class="btn btn-s-md btn-info">Try to download your first app!</a>';
                        }
                        
                        MSApp.execUnsafeLocalFunction(function () {
                            document.querySelector(target).innerHTML = html;
                        });
                    }
                    else {
                        var html = '<div class="row">';
                        for (var key in userSettings.User.Apps) {
                            var item = userSettings.User.Apps[key];

                            Octopus.Core.GetAppInformation(function (appInfo) {
                                html +=
                                        '<div class="col-lg-4">' +
                                        '<section class="panel panel-default">' +
                                            '<header class="panel-heading">' +
                                                '<div class="nav nav-pills pull-right" style="margin-right:0px;padding-top:5px;"> ' +
                                                        '<a href="#" style="font-size:14px;margin-right:5px;"><i class="i i-bars3 icon"></i></a><a href="#" onclick="javascipt: Octopus.Core.DeleteApp(\'' + item.ProjectName + '\')" style="font-size: 16px;"><i class="fa fa-times"></i></a>' +
                                                '</div> ' + item.DisplayName +
                                            '</header>' +

                                            '<div class="panel-body" onclick="javascript: Octopus.Core.LoadComponent(\'Apps/' + item.ProjectName + '/' + appInfo.Application.StartPage + '\')" style="cursor:pointer; height:213px;background: url(Apps/' + item.ProjectName + '/' + appInfo.Application.VisualElements.WideLogo + ') no-repeat;">' +
                                                '<div class="clearfix text-center m-t">' + appInfo.Description + '</div>' +
                                            '</div>' +
                                        '</section>' +
                                        '</div>';

                            }, "ms-appdata:///local/" + "/Apps/" + item.ProjectName + "/" + item.Manifest);
                        }
                        html += '</div>';
                        MSApp.execUnsafeLocalFunction(function () {
                            document.querySelector(target).innerHTML = html;
                        });
                    }
                }
                else {
                    Octopus.MessageBox.Show("Error", "Target for apps is undefined", "error")
                }
            }
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        GetAppInformation: function (callback, manifest) {
            if (manifest != undefined) {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        callback(JSON.parse(xhr.responseText));
                    }
                };
                xhr.open("GET", manifest, false);
                xhr.send();
            }
        }
    })

    WinJS.Namespace.define("Octopus.Apps.Store", {
        GetAllApps: function () {
            var xhr = new XMLHttpRequest();
            url = "http://octostore.azurewebsites.net/api/OctoApp"
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var apps = JSON.parse(xhr.responseText);
                    var html = "";
                    apps.forEach(function (app) {
                        html +=
                            '<article class="media">' +
                                '<span class="pull-left thumb-sm"><i class="fa fa-cube fa-3x icon-muted"></i></span>' +
                                '<div class="media-body">' +
                                    '<div class="pull-right media-xs text-center text-muted">' +
                                        '<a href="#" id="down-' + app.Id + '" onclick="javascript: Octopus.Core.DownloadApp(\'' + app.Id + '\', \'' + app.ProjectName + '\', \'' + app.DisplayName + '\')" class="btn btn-s-md btn-primary">' +
                                            '<i class="i i-download2"></i> Download' +
                                        '</a>' +
                                    '</div> ' +
                                    '<a href="#" class="h4">' + app.DisplayName + '</a> ' +
                                    '<small class="block">' +
                                        '<a href="#" class="">' + app.Version + '</a> ' +
                                        '<span class="label label-info">' + app.PlatformType + '</span>' +
                                    '</small> ' +
                                    '<small class="block m-t-sm">' + app.Description + '</small>' +
                                '</div>' +
                            '</article>';
                    });
                    MSApp.execUnsafeLocalFunction(function () {
                        document.querySelector("#appsContainer").innerHTML = html;
                    });
                }
            };
            xhr.send();
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        LoadComponent: function (component, minimumOctoApp) {
            var validate = true;
            if (minimumOctoApp == undefined) {
                validate = false;
            }
            if (validate) {
                if (minimumOctoApp.split('.')[3] > globalSettings.OctoAppVersion.split('.')[3]) {
                    Octopus.MessageBox.Show("Ups", "You have an older version of this app, please update.", "error");
                    return;
                }
            }
            
            Octopus.Utils.CleanContent();

            var xhr = new XMLHttpRequest();
            url = component
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    //Get the target from the tag
                    var target = '#mainContent_';

                    //Create the shadow-root for inject the code
                    WinJS.Utilities.setInnerHTMLUnsafe(document.querySelector(target), '<shadow-root></shadow-root>');

                    //Get the current shadow-root
                    shadowDom = document.querySelector("#mainContent_>shadow-root");

                    MSApp.execUnsafeLocalFunction(function () {
                        var string = xhr.responseText;
                        if (string !== undefined) {

                            // Inject the Component
                            shadowDom.innerHTML = xhr.responseText;

                            // Evaluate all inline-scripts
                            var scripts2Evaluate = shadowDom.getElementsByTagName('script');
                            for (var n = 0; n < scripts2Evaluate.length; n++)
                                eval(scripts2Evaluate[n].innerHTML)
                        }

                    });

                }
            };
            xhr.send();
            
        }
    })

    WinJS.Namespace.define("Octopus", {
        NavigateTo: function (component) {
            switch (component.toLowerCase()) {
                case 'apps':
                    Octopus.Core.LoadComponent('/Core/Components/apps.html');
                    break;
                case 'store':
                    Octopus.Core.LoadComponent('/Core/Components/store.html');
                    break;
                case 'settings':
                    Octopus.Core.LoadComponent('/Core/Components/settings.html');
                default:
                    break;
            }
            
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        DeleteApp: function (app) {
            // Delete Folder App
            var localFolder = Windows.Storage.ApplicationData.current.localFolder;
            localFolder.getFolderAsync('Apps\\' + app).then(function (folder) {
                return folder.deleteAsync();
            }).done(function () {

                // Edit User settings
                if (globalSettings.IsTestUser) {
                    for (var key in userSettings.TestUser.Apps) {
                        var item = userSettings.TestUser.Apps[key];

                        if (item.ProjectName === app) {
                            userSettings.TestUser.Apps.splice(key, 1);
                        }
                    }
                }
                else {
                    for (var key in userSettings.User.Apps) {
                        var item = userSettings.TestUser.Apps[key];

                        if (item.ProjectName === app) {
                            userSettings.TestUser.Apps.splice(key, 1);
                        }
                    }
                }
                localFolder.getFolderAsync('Settings').then(function (folder) {
                    folder.getFileAsync('_UserSettings.json').then(function (file) {
                        var text = JSON.stringify(userSettings);
                        Windows.Storage.FileIO.writeTextAsync(file, text).then(function () {
                            Octopus.MessageBox.Show("App deleted", "", "info");
                            Octopus.NavigateTo("apps");
                        });
                    })
                });
                
            }, function (err) {
                Octopus.MessageBox.Show("Ups", err, "error");
            });
        }
    })

    WinJS.Namespace.define("Octopus.Utils", {
        CopyFilesToFolder: function (callback, folder, fromFolder, toFolder) {
            if (folder == null)
                return;

            fromFolder.getFolderAsync("Settings").then(function (installedFolder) {
                installedFolder.getFilesAsync().then(function (files) {
                    if (files != null) {
                        files.forEach(function (file) {
                            console.log("copy file: " + file.displayName);
                            file.copyAsync(toFolder).then(function (file) {
                                // file ok
                            }, function (e) {
                                console.log(e);
                            });
                        });
                        callback();
                    }
                });
            })
        }
    })

    WinJS.Namespace.define("Octopus", {
        GetPath: function () {
            if (globalSettings.IsTestUser) {
                return '/Apps/' + userSettings;
            }
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        DownloadApp: function (idApp, projectName, displayName) {
            MSApp.execUnsafeLocalFunction(function () {
                var selector = "#down-" + idApp;
                var button = document.querySelector(selector);
                button.innerHTML = '<i class="i i-spin spin"></i> Downloading...';
            });
            
            var url = "http://octostore.azurewebsites.net/api/OctoBinaryApp?idBinary=" + idApp;
            var download = null;
            var promise = null;

            var localFolder = Windows.Storage.ApplicationData.current.localFolder;
            localFolder.getFolderAsync('Apps').done(function (folder) {
                try {
                    folder.createFileAsync(projectName + ".zip", Windows.Storage.CreationCollisionOption.replaceExisting).done(function (newFile) {
                        var uri = Windows.Foundation.Uri(url);
                        var downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();

                        
                        download = downloader.createDownload(uri, newFile);

                        promise = download.startAsync().then(function (data) {
                            
                            // Uncompress the zip downloaded
                            var compress = new CompressRT.UnCompresser();
                            compress.uncompress(newFile, folder).then(function (er) {
                                Octopus.MessageBox.Show("Store", "App downloaded successfully", "info");

                                // Edit User settings
                                if (globalSettings.IsTestUser) {
                                    var id = "" + idApp;
                                    userSettings.TestUser.Apps.push({ "_Id": id, "ProjectName": projectName, "DisplayName": displayName, "Manifest": "OctoPackage.manifest" })
                                }
                                else {
                                    var id = "" + idApp;
                                    userSettings.TestUser.Apps = userSettings.User.Apps.push({ "_Id": id, "ProjectName": projectName, "DisplayName": displayName, "Manifest": "OctoPackage.manifest" })
                                }

                                var localFolder = Windows.Storage.ApplicationData.current.localFolder;
                                localFolder.getFolderAsync('Settings').then(function (folder) {
                                    folder.getFileAsync('_UserSettings.json').then(function (file) {
                                        var text = JSON.stringify(userSettings);
                                        Windows.Storage.FileIO.writeTextAsync(file, text).then(function () {
                                            newFile.deleteAsync();
                                            Octopus.MessageBox.Show("Store", "App successfully installed!, enjoy!", "info");
                                            Octopus.NavigateTo("apps");
                                        });
                                    })
                                });
                            },
                            function (prog) {
                                console.log(prog);
                            });

                        });
                    }, function (error) {
                        Octopus.MessageBox.Show("Error", error, "info");
                    });
                } catch (err) {
                    Octopus.MessageBox.Show("Error", err, "info");
                }
            }, function () {
                localFolder.createFolderAsync('Apps').done(function (folder) {
                    Octopus.Core.DownloadApp(idApp, projectName, displayName)
                })
            })
            
            
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        GetComponent: function (component, target, callback) {
            //Octopus.Utils.CleanPage();

            var xhr = new XMLHttpRequest();
            url = component
            xhr.open("GET", url, false);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    
                    //Create the shadow-root for inject the code
                    WinJS.Utilities.setInnerHTMLUnsafe(document.querySelector(target), '<shadow-root></shadow-root>');

                    //Get the current shadow-root
                    shadowDom = document.querySelector(target + ">shadow-root");

                    MSApp.execUnsafeLocalFunction(function () {
                        var string = xhr.responseText;
                        if (string !== undefined) {

                            // Inject the Component
                            shadowDom.innerHTML = xhr.responseText;

                            // Evaluate all inline-scripts
                            var scripts2Evaluate = shadowDom.getElementsByTagName('script');
                            for (var n = 0; n < scripts2Evaluate.length; n++)
                                eval(scripts2Evaluate[n].innerHTML)
                            
                        }
                        
                    });
                    try {
                        callback(true);
                    }
                    catch (err) { }
                }
            };
            xhr.send();
        }
    })

    WinJS.Namespace.define("Octopus.Core", {
        InitializeHome: function (callback) {
            console.log("Initialize home");
            if (globalSettings.IsTestUser) {
                Octopus.Core.GetComponent("/Core/Components/home.html", "#mainContainer_", function (e) {
                    callback(true);
                })
            }
            else {
                Octopus.Core.GetComponent("/Core/Components/signup.html", "#mainContainer_")
            }
        }
    })
   
    WinJS.Namespace.define("Octopus.Core", {
        ChangePrimaryHUB: function () {
            var localFolder = Windows.Storage.ApplicationData.current.localFolder;
            var ip = document.querySelector("#ipHUB").value;
            userSettings.TestUser.StardustHUB = [{ "_Id": "01", "Host": ip, "Port": "3000", "isPrimary": true }];

            localFolder.getFolderAsync('Settings').then(function (folder) {
                folder.getFileAsync('_UserSettings.json').then(function (file) {
                    var text = JSON.stringify(userSettings);
                    Windows.Storage.FileIO.writeTextAsync(file, text).then(function () {
                        Octopus.Core.InitializePrimarySocket();
                        Octopus.MessageBox.Show("HUB message", "IP Address is loaded successfully", "info");
                        Octopus.NavigateTo("apps");
                    });
                })
            });
        }
    })

    //WinJS.Namespace.define("Octopus", {
    //    nameMethod: function () {
    //        // do something
    //    }
    //})
})();
