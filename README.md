# Koh
High level app used like Front-End in the platform

## Koh.JS
When you develop with Koh.js project template you need to know and follow few simple steps.

### Change server DNS
1. Go to Octopus.Shared
2. On the line 8 check the object like { Stardust : "..."}, change the value for your DNS

### Listen an event
1. On your Component declare a script tag
2. Depending of documentation of Component declare the listener
3. Check in the example code how to call a value from message
 
```js
WinJS.Application.addEventListener("command.nameOfEvent", function (data) {
    if (data.Frame.Command === 'command.nameOfEvent') {
        // Call the value in the Values array
        var valueFromStardust = data.Frame.Values[0].nameOfProperty;
    }
});
```

### Send an event
Declare when you need send an event to Stardust HUB
```js
octo.emit('command.nameOfEvent', [{ nameOfProperty: true, nameOfProperty2: "someValue", ... }]);
```
