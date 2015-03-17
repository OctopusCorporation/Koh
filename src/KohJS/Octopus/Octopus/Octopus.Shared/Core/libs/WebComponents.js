(function () {
    var elements = document.querySelectorAll('link[rel=import]');
    var shadowDom = null;

    if (elements.length > 0) {
        //shadowDom = document.querySelector("body").innerHTML;
        //WinJS.Utilities.setInnerHTMLUnsafe(document.querySelector("body"), '<shadow-root></shadow-root>');

        var xhr = [];
        for (i = 0; i < elements.length; i++) {
            (function (i) {
                xhr[i] = new XMLHttpRequest();
                url = elements[i].href;;
                xhr[i].open("GET", url, true);
                xhr[i].onreadystatechange = function () {
                    if (xhr[i].readyState == 4 && xhr[i].status == 200) {
                        //Get the target from the tag
                        var target = elements[i].dataset.target;

                        //Create the shadow-root for inject the code
                        WinJS.Utilities.setInnerHTMLUnsafe(document.querySelector(target), '<shadow-root></shadow-root>');

                        //Get the current shadow-root
                        shadowDom = document.getElementsByTagName("shadow-root")[i];

                        MSApp.execUnsafeLocalFunction(function () {                            
                            var string = xhr[i].responseText;
                            if (string !== undefined) {

                                // Inject the Component
                                shadowDom.innerHTML = xhr[i].responseText;

                                // Evaluate all inline-scripts
                                var scripts2Evaluate = shadowDom.getElementsByTagName('script');
                                for (var n = 0; n < scripts2Evaluate.length; n++)
                                    eval(scripts2Evaluate[n].innerHTML)
                            }
                            
                        });
                        
                    }
                };
                xhr[i].send();
            })(i);
        }
    }

})();