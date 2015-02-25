(function () {
    var elements = document.querySelectorAll('link[rel=import]');
    var shadowDom = null;

    if (elements.length > 0) {
        shadowDom = document.querySelector("body").innerHTML;
        //WinJS.Utilities.setInnerHTMLUnsafe(document.querySelector("body"), '<shadow-root></shadow-root>');
        WinJS.Utilities.setInnerHTMLUnsafe(document.querySelector("body"), '<shadow-root></shadow-root>');

        var xhr = [];
        for (i = 0; i < elements.length; i++) {
            (function (i) {
                xhr[i] = new XMLHttpRequest();
                url = elements[i].href;;
                xhr[i].open("GET", url, true);
                xhr[i].onreadystatechange = function () {
                    if (xhr[i].readyState == 4 && xhr[i].status == 200) {
                        shadowDom = document.getElementsByTagName("shadow-root")[0].innerHTML;

                        //WinJS.Utilities.setInnerHTMLUnsafe(document.querySelector("shadow-root"), shadowDom + xhr[i].responseText);
                        document.getElementsByTagName("shadow-root")[0].innerHTML = window.toStaticHTML(shadowDom + xhr[i].responseText);
                    }
                };
                xhr[i].send();
            })(i);
        }
    }

})();