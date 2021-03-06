const Shell = imports.gi.Shell;
const Lang = imports.lang;
const Meta = imports.gi.Meta;

let config = [
    {
        match: 'firefox.desktop',
        action: 'alternate',
        remove_titlebar: true
    },
    {
        match: 'chromium-browser.desktop',
        action: 'alternate',
        remove_titlebar: true
    },
    {
        match: 'skypeforlinux.desktop',
        action: 'right',
        remove_titlebar: true
    },
    {
        match: 'spotify.desktop',
        action: 'left',
        remove_titlebar: true
    },
    {
        match: 'org.gnome.terminal.desktop',
        action: 'alternate',
        remove_titlebar: true
    },
    {
        match: 'deadbeef',
        match_title: true,
        action: 'right',
        remove_titlebar: true
    },
    {
        match: 'sublime_text.desktop',
        action: 'maximize',
        remove_titlebar: true
    },
    {
        match: 'hipchat4.desktop',
        //match_title: true,
        action: 'right',
        remove_titlebar: true
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
                    this._findAndProcess(display, window, true);
                    return false;
                }));
            }
            return;
        }

        let app_id = app.get_id() ? app.get_id().toLowerCase() : '';
        let title  = window.title ? window.title.toLowerCase() : '';
        
        let found = false;
        config.forEach(function(entry) {
            if ( (entry.match_title && title.match(entry.match)) || app_id.match(entry.match) ) {
                found = entry;
                return false;
            }
            return true;
        });
        if (!found) {
            log("Unmatched app_id(" + app_id + ")" + " title(" + title + ")");
            return;
        }

        if (found.remove_titlebar)
            window.set_hide_titlebar_when_maximized(true);
        
        switch (found.action) {
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
                if (found.lastRight) {
                    window.tile(Meta.TileMode.LEFT);
                    found.lastRight = false;
                }
                else {
                    window.tile(Meta.TileMode.RIGHT);
                    found.lastRight = true;
                }
            break;
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
