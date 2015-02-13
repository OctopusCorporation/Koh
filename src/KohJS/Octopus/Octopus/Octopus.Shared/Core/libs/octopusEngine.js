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
    }
}
);

WinJS.Class.mix(Octopus);