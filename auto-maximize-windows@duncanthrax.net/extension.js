const Shell = imports.gi.Shell;
const Lang = imports.lang;
const Meta = imports.gi.Meta;

let config = [
    {
        match: 'firefox.desktop',
        action: 'alternate'
    },
    {
        match: 'gnome-terminal.desktop',
        action: 'alternate'
    },
    {
        match: 'deadbeef.desktop',
        action: 'right'
    },
    {
        match: 'sublime_text.desktop',
        action: 'maximize'
    },
    {
        match: 'org.gnome.nautilus.desktop',
        action: 'alternate'
    }
];

const WindowMaximizer = new Lang.Class({
    Name: 'AutoMaximizeWindows.WindowMaximizer',

    _init: function() {
        this._windowTracker = Shell.WindowTracker.get_default();

        let display = global.screen.get_display();
        // Connect after so the handler from ShellWindowTracker has already run
        this._windowCreatedId = display.connect_after('window-created', Lang.bind(this, this._findAndProcess));
    },

    destroy: function() {
        if (this._windowCreatedId) {
            global.screen.get_display().disconnect(this._windowCreatedId);
            this._windowCreatedId = 0;
        }
    },

    _findAndProcess: function(display, window, noRecurse) {
        if (window.skip_taskbar)
            return;

        let app = this._windowTracker.get_window_app(window);
        if (!app) {
            if (!noRecurse) {
                // window is not tracked yet
                Mainloop.idle_add(Lang.bind(this, function() {
                    this._findAndMove(display, window, true);
                    return false;
                }));
            } else
                log('Cannot find application for window');
            return;
        }
        let app_id = app.get_id().toLowerCase();

        let foundMatch = false;

        config.forEach(function(entry) {
            if (app_id.match(entry.match)) {
                foundMatch = true;
                log(entry.action + ":" + app_id);
                switch (entry.action) {
                    case 'left':
                        window.tile(Meta.TileMode.LEFT);
                        break;
                    case 'right':
                        window.tile(Meta.TileMode.RIGHT);
                        break;
                    case 'maximize':
                        window.maximize(Meta.MaximizeFlags.BOTH);
                        break;
                    case 'alternate':
                        if (entry.lastRight) {
                            window.tile(Meta.TileMode.LEFT);
                            entry.lastRight = false;
                        }
                        else {
                            window.tile(Meta.TileMode.RIGHT);
                            entry.lastRight = true;
                        }
                    break;
                }
            }
        });

        if (!foundMatch) {
            log("Unmatched:" + app_id);
        }
    }
});

let winMaximizer;
function init() {}

function enable() {
    winMaximizer = new WindowMaximizer();
}

function disable() {
    winMaximizer.destroy();
}
